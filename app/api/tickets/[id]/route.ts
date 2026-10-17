import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
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
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            companyName: true,
            phone: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // Role security check
    if (session.role !== 'ADMIN' && ticket.userID !== session.userId) {
      return NextResponse.json({ error: 'Acceso denegado a este ticket' }, { status: 403 });
    }

    return NextResponse.json({ ok: true, ticket });
  } catch (error: any) {
    console.error('Error fetching ticket detail:', error);
    return NextResponse.json(
      { error: 'Error al consultar detalle del ticket', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { status, priority } = body;

    const updateData: any = {};

    if (status) {
      if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
        return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
      }
      // If client, can only mark as RESOLVED or CLOSED
      if (session.role !== 'ADMIN' && !['RESOLVED', 'CLOSED'].includes(status)) {
        return NextResponse.json(
          { error: 'Solo puedes marcar tu ticket como resuelto o cerrado' },
          { status: 403 }
        );
      }
      updateData.status = status;
    }

    if (priority) {
      if (session.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Solo un administrador puede modificar la prioridad' },
          { status: 403 }
        );
      }
      if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
        return NextResponse.json({ error: 'Prioridad no válida' }, { status: 400 });
      }
      updateData.priority = priority;
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, ticket: updated });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Error al actualizar ticket', details: error?.message },
      { status: 500 }
    );
  }
}
