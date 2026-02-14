/**
 * Email sending via SMTP (own mail server).
 * Required env vars in .env:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
 * SMTP_SECURE (optional, default: false for port 587)
 * SMTP_FROM (optional, default: SMTP_USER)
 * EMAIL_SKIP_SEND (optional): if "true", does not send and only logs (useful on localhost)
 */

import nodemailer from 'nodemailer';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  // Port 587 uses STARTTLS (secure: false); port 465 uses implicit SSL (secure: true)
  const secure = port === 465 || (process.env.SMTP_SECURE === 'true' && port !== 587);

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{ filename: string; content: Buffer | string }>;
}): Promise<{ ok: boolean; error?: string }> {
  const skipSend = process.env.EMAIL_SKIP_SEND === 'true' || process.env.EMAIL_SKIP_SEND === '1';
  const transporter = getTransporter();
  const from = options.from || process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!transporter || skipSend) {
    const reason = skipSend ? 'EMAIL_SKIP_SEND activo (localhost/dev)' : 'SMTP no configurado';
    console.warn(`[Email] ${reason}. Logging en consola.`);
    console.log('[Email] To:', options.to, 'Subject:', options.subject);
    console.log('[Email] Body (html):', options.html.slice(0, 300) + (options.html.length > 300 ? '...' : ''));
    if (options.attachments?.length) {
      console.log('[Email] Attachments:', options.attachments.map((a) => a.filename).join(', '));
    }
    return { ok: true };
  }

  try {
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    return { ok: true };
  } catch (e) {
    console.error('[Email] Send failed:', e);
    return { ok: false, error: String(e) };
  }
}
