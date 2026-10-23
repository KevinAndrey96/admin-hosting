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
  buildMonthlyClientDigestEmail,
  type AdminReminderItem,
} from '@/lib/renewal-reminder-email';
import { generateAndSendDailyAdminReport } from '@/lib/daily-admin-report';

/**
 * Endpoint de Cron Automatizado de Azulática.
 *
 * Tareas:
 * 1. DIARIAMENTE: Envía al Administrador el Informe Ejecutivo Diario:
 *    - Monitor de salud de todos los sitios (HTTP ping con alerta si alguno está caído).
 *    - Estadísticas financieras: valores a recaudar y renovaciones en próximos 30 días.
 *    - Auditoría de inicios de sesión en el mes: quiénes y cuántas veces han accedido.
 *    - Tips y métricas clave de servidor (tráfico soportado, cuotas de correo, caché).
 * 2. DÍAS 1, 10 Y 20 DE CADA MES: Despacha recordatorios automáticos de cobro a clientes.
 * 3. DÍA 1 DE CADA MES (o con ?monthly=true): Envía el Resumen Mensual de Servicios a cada cliente,
 *    recordándole que puede ingresar al panel con su correo como usuario.
 *
 * Parámetros opcionales:
 * - ?force=true: Fuerza el despacho a clientes aunque no sea día 1, 10 o 20.
 * - ?monthly=true: Fuerza el envío del resumen mensual a clientes.
 * - ?token=... o ?secret=...: Token de autorización alternativo al header.
 */

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace(/^Bearer\s+/i, '');
      const queryToken = request.nextUrl.searchParams.get('token') || request.nextUrl.searchParams.get('secret');
      if (token !== cronSecret && queryToken !== cronSecret) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }

    const settings = await getSettings();
    const enabled = settings.renewal_reminder_enabled === 'true' || settings.renewal_reminder_enabled === '1';

    const companyName = settings.company_name || 'Azulática';
    const logoUrl = settings.logo_url || '';
    const logoFullUrl = logoUrl?.startsWith('http') ? logoUrl : logoUrl ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://instanceshape.com'}${logoUrl}` : '';
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://instanceshape.com').replace(/\/$/, '');

    // 1. INFORME EJECUTIVO DIARIO AL ADMINISTRADOR (Ejecutado cada día)
    const dailyReport = await generateAndSendDailyAdminReport({
      companyName,
      logoFullUrl,
      appUrl,
      basePath,
    });

    let sent = 0;
    const byDay: Record<number, number> = {};

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
    const isMonthlyParam = request.nextUrl.searchParams.get('monthly') === 'true';

    // 2. DISPATCH A CLIENTES: Recordatorios de vencimiento (días 1, 10, 20 o ?force=true) y Resumen mensual (día 1 o ?monthly=true)
    const isReminderDay = dayOfMonth === 1 || dayOfMonth === 10 || dayOfMonth === 20 || force;
    const isMonthlyDay = dayOfMonth === 1 || isMonthlyParam;

    if (!isReminderDay && !isMonthlyDay) {
      return NextResponse.json({
        message: `Informe diario enviado al administrador (${dailyReport.recipientsCount} admins). Hoy (día ${dayOfMonth}) no corresponde despacho de recordatorios a clientes ni resumen mensual. Usa ?force=true o ?monthly=true para forzar envíos.`,
        dailyReport,
        clientRemindersSent: 0,
        monthlyDigestsSent: 0,
        byDay: {},
      });
    }

    if (!enabled) {
      return NextResponse.json({
        message: 'Recordatorios desactivados en configuración',
        dailyReport,
        sent: 0,
        monthlyDigestsSent: 0,
        byDay: {},
      });
    }

    // Ejecución de recordatorios de vencimiento
    if (isReminderDay) {
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
        clientEmail: d.user.email,
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
        clientEmail: h.user.email,
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
  }

    // 3. RESUMEN MENSUAL A CLIENTES (Día 1 de cada mes o con ?monthly=true)
    let monthlyDigestsSent = 0;

    if (isMonthlyDay) {
      const activeClients = await prisma.user.findMany({
        where: { role: 'CLIENT', status: 'ENABLED' },
        include: {
          domains: {
            where: { status: 'ACTIVE', paymentStatus: { not: 'CANCELLED' } },
            select: { fqdn: true, nextBillingDate: true },
          },
          hosting: {
            where: { serviceStatus: { not: 'CANCELLED' }, paymentStatus: { not: 'CANCELLED' } },
            include: { hostingPackage: { select: { name: true, diskSpaceQuotaMb: true } } },
          },
        },
      });

      for (const client of activeClients) {
        if (!client.email) continue;
        const activeDomains = client.domains.map((dom) => {
          const exp = new Date(dom.nextBillingDate);
          return {
            fqdn: dom.fqdn,
            expDate: exp,
            daysLeft: getDaysUntilExpiration(exp),
          };
        });
        const activeHostings = client.hosting.map((host) => ({
          packageName: host.hostingPackage.name,
          username: host.username,
          diskQuotaMb: host.hostingPackage.diskSpaceQuotaMb,
        }));

        const { subject, html } = buildMonthlyClientDigestEmail({
          companyName,
          logoFullUrl,
          clientName: client.fullName,
          clientEmail: client.email,
          activeDomains,
          activeHostings,
          appUrl,
          basePath,
        });

        const res = await sendEmail({ to: client.email, subject, html });
        if (res.ok) monthlyDigestsSent++;
      }
    }

    return NextResponse.json({
      message: `Ejecución completada: informe ejecutivo enviado a administradores, ${sent} recordatorios de clientes y ${monthlyDigestsSent} resúmenes mensuales despachados.`,
      dailyReport,
      clientRemindersSent: sent,
      monthlyDigestsSent,
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
