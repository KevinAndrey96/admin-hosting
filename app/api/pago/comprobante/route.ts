import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/session';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

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
    const metodo = formData.get('metodo') as string | null;
    const monto = formData.get('monto') as string | null;

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
    const uploadDir = path.join(process.cwd(), 'uploads', 'comprobantes');
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // TODO: Registrar en DB (tipo, hostingId/domainId, userId, filename, monto, metodo) para seguimiento
    return NextResponse.json({
      message: 'Comprobante recibido correctamente. Nos pondremos en contacto contigo.',
      filename,
    });
  } catch (error) {
    console.error('Comprobante upload error:', error);
    return NextResponse.json({ error: 'Error al subir el comprobante' }, { status: 500 });
  }
}
