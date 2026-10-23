/**
 * Generador y despachador del Informe Ejecutivo Diario para Administradores de Azulática.
 * Incluye:
 * 1. Health check HTTP de todos los sitios con alerta prioritaria si alguno está caído.
 * 2. Métricas de valores a recaudar y renovaciones en los próximos 30 días.
 * 3. Auditoría de accesos: quiénes y cuántas veces han iniciado sesión en el panel durante el mes.
 * 4. Consejos de optimización y métricas de servidor (visitas estimadas, flujo de correo, caché).
 */

import { prisma } from '@/lib/prisma';
import { pingDomain } from '@/lib/domain-ping';
import { getDaysUntilExpiration, formatDate } from '@/lib/renewal-reminder-email';
import { sendEmail } from '@/lib/email';
import { getHostingEffectivePrice, toNumber } from '@/lib/hosting-price';

export interface DailyReportResult {
  ok: boolean;
  recipientsCount: number;
  healthySitesCount: number;
  downSitesCount: number;
  expiringIn30DaysCount: number;
  totalLoginsThisMonth: number;
  uniqueUsersThisMonth: number;
  error?: string;
}

export async function generateAndSendDailyAdminReport(params: {
  companyName: string;
  logoFullUrl: string;
  appUrl: string;
  basePath: string;
}): Promise<DailyReportResult> {
  const { companyName, logoFullUrl, appUrl, basePath } = params;

  // 1. Obtener administradores activos
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', status: 'ENABLED' },
    select: { email: true, fullName: true },
  });
  const adminEmails = admins.map((a) => a.email).filter(Boolean);

  if (adminEmails.length === 0) {
    return {
      ok: false,
      recipientsCount: 0,
      healthySitesCount: 0,
      downSitesCount: 0,
      expiringIn30DaysCount: 0,
      totalLoginsThisMonth: 0,
      uniqueUsersThisMonth: 0,
      error: 'No hay administradores habilitados configurados.',
    };
  }

  // 2. Health check de todos los dominios activos
  const allDomains = await prisma.domain.findMany({
    where: { status: 'ACTIVE', paymentStatus: { not: 'CANCELLED' } },
    include: { user: { select: { fullName: true, email: true } } },
    orderBy: { fqdn: 'asc' },
  });

  const healthySites: { fqdn: string; clientName: string; statusCode: number | null; daysLeft: number }[] = [];
  const downSites: { fqdn: string; clientName: string; statusCode: number | null; daysLeft: number }[] = [];

  for (const d of allDomains) {
    const statusCode = await pingDomain(d.fqdn);
    const expDate = new Date(d.nextBillingDate);
    const daysLeft = getDaysUntilExpiration(expDate);

    // Actualizar estado de salud en la base de datos
    const isUp = statusCode !== null && statusCode >= 200 && statusCode < 400;
    const newHealthStatus = isUp ? 'UP' : 'DOWN';
    await prisma.domain.update({
      where: { id: d.id },
      data: { healthStatus: newHealthStatus },
    }).catch(() => null);

    const item = {
      fqdn: d.fqdn,
      clientName: d.user.fullName,
      statusCode,
      daysLeft,
    };

    if (isUp) {
      healthySites.push(item);
    } else {
      downSites.push(item);
    }
  }

  // 3. Métricas Financieras y Renovaciones (próximos 30 días)
  const [activeHostings, activeDomains] = await Promise.all([
    prisma.hostingService.findMany({
      where: { serviceStatus: { not: 'CANCELLED' }, paymentStatus: { not: 'CANCELLED' } },
      include: {
        user: { select: { fullName: true, email: true } },
        hostingPackage: { select: { name: true, salePrice: true, currency: true } },
      },
      orderBy: { nextBillingDate: 'asc' },
    }),
    prisma.domain.findMany({
      where: { status: 'ACTIVE', paymentStatus: { not: 'CANCELLED' } },
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { nextBillingDate: 'asc' },
    }),
  ]);

  interface UpcomingRenewal {
    type: 'Hosting' | 'Dominio';
    identifier: string;
    clientName: string;
    amount: number;
    currency: string;
    daysLeft: number;
    renewalDate: Date;
  }

  const upcomingRenewals: UpcomingRenewal[] = [];
  let totalToCollect30Days = 0;

  for (const h of activeHostings) {
    const days = getDaysUntilExpiration(new Date(h.nextBillingDate));
    if (days <= 30 && days >= -30) {
      // Regla de Negocio: instanceshape hosting es plan Gold (119.900 COP)
      const isInstanceShape = h.username === 'instanceshape' || h.username === 'shape';
      const packageName = isInstanceShape && h.hostingPackage.name === 'Platinum' ? 'Gold' : h.hostingPackage.name;
      const defaultPackagePrice = isInstanceShape && Number(h.hostingPackage.salePrice) === 499999 ? 119900 : h.hostingPackage.salePrice;

      const { salePrice, currency } = getHostingEffectivePrice({
        salePriceOverride: h.salePriceOverride,
        hostingPackage: { salePrice: defaultPackagePrice, currency: h.hostingPackage.currency },
      });
      totalToCollect30Days += salePrice;
      upcomingRenewals.push({
        type: 'Hosting',
        identifier: `${packageName} (${h.username})`,
        clientName: h.user.fullName,
        amount: salePrice,
        currency,
        daysLeft: days,
        renewalDate: new Date(h.nextBillingDate),
      });
    }
  }

  for (const d of activeDomains) {
    const days = getDaysUntilExpiration(new Date(d.nextBillingDate));
    if (days <= 30 && days >= -30) {
      const priceNum = toNumber(d.salePrice);
      // Regla de Negocio: instanceshape.com está incluido en el hosting ($0 COP)
      const isBundled = d.fqdn.toLowerCase() === 'instanceshape.com' || priceNum === 0;
      const price = isBundled ? 0 : (priceNum ?? 49999);
      totalToCollect30Days += price;
      upcomingRenewals.push({
        type: 'Dominio',
        identifier: d.fqdn,
        clientName: d.user.fullName,
        amount: price,
        currency: d.currency || 'COP',
        daysLeft: days,
        renewalDate: new Date(d.nextBillingDate),
      });
    }
  }

  upcomingRenewals.sort((a, b) => a.daysLeft - b.daysLeft);

  // 4. Auditoría de Inicios de Sesión (Mes en curso)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const loginRecords = await prisma.loginHistory.findMany({
    where: { createdAt: { gte: startOfMonth } },
    include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const userLoginMap = new Map<string, { fullName: string; email: string; role: string; count: number; lastLogin: Date }>();
  for (const log of loginRecords) {
    const existing = userLoginMap.get(log.userID);
    if (existing) {
      existing.count += 1;
    } else {
      userLoginMap.set(log.userID, {
        fullName: log.user.fullName,
        email: log.user.email,
        role: log.user.role,
        count: 1,
        lastLogin: log.createdAt,
      });
    }
  }

  const userLogins = Array.from(userLoginMap.values()).sort((a, b) => b.count - a.count);
  const totalLoginsThisMonth = loginRecords.length;
  const uniqueUsersThisMonth = userLogins.length;

  // 5. Construcción de HTML del Informe Ejecutivo
  const todayStr = formatDate(now);
  const monthName = now.toLocaleString('es-CO', { month: 'long' });

  // Tabla Sitios Caídos (Alerta Roja)
  const downSitesHtml = downSites.length > 0
    ? `
    <div style="margin-bottom:24px;padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
      <h3 style="margin:0 0 10px;font-size:15px;color:#991b1b;display:flex;align-items:center;">
        ⚠️ SITIOS NO RESPONDIENDO (${downSites.length})
      </h3>
      <table width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;border-collapse:collapse;">
        <thead>
          <tr style="background:#fee2e2;color:#991b1b;">
            <th style="padding:8px 12px;text-align:left;">Dominio</th>
            <th style="padding:8px 12px;text-align:left;">Cliente</th>
            <th style="padding:8px 12px;text-align:left;">Código HTTP / Error</th>
          </tr>
        </thead>
        <tbody>
          ${downSites.map((s) => `
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #fecaca;font-weight:bold;color:#7f1d1d;">${s.fqdn}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #fecaca;color:#7f1d1d;">${s.clientName}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #fecaca;color:#dc2626;font-weight:bold;">${s.statusCode ? `HTTP ${s.statusCode}` : 'Error / Timeout / DNS'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`
    : `
    <div style="margin-bottom:20px;padding:12px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
      <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">
        ✅ Todos los sitios web activos (${healthySites.length}) están en línea y respondiendo correctamente.
      </p>
    </div>`;

  // Tabla Renovaciones Próximas
  const renewalsHtml = upcomingRenewals.length > 0
    ? upcomingRenewals.map((r) => {
        const daysText = r.daysLeft < 0
          ? `<span style="color:#dc2626;font-weight:bold;">Vencido (${Math.abs(r.daysLeft)} d)</span>`
          : r.daysLeft === 0
            ? '<span style="color:#ea580c;font-weight:bold;">Vence hoy</span>'
            : `<span style="color:#2563eb;">${r.daysLeft} días</span>`;
        const amountDisplay = r.amount === 0
          ? '<span style="color:#16a34a;font-weight:600;">$0 COP (Incluido con Hosting)</span>'
          : `$${r.amount.toLocaleString('es-CO')} ${r.currency}`;
        return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;color:#334155;"><strong>${r.type}</strong>: ${r.identifier}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;color:#334155;">${r.clientName}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;color:#334155;">${amountDisplay}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;">${daysText}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="4" style="padding:16px;text-align:center;color:#64748b;">No hay renovaciones en la ventana de 30 días.</td></tr>';

  // Tabla Sesiones del Mes
  const loginsHtml = userLogins.length > 0
    ? userLogins.map((u) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;color:#334155;">
            <strong>${u.fullName}</strong><br />
            <span style="font-size:11px;color:#64748b;">${u.email}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;">
            <span style="padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${u.role === 'ADMIN' ? '#fee2e2;color:#991b1b;' : '#e0e7ff;color:#3730a3;'}">
              ${u.role}
            </span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;font-weight:bold;color:#1e293b;text-align:center;">
            ${u.count}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:12px;color:#64748b;">
            ${formatDate(u.lastLogin)}
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="padding:16px;text-align:center;color:#64748b;">No se han registrado inicios de sesión aún este mes.</td></tr>';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Informe Diario del Panel - ${companyName}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;color:#1e293b;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:30px 10px;">
    <tr><td align="center">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);overflow:hidden;">
        
        <!-- Header -->
        <tr>
          <td style="padding:28px 32px;background:#0f172a;color:#ffffff;">
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td>
                  ${logoFullUrl ? `<img src="${logoFullUrl}" alt="${companyName}" width="48" height="48" style="display:block;margin-bottom:12px;object-fit:contain;" />` : ''}
                  <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">Informe Ejecutivo Diario del Panel</h1>
                  <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">${todayStr} • ${companyName}</p>
                </td>
                <td style="text-align:right;vertical-align:bottom;">
                  <span style="display:inline-block;padding:6px 14px;background:#1e293b;border:1px solid #334155;border-radius:20px;font-size:12px;font-weight:600;color:#38bdf8;">
                    ${monthName.toUpperCase()} ${now.getFullYear()}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content Body -->
        <tr>
          <td style="padding:32px;">

            <!-- KPIs Summary Cards -->
            <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
              <tr>
                <td style="width:31%;background:#f1f5f9;border-radius:8px;padding:16px;text-align:center;">
                  <span style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;">Salud de Sitios</span>
                  <div style="font-size:22px;font-weight:700;margin-top:4px;color:${downSites.length > 0 ? '#dc2626' : '#16a34a'};">
                    ${healthySites.length} / ${allDomains.length}
                  </div>
                  <span style="font-size:11px;color:#64748b;">${downSites.length === 0 ? '100% Operativos' : `${downSites.length} con incidencias`}</span>
                </td>
                <td style="width:3.5%;"></td>
                <td style="width:31%;background:#f1f5f9;border-radius:8px;padding:16px;text-align:center;">
                  <span style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;">Por Cobrar (30d)</span>
                  <div style="font-size:20px;font-weight:700;margin-top:4px;color:#0f172a;">
                    $${totalToCollect30Days.toLocaleString('es-CO')}
                  </div>
                  <span style="font-size:11px;color:#64748b;">${upcomingRenewals.length} servicios por renovar</span>
                </td>
                <td style="width:3.5%;"></td>
                <td style="width:31%;background:#f1f5f9;border-radius:8px;padding:16px;text-align:center;">
                  <span style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;">Accesos al Mes</span>
                  <div style="font-size:22px;font-weight:700;margin-top:4px;color:#6366f1;">
                    ${totalLoginsThisMonth}
                  </div>
                  <span style="font-size:11px;color:#64748b;">${uniqueUsersThisMonth} usuarios únicos</span>
                </td>
              </tr>
            </table>

            <!-- Sección 1: Salud de los Sitios -->
            <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">1. Estado de Salud de Sitios Web (HTTP Ping)</h2>
            ${downSitesHtml}

            <!-- Sección 2: Próximas Renovaciones y Recaudo -->
            <h2 style="margin:28px 0 12px;font-size:16px;font-weight:700;color:#0f172a;">2. Proyección de Renovaciones (Próximos 30 días)</h2>
            <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:28px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#f8fafc;color:#64748b;font-size:12px;text-transform:uppercase;">
                    <th style="padding:10px 12px;text-align:left;">Servicio</th>
                    <th style="padding:10px 12px;text-align:left;">Cliente</th>
                    <th style="padding:10px 12px;text-align:left;">Valor Anual</th>
                    <th style="padding:10px 12px;text-align:left;">Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  ${renewalsHtml}
                </tbody>
              </table>
            </div>

            <!-- Sección 3: Auditoría de Inicios de Sesión -->
            <h2 style="margin:28px 0 12px;font-size:16px;font-weight:700;color:#0f172a;">3. Usuarios con Inicios de Sesión en el Mes (${monthName})</h2>
            <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:28px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#f8fafc;color:#64748b;font-size:12px;text-transform:uppercase;">
                    <th style="padding:10px 12px;text-align:left;">Usuario</th>
                    <th style="padding:10px 12px;text-align:left;">Rol</th>
                    <th style="padding:10px 12px;text-align:center;">Nº Ingresos</th>
                    <th style="padding:10px 12px;text-align:left;">Último Acceso</th>
                  </tr>
                </thead>
                <tbody>
                  ${loginsHtml}
                </tbody>
              </table>
            </div>

            <!-- Sección 4: Consejos y Métricas de Alto Valor -->
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin-bottom:20px;">
              <h3 style="margin:0 0 10px;font-size:15px;color:#1e40af;font-weight:700;">
                💡 Buenas Prácticas y Consejos del Servidor
              </h3>
              <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.7;color:#1e3a8a;">
                <li><strong>Reputación y Flujo de Correo:</strong> Mantén los límites antispam vigentes (20 correos/h en Bronze/Silver, 60 en Gold/Platinum, 300 en Diamond). Verifica que los clientes usen siempre puertos seguros (SMTPS 465 / IMAP 993) y autenticación SPF/DKIM para evitar listas negras.</li>
                <li><strong>Protocolo SSH Transitorio:</strong> Si algún cliente requiere importar bases de datos MySQL mayores a 100 MB o scripts WP-CLI/Composer, usa el paquete <code>shape_ssh</code> temporalmente y regrésalo a su plan original al finalizar.</li>
                <li><strong>Monitoreo y Certificados SSL:</strong> Todos los sitios activos cuentan con AutoSSL; revisa cualquier sitio que presente código HTTP diferente a 200 en la tabla superior.</li>
              </ul>
            </div>

            <p style="margin:24px 0 0;text-align:center;">
              <a href="${appUrl}${basePath}/dashboard" style="display:inline-block;padding:12px 28px;background:#0f172a;color:#ffffff !important;text-decoration:none;font-weight:600;font-size:14px;border-radius:8px;">
                Abrir Panel Administrativo
              </a>
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;">
            ${companyName} • Notificación interna automatizada del sistema de hosting
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  // Enviar informe a todos los administradores
  const subject = `[${companyName}] Informe Diario: ${healthySites.length}/${allDomains.length} Sitios OK • $${totalToCollect30Days.toLocaleString('es-CO')} por cobrar`;
  let sentCount = 0;
  for (const email of adminEmails) {
    const res = await sendEmail({ to: email, subject, html });
    if (res.ok) sentCount++;
  }

  return {
    ok: sentCount > 0,
    recipientsCount: sentCount,
    healthySitesCount: healthySites.length,
    downSitesCount: downSites.length,
    expiringIn30DaysCount: upcomingRenewals.length,
    totalLoginsThisMonth,
    uniqueUsersThisMonth,
  };
}
