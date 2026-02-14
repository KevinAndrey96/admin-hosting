/**
 * Email templates with logo and company name.
 * Logo URLs must be absolute to work in email clients.
 */

export function buildPasswordResetEmail(options: {
  recipientName: string;
  resetUrl: string;
  companyName: string;
  logoUrl: string;
}): string {
  const { recipientName, resetUrl, companyName, logoUrl } = options;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;background:linear-gradient(135deg,#f8f9fa 0%,#fff 100%);">
              ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" width="64" height="64" style="display:inline-block;margin-bottom:16px;object-fit:contain;" />` : ''}
              <h1 style="margin:0;font-size:22px;font-weight:600;color:#1a1a2e;">${companyName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#4a4a68;">
                Hola ${recipientName},
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4a4a68;">
                Alguien solicitó restablecer la contraseña de tu cuenta. Si fuiste tú, haz clic en el botón de abajo para elegir una nueva.
              </p>
              <p style="margin:0 0 24px;text-align:center;">
                <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#0d6efd;color:#ffffff !important;text-decoration:none;font-weight:600;font-size:15px;border-radius:8px;">Restablecer contraseña</a>
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#6c757d;">
                Si no pediste este cambio, no te preocupes. Tu contraseña sigue igual y puedes ignorar este correo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:#f8f9fa;border-top:1px solid #eee;">
              <p style="margin:0;font-size:12px;color:#6c757d;text-align:center;">
                Este correo fue enviado por ${companyName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}
