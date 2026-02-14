import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendEmail } from '@/lib/email';

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { packageID, packageName, salePrice, currency, requiresMigrationHelp, planSummary } = body;

    if (!packageID?.trim() || !packageName?.trim()) {
      return NextResponse.json(
        { error: 'Plan no especificado' },
        { status: 400 }
      );
    }

    const pkg = await prisma.hostingPackage.findUnique({
      where: { id: packageID },
    });
    if (!pkg) {
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      );
    }

    const client = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true, email: true, phone: true },
    });
    if (!client) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ENABLED' },
      select: { email: true, fullName: true },
    });

    const migrationHelp = requiresMigrationHelp === true ? 'Sí' : 'No';
    const summaryHtml = typeof planSummary === 'string' ? planSummary.replace(/\n/g, '<br>') : '';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Solicitud de hosting</title></head>
<body style="margin:0;padding:0;font-family:sans-serif;background:#f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a2e;">Solicitud de nuevo servicio de hosting</h2>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4a4a68;">
            <strong>${client.fullName}</strong> (${client.email})${client.phone ? ` · ${client.phone}` : ''} solicita contratar el plan:
          </p>
          <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#0d6efd;">${packageName}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#6c757d;">
            Precio: <strong>${currency} ${Number(salePrice || 0).toLocaleString()}/año</strong>
          </p>
          <p style="margin:0 0 16px;font-size:14px;color:#6c757d;">
            ¿Requiere asistencia durante la migración? <strong>${migrationHelp}</strong>
          </p>
          ${summaryHtml ? `
          <div style="margin:0 0 16px;padding:12px;background:#f8f9fa;border-radius:8px;font-size:13px;color:#495057;line-height:1.5;">
            <strong>Resumen del plan:</strong><br>${summaryHtml}
          </div>
          ` : ''}
          <p style="margin:0;font-size:14px;color:#6c757d;">
            Por favor, contacta al cliente para completar el proceso de pago y activación del servicio.
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
        subject: `[Solicitud] Nuevo hosting - ${packageName} - ${client.fullName}`,
        html,
      });
    }

    return NextResponse.json({
      message: 'Solicitud enviada. Te contactaremos pronto para completar el proceso de pago.',
    });
  } catch (error) {
    console.error('Hosting request-service error:', error);
    return NextResponse.json(
      { error: 'Error al enviar la solicitud' },
      { status: 500 }
    );
  }
}
