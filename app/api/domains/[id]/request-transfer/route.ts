import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendEmail } from '@/lib/email';

function requireAuth(session: { isLoggedIn: boolean; userId?: string; role?: string }) {
  return session.isLoggedIn && session.userId;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const domain = await prisma.domain.findUnique({
      where: { id },
      include: { user: { select: { fullName: true, email: true } } },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
    }

    if (domain.userID !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (domain.transferLock) {
      return NextResponse.json(
        { error: 'El bloqueo de transferencias está activo. Desactívalo primero.' },
        { status: 400 }
      );
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ENABLED' },
      select: { email: true, fullName: true },
    });

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Solicitud de código de transferencia</title></head>
<body style="margin:0;padding:0;font-family:sans-serif;background:#f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a2e;">Solicitud de código de transferencia</h2>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4a4a68;">
            La cuenta <strong>${domain.user.fullName}</strong> (${domain.user.email}) ha solicitado el código de transferencia para el dominio:
          </p>
          <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:#0d6efd;">${domain.fqdn}</p>
          <p style="margin:0;font-size:14px;color:#6c757d;">
            Por favor, procesa esta solicitud y envía el código de autorización al correo del cliente.
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
        subject: `[Solicitud] Código de transferencia - ${domain.fqdn}`,
        html,
      });
    }

    return NextResponse.json({
      message: 'Solicitud enviada. El código de transferencia llegará en las próximas horas a tu correo electrónico.',
    });
  } catch (error) {
    console.error('Request transfer error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
