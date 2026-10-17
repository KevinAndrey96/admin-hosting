import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();

    const where: any = {};

    if (session.role !== 'ADMIN') {
      where.userID = session.userId;
    }

    if (status && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      where.status = status;
    }

    if (priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
      where.priority = priority;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { category: { contains: search } },
      ];
      if (!isNaN(Number(search))) {
        where.OR.push({ ticketNumber: Number(search) });
      }
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            companyName: true,
          },
        },
        _count: {
          select: { messages: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            message: true,
            createdAt: true,
            isAdmin: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, tickets });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Error al consultar tickets', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message, priority, category, serviceType, serviceId } = body;

    if (!subject?.trim()) {
      return NextResponse.json(
        { error: 'El asunto del ticket es obligatorio' },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'El mensaje descriptivo es obligatorio' },
        { status: 400 }
      );
    }

    const validPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)
      ? priority
      : 'MEDIUM';

    const validCategory = category?.trim() || 'General';

    // Create ticket and first message atomically
    const ticket = await prisma.ticket.create({
      data: {
        userID: session.userId,
        subject: subject.trim(),
        priority: validPriority,
        category: validCategory,
        serviceType: serviceType || null,
        serviceId: serviceId || null,
        status: 'OPEN',
        messages: {
          create: {
            userID: session.userId,
            message: message.trim(),
            isAdmin: session.role === 'ADMIN',
          },
        },
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        messages: true,
      },
    });

    return NextResponse.json({ ok: true, ticket }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Error al crear el ticket', details: error?.message },
      { status: 500 }
    );
  }
}
