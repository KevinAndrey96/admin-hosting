import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

const TIPO_LABELS: Record<string, string> = {
  'contratar-dominio': 'Contratar dominio',
  'renovar-dominio': 'Renovar dominio',
  'contratar-hosting': 'Contratar hosting',
  'renovar-hosting': 'Renovar hosting',
};

const METODO_LABELS: Record<string, string> = {
  bancolombia: 'Bancolombia',
  daviplata: 'Daviplata',
  nequi: 'Nequi',
  breb: 'Bre-B',
};

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const metodo = (formData.get('metodo') as string) || '';
    const monto = (formData.get('monto') as string) || '';
    const tipo = (formData.get('tipo') as string) || '';
    const tipoLabel = (formData.get('tipoLabel') as string) || TIPO_LABELS[tipo] || tipo;
    const itemLabel = (formData.get('itemLabel') as string) || '';
    const hostingId = (formData.get('hostingId') as string) || '';
    const packageId = (formData.get('packageId') as string) || '';

    if (!file || !file.size) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo no debe superar 5 MB' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten imágenes (JPEG, PNG, GIF, WebP) o PDF' }, { status: 400 });
    }

    const ext = file.type === 'application/pdf' ? '.pdf' : path.extname(file.name) || '.jpg';
    const filename = `comprobante_${Date.now()}_${session.userId?.slice(0, 8)}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Guardar en disco como respaldo
    const uploadDir = path.join(process.cwd(), 'uploads', 'comprobantes');
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const client = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true, email: true },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ENABLED' },
      select: { email: true },
    });

    const metodoLabel = METODO_LABELS[metodo] || metodo;
    const montoFormatted = monto ? `$ ${Number(monto).toLocaleString('es-CO')}` : '—';

    let hostingInfo: { id: string; username: string } | null = null;
    if (hostingId) {
      const hosting = await prisma.hostingService.findFirst({
        where: {
          id: hostingId,
          ...(session.role !== 'ADMIN' ? { userID: session.userId } : {}),
        },
        select: { id: true, username: true },
      });
      if (hosting) {
        hostingInfo = { id: hosting.id, username: hosting.username };
      }
    }

    const hostingRows = hostingInfo
      ? `
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>ID Hosting:</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${hostingInfo.id}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Usuario cPanel:</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${hostingInfo.username}</td></tr>`
      : '';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Comprobante de pago</title></head>
<body style="margin:0;padding:0;font-family:sans-serif;background:#f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a2e;">Comprobante de pago recibido</h2>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4a4a68;">
            <strong>${client?.fullName ?? '—'}</strong> (${client?.email ?? '—'}) ha enviado un comprobante de pago.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#4a4a68;">
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Operación:</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${tipoLabel}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Servicio:</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${itemLabel || '—'}</td></tr>
            ${hostingRows}
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Monto:</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${montoFormatted}</td></tr>
            <tr><td style="padding:8px 0;"><strong>Método de pago:</strong></td><td style="padding:8px 0;">${metodoLabel}</td></tr>
          </table>
          <p style="margin:16px 0 0;font-size:14px;color:#6c757d;">
            El comprobante está adjunto. Por favor, verifica el pago y procede manualmente a la renovación o activación del servicio.
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
        subject: `[Comprobante] ${tipoLabel} - ${itemLabel || '—'} - ${client?.fullName ?? '—'}`,
        html,
        attachments: [{ filename, content: buffer }],
      });
    }

    return NextResponse.json({
      message: 'Comprobante recibido correctamente. Por favor espere a que la transacción sea recibida, será notificado una vez se active el servicio.',
      filename,
    });
  } catch (error) {
    console.error('Comprobante upload error:', error);
    return NextResponse.json({ error: 'Error al subir el comprobante' }, { status: 500 });
  }
}
