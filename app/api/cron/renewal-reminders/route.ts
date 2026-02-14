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
 * expire in 30, 15, 7, 5, 3, or 1 day(s). At 5 days: urgent "about to expire" message.
 * At 3 and 1 day: "domain/service has expired" notification.
 * Includes: avoid reactivation costs, avoid data loss, button to panel.
 *
 * Call from Vercel Cron or external service (cron-job.org, etc.):
 * GET /api/cron/renewal-reminders
 * Header: Authorization: Bearer <CRON_SECRET>
 *
 * Environment variables:
 * - CRON_SECRET: secret to authorize the request (required in production)
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

    const items7days: AdminReminderItem[] = [];
    const items1day: AdminReminderItem[] = [];

    // Domain health check: days 1 and 15 of each month
    const today = new Date();
    const dayOfMonth = today.getDate();
    if (dayOfMonth === 1 || dayOfMonth === 15) {
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
        message: 'Recordatorios desactivados',
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

      if (daysLeft === 7) {
        items7days.push({
          type: 'domain',
          id: d.id,
          clientName: d.user.fullName,
          clientEmail: d.user.email,
          identifier: d.fqdn,
          expDate,
          editUrl: `${appUrl}${basePath}/domains/${d.id}/edit`,
        });
      }
      if (daysLeft === 1) {
        items1day.push({
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

      if (daysLeft === 7) {
        items7days.push({
          type: 'hosting',
          id: h.id,
          clientName: h.user.fullName,
          clientEmail: h.user.email,
          identifier: `${h.hostingPackage.name} (${h.username})`,
          expDate,
          editUrl: `${appUrl}${basePath}/hosting/${h.id}/edit`,
        });
      }
      if (daysLeft === 1) {
        items1day.push({
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
      if (items7days.length > 0) {
        const { subject, html } = buildAdminReminderEmail({
          companyName,
          logoFullUrl,
          appUrl,
          basePath,
          kind: 'remind_user',
          items: items7days,
        });
        await sendEmail({ to: adminEmail, subject, html });
        sent++;
      }
      if (items1day.length > 0) {
        const { subject, html } = buildAdminReminderEmail({
          companyName,
          logoFullUrl,
          appUrl,
          basePath,
          kind: 'suspend_user',
          items: items1day,
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
