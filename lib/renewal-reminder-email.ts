/**
 * Shared helpers for building renewal reminder emails.
 * Used by cron and manual send-reminder endpoints.
 */

export function formatDate(d: Date): string {
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getDaysUntilExpiration(expDate: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expDate);
  exp.setHours(0, 0, 0, 0);
  return Math.floor((exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export type ReminderType = 'standard' | 'urgent_5' | 'expired_3_1' | 'expired' | 'manual';

export function getReminderType(daysLeft: number): ReminderType | null {
  // Envíos los días 1, 10 y 20 de cada mes para servicios en ventana de vencimiento
  if (daysLeft > 30 || daysLeft < -30) return null;
  if (daysLeft > 10) return 'standard';      // 11 a 30 días restantes
  if (daysLeft > 3) return 'urgent_5';       // 4 a 10 días restantes (urgente)
  if (daysLeft >= 1) return 'expired_3_1';   // 1 a 3 días restantes (inminente / mañana)
  return 'expired';                          // <= 0 días (expirado)
}

function buildTips(reactivationPenalty?: string, serviceLabel: 'dominio' | 'servicio' = 'dominio'): string {
  const penaltyLine =
    reactivationPenalty?.trim()
      ? `<p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:#dc2626;">
          ⚠️ Costo de reactivación extemporánea por ${serviceLabel} vencido: <strong>$${Number(reactivationPenalty).toLocaleString('es-CO')} COP</strong>
        </p>`
      : '';

  return `
  <div style="background:#f8fafc;border-left:4px solid #6366f1;padding:14px 16px;border-radius:0 8px 8px 0;margin:18px 0;">
    ${penaltyLine}
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#334155;">
      🔒 <strong>Garantía de continuidad:</strong> Renovar a tiempo evita la interrupción de tus correos corporativos, caídas de tu página web y pérdida de indexación en buscadores.
    </p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#334155;">
      💡 <strong>Aprovecha al máximo tu servidor:</strong> Tu alojamiento incluye aceleración <em>LiteSpeed Cache</em> (WordPress y PHP), certificados SSL ilimitados y buzones de correo protegidos con autenticación SPF/DKIM para entrega directa en bandeja de entrada.
    </p>
  </div>`;
}

export function buildDomainReminderEmail(params: {
  companyName: string;
  logoFullUrl: string;
  clientName: string;
  fqdn: string;
  expDate: Date;
  daysLeft: number;
  type: ReminderType;
  appUrl: string;
  basePath: string;
  reactivationPenalty?: string;
  clientEmail?: string;
}): { subject: string; html: string } {
  const { companyName, logoFullUrl, clientName, fqdn, expDate, daysLeft, type, appUrl, basePath, reactivationPenalty, clientEmail } = params;
  const btnUrl = `${appUrl}${basePath}/domains`;
  const btnText = 'Ir al panel de dominios';

  let title: string;
  let body: string;

  if (type === 'manual') {
    if (daysLeft > 0) {
      title = `Recordatorio: tu dominio vence en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`;
      body = `Tu dominio <strong>${fqdn}</strong> vence el <strong>${formatDate(expDate)}</strong> (le ${daysLeft === 1 ? 'queda' : 'quedan'} ${daysLeft} día${daysLeft === 1 ? '' : 's'}). Te recomendamos renovarlo con anticipación.`;
    } else {
      title = '¡Tu dominio ha expirado!';
      body = `Tu dominio <strong>${fqdn}</strong> venció el <strong>${formatDate(expDate)}</strong>. Renueva cuanto antes para recuperar tu servicio y evitar costos adicionales.`;
    }
  } else if (type === 'standard') {
    title = `Recordatorio: tu dominio vence en ${daysLeft} días`;
    body = `Tu dominio <strong>${fqdn}</strong> vence el <strong>${formatDate(expDate)}</strong> (en ${daysLeft} días). Te recomendamos renovarlo con anticipación.`;
  } else if (type === 'urgent_5') {
    title = `¡Ya está por expirar! Solo quedan ${daysLeft} días`;
    body = `Tu dominio <strong>${fqdn}</strong> vence el <strong>${formatDate(expDate)}</strong> (en ${daysLeft} días). Ya está próximo a expirar. Renueva ahora para evitar costos de reactivación y pérdida de información.`;
  } else if (type === 'expired_3_1') {
    title = daysLeft === 1 ? '¡Tu dominio expira mañana!' : `¡Solo quedan ${daysLeft} días! Tu dominio está por expirar`;
    body = daysLeft === 1
      ? `Tu dominio <strong>${fqdn}</strong> expira mañana (<strong>${formatDate(expDate)}</strong>). Renueva ahora para evitar que expire.`
      : `Tu dominio <strong>${fqdn}</strong> vence el <strong>${formatDate(expDate)}</strong> (en ${daysLeft} días). Está a punto de expirar.`;
  } else {
    title = '¡Tu dominio ha expirado!';
    body = `Tu dominio <strong>${fqdn}</strong> venció el <strong>${formatDate(expDate)}</strong>. Renueva cuanto antes para recuperar tu servicio y evitar costos adicionales.`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:sans-serif;background:#f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;">
          ${logoFullUrl ? `<img src="${logoFullUrl}" alt="${companyName}" width="64" height="64" style="display:block;margin-bottom:16px;object-fit:contain;" />` : ''}
          <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a2e;">${title}</h2>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4a4a68;">
            Hola <strong>${clientName}</strong>,
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a68;">
            ${body}
          </p>
          ${buildTips(reactivationPenalty, 'dominio')}
          <p style="margin:0 0 16px;text-align:center;">
            <a href="${btnUrl}" style="display:inline-block;padding:12px 24px;background:#0d6efd;color:#fff !important;text-decoration:none;font-weight:600;border-radius:8px;">${btnText}</a>
          </p>
          ${clientEmail ? `
          <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:12px 16px;margin:16px 0;text-align:center;">
            <p style="margin:0;font-size:13px;line-height:1.5;color:#3730a3;">
              🔑 Recuerda que puedes ingresar al panel haciendo clic <a href="${appUrl}${basePath}/signin" style="color:#4338ca;font-weight:bold;text-decoration:underline;">aquí</a> usando tu correo <strong>${clientEmail}</strong> como usuario.
            </p>
          </div>` : ''}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8f9fa;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#6c757d;text-align:center;">${companyName}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: `[${companyName}] ${title}`, html };
}

export function buildHostingReminderEmail(params: {
  companyName: string;
  logoFullUrl: string;
  clientName: string;
  packageName: string;
  username: string;
  expDate: Date;
  daysLeft: number;
  type: ReminderType;
  appUrl: string;
  basePath: string;
  reactivationPenalty?: string;
  clientEmail?: string;
}): { subject: string; html: string } {
  const { companyName, logoFullUrl, clientName, packageName, username, expDate, daysLeft, type, appUrl, basePath, reactivationPenalty, clientEmail } = params;
  const btnUrl = `${appUrl}${basePath}/hosting`;
  const btnText = 'Ir al panel de hosting';

  let title: string;
  let body: string;

  if (type === 'manual') {
    if (daysLeft > 0) {
      title = `Recordatorio: tu hosting vence en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`;
      body = `Tu plan <strong>${packageName}</strong> (usuario: ${username}) vence el <strong>${formatDate(expDate)}</strong> (le ${daysLeft === 1 ? 'queda' : 'quedan'} ${daysLeft} día${daysLeft === 1 ? '' : 's'}). Te recomendamos renovarlo con anticipación.`;
    } else {
      title = '¡Tu hosting ha expirado!';
      body = `Tu plan <strong>${packageName}</strong> (usuario: ${username}) venció el <strong>${formatDate(expDate)}</strong>. Renueva cuanto antes para recuperar tu servicio y evitar costos adicionales.`;
    }
  } else if (type === 'standard') {
    title = `Recordatorio: tu hosting vence en ${daysLeft} días`;
    body = `Tu plan <strong>${packageName}</strong> (usuario: ${username}) vence el <strong>${formatDate(expDate)}</strong> (en ${daysLeft} días). Te recomendamos renovarlo con anticipación.`;
  } else if (type === 'urgent_5') {
    title = `¡Ya está por expirar! Solo quedan ${daysLeft} días`;
    body = `Tu plan <strong>${packageName}</strong> (usuario: ${username}) vence el <strong>${formatDate(expDate)}</strong> (en ${daysLeft} días). Ya está próximo a expirar. Renueva ahora para evitar costos de reactivación y pérdida de información.`;
  } else if (type === 'expired_3_1') {
    title = daysLeft === 1 ? '¡Tu hosting expira mañana!' : `¡Solo quedan ${daysLeft} días! Tu hosting está por expirar`;
    body = daysLeft === 1
      ? `Tu plan <strong>${packageName}</strong> (usuario: ${username}) expira mañana (<strong>${formatDate(expDate)}</strong>). Renueva ahora para evitar que expire.`
      : `Tu plan <strong>${packageName}</strong> (usuario: ${username}) vence el <strong>${formatDate(expDate)}</strong> (en ${daysLeft} días). Está a punto de expirar.`;
  } else {
    title = '¡Tu hosting ha expirado!';
    body = `Tu plan <strong>${packageName}</strong> (usuario: ${username}) venció el <strong>${formatDate(expDate)}</strong>. Renueva cuanto antes para recuperar tu servicio y evitar costos adicionales.`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:sans-serif;background:#f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;">
          ${logoFullUrl ? `<img src="${logoFullUrl}" alt="${companyName}" width="64" height="64" style="display:block;margin-bottom:16px;object-fit:contain;" />` : ''}
          <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a2e;">${title}</h2>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4a4a68;">
            Hola <strong>${clientName}</strong>,
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a68;">
            ${body}
          </p>
          ${buildTips(reactivationPenalty, 'servicio')}
          <p style="margin:0 0 16px;text-align:center;">
            <a href="${btnUrl}" style="display:inline-block;padding:12px 24px;background:#0d6efd;color:#fff !important;text-decoration:none;font-weight:600;border-radius:8px;">${btnText}</a>
          </p>
          ${clientEmail ? `
          <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:12px 16px;margin:16px 0;text-align:center;">
            <p style="margin:0;font-size:13px;line-height:1.5;color:#3730a3;">
              🔑 Recuerda que puedes ingresar al panel haciendo clic <a href="${appUrl}${basePath}/signin" style="color:#4338ca;font-weight:bold;text-decoration:underline;">aquí</a> usando tu correo <strong>${clientEmail}</strong> como usuario.
            </p>
          </div>` : ''}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8f9fa;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#6c757d;text-align:center;">${companyName}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: `[${companyName}] ${title}`, html };
}

export type AdminReminderKind = 'remind_user' | 'suspend_user';

export type AdminReminderItem = {
  type: 'domain' | 'hosting';
  id: string;
  clientName: string;
  clientEmail: string;
  identifier: string;
  expDate: Date;
  editUrl: string;
};

export function buildAdminReminderEmail(params: {
  companyName: string;
  logoFullUrl: string;
  appUrl: string;
  basePath: string;
  kind: AdminReminderKind;
  items: AdminReminderItem[];
}): { subject: string; html: string } {
  const { companyName, logoFullUrl, appUrl, basePath, kind, items } = params;

  const isUrgent = kind === 'suspend_user';
  const title =
    kind === 'remind_user'
      ? `Servicios próximos a vencer (≤10 días): recuerda al usuario renovar`
      : `¡Urgente! Servicios por vencer o vencidos (≤1 día): suspender servicio si no ha renovado`;

  const headerBg = isUrgent ? '#dc3545' : '#6366f1';
  const headerColor = '#fff';
  const alertBg = isUrgent ? '#fef2f2' : '#f0f9ff';
  const alertBorder = isUrgent ? '#fecaca' : '#bae6fd';

  const itemsHtml = items
    .map(
      (it) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:14px;color:#4a4a68;">
        <strong>${it.type === 'domain' ? 'Dominio' : 'Hosting'}:</strong> ${it.identifier}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:14px;color:#4a4a68;">
        ${it.clientName} (${it.clientEmail})
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:14px;color:#4a4a68;">
        ${formatDate(it.expDate)}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;">
        <a href="${it.editUrl}" style="color:#0d6efd;text-decoration:none;font-weight:500;">Editar</a>
      </td>
    </tr>`
    )
    .join('');

  const actionText =
    kind === 'remind_user'
      ? 'Recuerda a cada usuario renovar su servicio antes de la fecha de corte.'
      : items.length === 1
        ? 'Suspende el servicio a este usuario si no ha renovado su pago.'
        : 'Suspende el servicio a estos usuarios si no han renovado su pago.';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:sans-serif;background:#f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;background:${headerBg};color:${headerColor};border-radius:12px 12px 0 0;">
          ${logoFullUrl ? `<img src="${logoFullUrl}" alt="${companyName}" width="64" height="64" style="display:block;margin-bottom:12px;object-fit:contain;filter:brightness(0) invert(1);" />` : ''}
          <h2 style="margin:0;font-size:18px;color:${headerColor};">${title}</h2>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a68;">
            ${actionText}
          </p>
          <div style="margin:0 0 16px;padding:16px;background:${alertBg};border:1px solid ${alertBorder};border-radius:8px;">
            <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${isUrgent ? '#991b1b' : '#1e40af'};">
              ${items.length} servicio${items.length === 1 ? '' : 's'}:
            </p>
          </div>
          <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Servicio</th>
                <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Cliente</th>
                <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Vence</th>
                <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;"></th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p style="margin:16px 0 0;text-align:center;">
            <a href="${appUrl}${basePath}/domains" style="display:inline-block;padding:12px 24px;background:${headerBg};color:#fff !important;text-decoration:none;font-weight:600;border-radius:8px;">Ir al panel</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8f9fa;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#6c757d;text-align:center;">${companyName}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: `[${companyName}] ${title}`, html };
}

export type DomainHealthItem = {
  fqdn: string;
  clientName: string;
  statusCode: number | null;
  daysLeft: number;
};

export function buildDomainHealthCheckEmail(params: {
  companyName: string;
  logoFullUrl: string;
  appUrl: string;
  basePath: string;
  items: DomainHealthItem[];
  date: Date;
}): { subject: string; html: string } {
  const { companyName, logoFullUrl, appUrl, basePath, items, date } = params;
  const dateStr = formatDate(date);
  const title = `Health check de dominios - ${dateStr}`;

  const getStatusColor = (code: number | null): string => {
    if (code === null) return '#6c757d';
    if (code >= 200 && code < 300) return '#20c997';
    if (code >= 300 && code < 400) return '#17a2b8';
    if (code >= 400 && code < 500) return '#ffc107';
    return '#dc3545';
  };

  const getStatusLabel = (code: number | null): string => {
    if (code === null) return 'Error/Timeout';
    return String(code);
  };

  const getDaysLabel = (days: number): string => {
    if (days < 0) return `${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'} vencido${Math.abs(days) === 1 ? '' : 's'}`;
    if (days === 0) return 'Vence hoy';
    return `${days} día${days === 1 ? '' : 's'}`;
  };

  const itemsHtml = items
    .map(
      (it) => {
        const color = getStatusColor(it.statusCode);
        const label = getStatusLabel(it.statusCode);
        const daysLabel = getDaysLabel(it.daysLeft);
        const daysColor = it.daysLeft <= 7 ? (it.daysLeft < 0 ? '#dc3545' : '#ffc107') : '#4a4a68';
        return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:14px;color:#4a4a68;">
        <strong>${it.fqdn}</strong>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:14px;color:#4a4a68;">
        ${it.clientName}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:14px;color:${daysColor};">
        ${daysLabel}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;">
        <span style="display:inline-block;padding:4px 10px;border-radius:6px;font-weight:600;font-size:13px;background:${color};color:#fff;">
          ${label}
        </span>
      </td>
    </tr>`;
      }
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:sans-serif;background:#f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;background:#6366f1;color:#fff;border-radius:12px 12px 0 0;">
          ${logoFullUrl ? `<img src="${logoFullUrl}" alt="${companyName}" width="64" height="64" style="display:block;margin-bottom:12px;object-fit:contain;filter:brightness(0) invert(1);" />` : ''}
          <h2 style="margin:0;font-size:18px;color:#fff;">${title}</h2>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a68;">
            Resumen del estado de todos los dominios registrados.
          </p>
          <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Dominio</th>
                <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Cliente</th>
                <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Vence en</th>
                <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Estado HTTP</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p style="margin:16px 0 0;text-align:center;">
            <a href="${appUrl}${basePath}/domains" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff !important;text-decoration:none;font-weight:600;border-radius:8px;">Ir al panel</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8f9fa;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#6c757d;text-align:center;">${companyName}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: `[${companyName}] ${title}`, html };
}

export function buildMonthlyClientDigestEmail(params: {
  companyName: string;
  logoFullUrl: string;
  clientName: string;
  clientEmail: string;
  activeDomains: Array<{ fqdn: string; expDate: Date; daysLeft: number }>;
  activeHostings: Array<{ packageName: string; username: string; diskQuotaMb: number | null }>;
  appUrl: string;
  basePath: string;
}): { subject: string; html: string } {
  const { companyName, logoFullUrl, clientName, clientEmail, activeDomains, activeHostings, appUrl, basePath } = params;
  const monthName = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  const domainsRows = activeDomains.length > 0
    ? activeDomains.map(d => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;font-weight:600;">${d.fqdn}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">${formatDate(d.expDate)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#2563eb;font-weight:500;">${d.daysLeft > 0 ? `${d.daysLeft} días restantes` : 'Vencido'}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="3" style="padding:12px;text-align:center;color:#94a3b8;font-size:13px;">No tienes dominios activos registrados.</td></tr>';

  const hostingsRows = activeHostings.length > 0
    ? activeHostings.map(h => {
        let estTraffic = '15.000 – 30.000 visitas/mes';
        if (h.packageName.toLowerCase().includes('gold')) estTraffic = '50.000 – 100.000 visitas/mes';
        if (h.packageName.toLowerCase().includes('platinum')) estTraffic = '100.000 – 250.000 visitas/mes';
        if (h.packageName.toLowerCase().includes('diamond')) estTraffic = '250.000 – 600.000 visitas/mes';
        const quota = h.diskQuotaMb ? `${h.diskQuotaMb.toLocaleString()} MB` : 'Ilimitado';
        return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;font-weight:600;">${h.packageName} <span style="font-weight:normal;color:#64748b;">(${h.username})</span></td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${quota}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#16a34a;font-weight:600;">${estTraffic}</td>
      </tr>`;
      }).join('')
    : '<tr><td colspan="3" style="padding:12px;text-align:center;color:#94a3b8;font-size:13px;">No tienes planes de alojamiento contratados.</td></tr>';

  const title = `Resumen Mensual de tus Servicios • ${monthName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <tr>
          <td style="padding:28px 32px;background:#0f172a;color:#ffffff;">
            ${logoFullUrl ? `<img src="${logoFullUrl}" alt="${companyName}" width="56" height="56" style="display:block;margin-bottom:12px;object-fit:contain;" />` : ''}
            <h1 style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">${title}</h1>
            <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Estado de tu infraestructura y servicios digitales</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#334155;">
              Hola <strong>${clientName}</strong>, te presentamos el reporte mensual del estado de tus servicios en <strong>${companyName}</strong>.
            </p>

            <!-- Access Card (Primary Request) -->
            <div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:10px;padding:20px;margin-bottom:28px;text-align:center;">
              <h3 style="margin:0 0 8px;font-size:16px;color:#1e3a8a;font-weight:700;">
                🚀 Accede a tu Panel de Control
              </h3>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#1d4ed8;">
                Recuerda que puedes gestionar todos tus servicios, consultar consumos de disco, subir comprobantes de pago y crear solicitudes de soporte ingresando al panel:
              </p>
              <p style="margin:0 0 16px;font-size:13px;color:#0f172a;">
                Tu usuario de acceso es tu correo: <strong style="color:#2563eb;background:#ffffff;padding:4px 10px;border-radius:6px;border:1px solid #bfdbfe;">${clientEmail}</strong>
              </p>
              <a href="${appUrl}${basePath}/signin" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#ffffff !important;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;">
                Ingresar a mi Panel de Control →
              </a>
            </div>

            <!-- Dominios -->
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;">Tus Dominios</h3>
            <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;border-collapse:collapse;">
              <thead>
                <tr style="background:#f8fafc;color:#64748b;font-size:12px;">
                  <th style="padding:8px 12px;text-align:left;">Dominio</th>
                  <th style="padding:8px 12px;text-align:left;">Vencimiento</th>
                  <th style="padding:8px 12px;text-align:left;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${domainsRows}
              </tbody>
            </table>

            <!-- Hosting -->
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;">Tus Planes de Alojamiento</h3>
            <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;border-collapse:collapse;">
              <thead>
                <tr style="background:#f8fafc;color:#64748b;font-size:12px;">
                  <th style="padding:8px 12px;text-align:left;">Plan / Usuario</th>
                  <th style="padding:8px 12px;text-align:left;">Cuota Disco</th>
                  <th style="padding:8px 12px;text-align:left;">Capacidad Tráfico</th>
                </tr>
              </thead>
              <tbody>
                ${hostingsRows}
              </tbody>
            </table>

            <!-- Tips & Metrics -->
            <div style="background:#f8fafc;border-left:4px solid #10b981;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
              <h4 style="margin:0 0 8px;font-size:14px;color:#065f46;font-weight:700;">
                💡 Consejos para aprovechar al máximo tu servidor:
              </h4>
              <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#334155;">
                <li><strong>Aceleración Web:</strong> Tu servidor cuenta con motor <em>LiteSpeed</em>. Si utilizas WordPress, activa el plugin gratuito <em>LiteSpeed Cache</em> para reducir el tiempo de carga a menos de 1 segundo.</li>
                <li><strong>Configuración de Correo Corporativo:</strong> Puedes sincronizar tus correos en Outlook o tu smartphone usando <strong>IMAP seguro (puerto 993 con SSL)</strong> y <strong>SMTP saliente (puerto 465 con SSL)</strong>. También puedes acceder vía web en <a href="https://instanceshape.com/webmail" style="color:#2563eb;">Webmail Instance Shape</a>.</li>
                <li><strong>Seguridad SSL Gratuita:</strong> Todos tus dominios y subdominios cuentan con certificados SSL automáticos activos sin costo adicional.</li>
              </ul>
            </div>

            <p style="margin:0;font-size:12px;color:#64748b;text-align:center;">
              ¿Necesitas asistencia técnica o una cotización de ampliación? Puedes responder a este correo o escribir a nuestro canal de soporte en <a href="${appUrl}${basePath}/soporte" style="color:#2563eb;">Soporte Instance Shape</a>.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;">
            ${companyName} • Notificación mensual para clientes
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  return {
    subject: `[${companyName}] Resumen Mensual de tus Servicios • Gestiona en tu Panel de Control`,
    html,
  };
}
