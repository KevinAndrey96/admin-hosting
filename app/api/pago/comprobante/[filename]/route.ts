import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/session';

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { filename } = await params;
    // Evitar Path Traversal
    const safeFilename = path.basename(filename);
    if (!safeFilename || safeFilename.includes('..') || !safeFilename.startsWith('comprobante_')) {
      return NextResponse.json({ error: 'Archivo no válido' }, { status: 400 });
    }

    // Si es un cliente regular, validar que el archivo contenga su ID de usuario
    if (session.role !== 'ADMIN') {
      const userSnippet = session.userId?.slice(0, 8);
      if (!userSnippet || !safeFilename.includes(userSnippet)) {
        return NextResponse.json({ error: 'No tienes permisos para ver este comprobante' }, { status: 403 });
      }
    }

    const filepath = path.join(process.cwd(), 'uploads', 'comprobantes', safeFilename);
    const fileStats = await stat(filepath).catch(() => null);

    if (!fileStats || !fileStats.isFile()) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    const buffer = await readFile(filepath);
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error al servir comprobante:', error);
    return NextResponse.json({ error: 'Error al obtener el comprobante' }, { status: 500 });
  }
}
