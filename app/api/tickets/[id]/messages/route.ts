import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && ticket.userID !== session.userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'El contenido del mensaje no puede estar vacío' },
        { status: 400 }
      );
    }

    const isAdmin = session.role === 'ADMIN';

    // Status transition:
    // If ticket was closed/resolved and client replies -> reopen to IN_PROGRESS
    // If ticket was OPEN and admin replies -> transition to IN_PROGRESS
    let nextStatus = ticket.status;
    if (!isAdmin && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) {
      nextStatus = 'IN_PROGRESS';
    } else if (isAdmin && ticket.status === 'OPEN') {
      nextStatus = 'IN_PROGRESS';
    }

    const [newMessage] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketID: id,
          userID: session.userId,
          message: message.trim(),
          isAdmin,
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      }),
      prisma.ticket.update({
        where: { id },
        data: {
          status: nextStatus,
          updatedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ ok: true, message: newMessage }, { status: 201 });
  } catch (error: any) {
    console.error('Error posting ticket message:', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje', details: error?.message },
      { status: 500 }
    );
  }
}
