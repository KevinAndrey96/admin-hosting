import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * POST: Reject transfer request.
 * Admin only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;

    const domain = await prisma.domain.findUnique({
      where: { id },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (domain.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: 'La solicitud ya fue procesada' },
        { status: 400 }
      );
    }

    await prisma.domain.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    // TODO: optional - send email to client with reason

    return NextResponse.json({
      message: 'Solicitud rechazada.',
    });
  } catch (error) {
    console.error('Transfer reject error:', error);
    return NextResponse.json(
      { error: 'Error al rechazar la solicitud' },
      { status: 500 }
    );
  }
}
