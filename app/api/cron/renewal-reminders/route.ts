import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { sendEmail } from '@/lib/email';
import {
  getDaysUntilExpiration,
  getReminderType,
  buildDomainReminderEmail,
  buildHostingReminderEmail,
  buildAdminReminderEmail,
  buildDomainHealthCheckEmail,
  type AdminReminderItem,
} from '@/lib/renewal-reminder-email';
import { pingDomain } from '@/lib/domain-ping';

/**
 * Cron endpoint: sends renewal reminders to clients whose domains or hosting
 * are due for renewal, executed strictly on days 1, 10, and 20 of each month.
 *
 * Cadence:
 * - Days 1, 10, 20: Sends reminders for services expiring in the next 30 days
 *   (or recently expired within 30 days):
 *   - 11 to 30 days: Standard reminder (preventive notice).
 *   - 4 to 10 days: Urgent warning ("Solo quedan X días").
 *   - 1 to 3 days: Imminent expiration / tomorrow warning.
 *   - <= 0 days: Service expired notice.
 * - Days 1 and 20: Domain health check ping for all active domains sent to admins.
 * - Bypass: Append `?force=true` to force execution outside of days 1, 10, and 20.
 *
 * Call from Vercel Cron or external service (cron-job.org, etc.):
 * GET /api/cron/renewal-reminders
 * Header: Authorization: Bearer <CRON_SECRET>
 */

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace(/^Bearer\s+/i, '');
      if (token !== cronSecret) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }

    const settings = await getSettings();
    const enabled = settings.renewal_reminder_enabled === 'true' || settings.renewal_reminder_enabled === '1';

    const companyName = settings.company_name || 'Admin';
    const logoUrl = settings.logo_url || '';
    const logoFullUrl = logoUrl?.startsWith('http') ? logoUrl : logoUrl ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://instanceshape.com'}${logoUrl}` : '';
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://instanceshape.com').replace(/\/$/, '');

    let sent = 0;
    const byDay: Record<number, number> = {};
    let healthCheckSent = 0;

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ENABLED' },
      select: { email: true },
    });
    const adminEmails = admins.map((a) => a.email).filter(Boolean);

    const itemsExpiringSoon: AdminReminderItem[] = [];
    const itemsUrgentOrExpired: AdminReminderItem[] = [];

    const today = new Date();
    const dayOfMonth = today.getDate();
    const force = request.nextUrl.searchParams.get('force') === 'true';

    // Regla de negocio: los recordatorios se envían exclusivamente los días 1, 10 y 20 de cada mes
    const isReminderDay = dayOfMonth === 1 || dayOfMonth === 10 || dayOfMonth === 20;
    if (!isReminderDay && !force) {
      return NextResponse.json({
        message: `Hoy (día ${dayOfMonth}) no es fecha de envío de recordatorios. Los recordatorios se envían los días 1, 10 y 20 de cada mes. Usa ?force=true para forzar ejecución manual.`,
        sent: 0,
        healthCheckSent: 0,
        byDay: {},
      });
    }

    // Domain health check: días 1 y 20 de cada mes (o con ?force=true)
    if (dayOfMonth === 1 || dayOfMonth === 20 || force) {
      const allDomains = await prisma.domain.findMany({
        include: { user: { select: { fullName: true } } },
      });
      const healthItems: { fqdn: string; clientName: string; statusCode: number | null; daysLeft: number }[] = [];
      for (const d of allDomains) {
        const statusCode = await pingDomain(d.fqdn);
        const daysLeft = getDaysUntilExpiration(new Date(d.nextBillingDate));
        healthItems.push({
          fqdn: d.fqdn,
          clientName: d.user.fullName,
          statusCode,
          daysLeft,
        });
      }
      if (healthItems.length > 0 && adminEmails.length > 0) {
        const { subject, html } = buildDomainHealthCheckEmail({
          companyName,
          logoFullUrl,
          appUrl,
          basePath,
          items: healthItems,
          date: today,
        });
        for (const adminEmail of adminEmails) {
          await sendEmail({ to: adminEmail, subject, html });
          healthCheckSent++;
        }
      }
    }

    if (!enabled) {
      return NextResponse.json({
        message: 'Recordatorios desactivados en configuración',
        sent: healthCheckSent,
        healthCheckSent,
        byDay: {},
      });
    }

    // Domains
    const domains = await prisma.domain.findMany({
      where: { paymentStatus: { not: 'CANCELLED' } },
      include: { user: { select: { fullName: true, email: true } } },
    });

    for (const d of domains) {
      const expDate = new Date(d.nextBillingDate);
      const daysLeft = getDaysUntilExpiration(expDate);
      const type = getReminderType(daysLeft);
      if (!type) continue;

      const { subject, html } = buildDomainReminderEmail({
        companyName,
        logoFullUrl,
        clientName: d.user.fullName,
        fqdn: d.fqdn,
        expDate,
        daysLeft,
        type,
        appUrl,
        basePath,
        reactivationPenalty: settings.domain_reactivation_penalty,
      });
      await sendEmail({ to: d.user.email, subject, html });
      sent++;
      byDay[daysLeft] = (byDay[daysLeft] || 0) + 1;

      if (daysLeft <= 10 && daysLeft > 1) {
        itemsExpiringSoon.push({
          type: 'domain',
          id: d.id,
          clientName: d.user.fullName,
          clientEmail: d.user.email,
          identifier: d.fqdn,
          expDate,
          editUrl: `${appUrl}${basePath}/domains/${d.id}/edit`,
        });
      }
      if (daysLeft <= 1 && daysLeft >= -30) {
        itemsUrgentOrExpired.push({
          type: 'domain',
          id: d.id,
          clientName: d.user.fullName,
          clientEmail: d.user.email,
          identifier: d.fqdn,
          expDate,
          editUrl: `${appUrl}${basePath}/domains/${d.id}/edit`,
        });
      }
    }

    // Hosting
    const hostings = await prisma.hostingService.findMany({
      where: { paymentStatus: { not: 'CANCELLED' } },
      include: {
        user: { select: { fullName: true, email: true } },
        hostingPackage: { select: { name: true } },
      },
    });

    for (const h of hostings) {
      const expDate = new Date(h.nextBillingDate);
      const daysLeft = getDaysUntilExpiration(expDate);
      const type = getReminderType(daysLeft);
      if (!type) continue;

      const { subject, html } = buildHostingReminderEmail({
        companyName,
        logoFullUrl,
        clientName: h.user.fullName,
        packageName: h.hostingPackage.name,
        username: h.username,
        expDate,
        daysLeft,
        type,
        appUrl,
        basePath,
        reactivationPenalty: settings.domain_reactivation_penalty,
      });
      await sendEmail({ to: h.user.email, subject, html });
      sent++;
      byDay[daysLeft] = (byDay[daysLeft] || 0) + 1;

      if (daysLeft <= 10 && daysLeft > 1) {
        itemsExpiringSoon.push({
          type: 'hosting',
          id: h.id,
          clientName: h.user.fullName,
          clientEmail: h.user.email,
          identifier: `${h.hostingPackage.name} (${h.username})`,
          expDate,
          editUrl: `${appUrl}${basePath}/hosting/${h.id}/edit`,
        });
      }
      if (daysLeft <= 1 && daysLeft >= -30) {
        itemsUrgentOrExpired.push({
          type: 'hosting',
          id: h.id,
          clientName: h.user.fullName,
          clientEmail: h.user.email,
          identifier: `${h.hostingPackage.name} (${h.username})`,
          expDate,
          editUrl: `${appUrl}${basePath}/hosting/${h.id}/edit`,
        });
      }
    }

    for (const adminEmail of adminEmails) {
      if (itemsExpiringSoon.length > 0) {
        const { subject, html } = buildAdminReminderEmail({
          companyName,
          logoFullUrl,
          appUrl,
          basePath,
          kind: 'remind_user',
          items: itemsExpiringSoon,
        });
        await sendEmail({ to: adminEmail, subject, html });
        sent++;
      }
      if (itemsUrgentOrExpired.length > 0) {
        const { subject, html } = buildAdminReminderEmail({
          companyName,
          logoFullUrl,
          appUrl,
          basePath,
          kind: 'suspend_user',
          items: itemsUrgentOrExpired,
        });
        await sendEmail({ to: adminEmail, subject, html });
        sent++;
      }
    }

    return NextResponse.json({
      message: `Recordatorios enviados: ${sent}${healthCheckSent > 0 ? `, health check: ${healthCheckSent}` : ''}`,
      sent: sent + healthCheckSent,
      healthCheckSent,
      byDay,
    });
  } catch (error) {
    console.error('Renewal reminders cron error:', error);
    return NextResponse.json(
      { error: 'Error al enviar recordatorios' },
      { status: 500 }
    );
  }
}
