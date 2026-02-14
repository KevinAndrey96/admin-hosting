import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendEmail } from '@/lib/email';
import { getSettings } from '@/lib/settings';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const hosting = await prisma.hostingService.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        hostingPackage: { select: { name: true } },
      },
    });

    if (!hosting) {
      return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
    }

    const currentDate = new Date(hosting.nextBillingDate);
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + 1);

    await prisma.hostingService.update({
      where: { id },
      data: {
        nextBillingDate: newDate,
        paymentStatus: 'PAID',
      },
    });

    const settings = await getSettings();
    const companyName = settings.company_name || 'Admin';
    const logoUrl = settings.logo_url || '';
    const logoFullUrl = logoUrl?.startsWith('http') ? logoUrl : logoUrl ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://instanceshape.com'}${logoUrl}` : '';

    const formatDate = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Servicio renovado</title></head>
<body style="margin:0;padding:0;font-family:sans-serif;background:#f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;">
          ${logoFullUrl ? `<img src="${logoFullUrl}" alt="${companyName}" width="64" height="64" style="display:block;margin-bottom:16px;object-fit:contain;" />` : ''}
          <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a2e;">Servicio de hosting renovado</h2>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4a4a68;">
            Hola <strong>${hosting.user.fullName}</strong>,
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a68;">
            Te informamos que tu plan de hosting <strong>${hosting.hostingPackage.name}</strong> (usuario cPanel: <strong>${hosting.username}</strong>) ha sido renovado correctamente por un año adicional.
          </p>
          <div style="margin:0 0 16px;padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
            <p style="margin:0 0 8px;font-size:14px;color:#166534;">
              <strong>Fecha anterior de vencimiento:</strong> ${formatDate(currentDate)}
            </p>
            <p style="margin:0;font-size:14px;color:#166534;">
              <strong>Nueva fecha de vencimiento:</strong> ${formatDate(newDate)}
            </p>
          </div>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#6c757d;">
            Tu servicio continúa activo sin interrupciones. Si tienes alguna pregunta, no dudes en contactarnos.
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8f9fa;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#6c757d;text-align:center;">
            Este correo fue enviado por ${companyName}.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await sendEmail({
      to: hosting.user.email,
      subject: `[${companyName}] Tu hosting ha sido renovado - ${hosting.hostingPackage.name}`,
      html,
    });

    return NextResponse.json({
      message: 'Servicio renovado correctamente. Se ha enviado un correo al cliente.',
      nextBillingDate: newDate.toISOString(),
    });
  } catch (error) {
    console.error('Hosting renew error:', error);
    return NextResponse.json(
      { error: 'Error al renovar el servicio' },
      { status: 500 }
    );
  }
}
