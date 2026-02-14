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
  if (daysLeft === 30 || daysLeft === 15 || daysLeft === 7) return 'standard';
  if (daysLeft === 5) return 'urgent_5';
  if (daysLeft === 3 || daysLeft === 1) return 'expired_3_1';
  if (daysLeft <= 0) return 'expired';
  return null;
}

function buildTips(reactivationPenalty?: string, serviceLabel: 'dominio' | 'servicio' = 'dominio'): string {
  const penaltyLine =
    reactivationPenalty?.trim() ?
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4a4a68;">
    • Costo de reactivación por ${serviceLabel} vencido: <strong>${reactivationPenalty.trim()}</strong>
  </p>`
    : '';
  return `
  ${penaltyLine}
  <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4a4a68;">
    • Evita costos extra por servicios vencidos (reactivación).
  </p>
  <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4a4a68;">
    • Evita pérdida de información renovando ahora.
  </p>`;
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
}): { subject: string; html: string } {
  const { companyName, logoFullUrl, clientName, fqdn, expDate, daysLeft, type, appUrl, basePath, reactivationPenalty } = params;
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
    title = '¡Ya está por expirar! Solo quedan 5 días';
    body = `Tu dominio <strong>${fqdn}</strong> vence el <strong>${formatDate(expDate)}</strong>. Ya está próximo a expirar. Renueva ahora para evitar costos de reactivación y pérdida de información.`;
  } else if (type === 'expired_3_1') {
    title = daysLeft === 1 ? '¡Tu dominio expira mañana!' : '¡Solo quedan 3 días! Tu dominio está por expirar';
    body = daysLeft === 1
      ? `Tu dominio <strong>${fqdn}</strong> expira mañana (<strong>${formatDate(expDate)}</strong>). Renueva ahora para evitar que expire.`
      : `Tu dominio <strong>${fqdn}</strong> vence el <strong>${formatDate(expDate)}</strong>. Está a punto de expirar.`;
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
}): { subject: string; html: string } {
  const { companyName, logoFullUrl, clientName, packageName, username, expDate, daysLeft, type, appUrl, basePath, reactivationPenalty } = params;
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
    title = '¡Ya está por expirar! Solo quedan 5 días';
    body = `Tu plan <strong>${packageName}</strong> (usuario: ${username}) vence el <strong>${formatDate(expDate)}</strong>. Ya está próximo a expirar. Renueva ahora para evitar costos de reactivación y pérdida de información.`;
  } else if (type === 'expired_3_1') {
    title = daysLeft === 1 ? '¡Tu hosting expira mañana!' : '¡Solo quedan 3 días! Tu hosting está por expirar';
    body = daysLeft === 1
      ? `Tu plan <strong>${packageName}</strong> (usuario: ${username}) expira mañana (<strong>${formatDate(expDate)}</strong>). Renueva ahora para evitar que expire.`
      : `Tu plan <strong>${packageName}</strong> (usuario: ${username}) vence el <strong>${formatDate(expDate)}</strong>. Está a punto de expirar.`;
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
      ? `Servicios que vencen en 7 días: recuerda al usuario renovar`
      : `¡Urgente! Servicios que vencen mañana: suspender servicio`;

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
      ? 'Recuerda a cada usuario renovar su servicio.'
      : items.length === 1
        ? 'Suspende el servicio a este usuario si no ha renovado.'
        : 'Suspende el servicio a estos usuarios si no han renovado.';

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
