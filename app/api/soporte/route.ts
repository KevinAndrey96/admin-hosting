import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendEmail } from '@/lib/email';

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

const SUPPORT_LABELS: Record<string, string> = {
  tecnico: 'Soporte técnico',
  adquirir: 'Adquirir servicios',
  migracion: 'Ayuda con una migración',
  lento: 'Página web lenta',
  upgrade: 'Solicitar upgrade de hosting',
  facturacion: 'Facturación o pagos',
  dominio: 'Problemas con dominio',
  consulta: 'Consulta general',
  otro: 'Otro',
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { tipo, message } = body;

    if (!tipo?.trim()) {
      return NextResponse.json(
        { error: 'Selecciona un tipo de solicitud' },
        { status: 400 }
      );
    }

    const client = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true, email: true },
    });
    if (!client) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ENABLED' },
      select: { email: true },
    });

    if (admins.length === 0) {
      return NextResponse.json(
        { error: 'No hay administradores configurados para recibir solicitudes' },
        { status: 500 }
      );
    }

    const tipoLabel = SUPPORT_LABELS[tipo] || tipo;
    const mensajeHtml = (message || '(Sin mensaje adicional)').trim().replace(/\n/g, '<br>');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Solicitud de soporte</title></head>
<body style="margin:0;padding:0;font-family:sans-serif;background:#f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a2e;">Nueva solicitud de soporte</h2>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4a4a68;">
            <strong>${client.fullName}</strong> (${client.email}) ha enviado una solicitud de soporte.
          </p>
          <p style="margin:0 0 8px;font-size:14px;color:#6c757d;">
            <strong>Tipo:</strong> ${tipoLabel}
          </p>
          <div style="margin:16px 0 0;padding:16px;background:#f8f9fa;border-radius:8px;font-size:14px;color:#495057;line-height:1.6;">
            <strong>Mensaje:</strong><br>${mensajeHtml}
          </div>
          <p style="margin:20px 0 0;font-size:13px;color:#6c757d;">
            Responde al cliente desde el panel o por correo a ${client.email}.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `[Soporte] ${tipoLabel} - ${client.fullName}`,
        html,
      });
    }

    return NextResponse.json({
      message: 'Solicitud enviada correctamente. Te contactaremos pronto por correo.',
    });
  } catch (error) {
    console.error('Soporte error:', error);
    return NextResponse.json(
      { error: 'Error al enviar la solicitud' },
      { status: 500 }
    );
  }
}
