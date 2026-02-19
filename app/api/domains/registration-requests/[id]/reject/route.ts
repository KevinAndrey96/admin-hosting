import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * POST: Reject a domain registration request (admin only).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;

    const domain = await prisma.domain.findFirst({
      where: {
        id,
        status: { in: ['REGISTRATION_REQUESTED', 'PENDING_APPROVAL'] },
        authCode: null,
      },
    });

    if (!domain) {
      return NextResponse.json(
        { error: 'Solicitud de registro no encontrada o ya procesada' },
        { status: 404 }
      );
    }

    await prisma.domain.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    return NextResponse.json({ message: 'Solicitud de registro rechazada.' });
  } catch (error) {
    console.error('Reject registration error:', error);
    return NextResponse.json(
      { error: 'Error al rechazar la solicitud' },
      { status: 500 }
    );
  }
}
