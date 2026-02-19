import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * GET: List domains with pending transfer (admin: PENDING_PAYMENT + PENDING_APPROVAL; client: own)
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const isAdmin = session.role === 'ADMIN';
    const where = isAdmin
      ? { status: { in: ['PENDING_PAYMENT', 'PENDING_APPROVAL'] as const } }
      : { userID: session.userId, status: { in: ['PENDING_PAYMENT', 'PENDING_APPROVAL'] as const } };

    const domains = await prisma.domain.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
      },
    });

    const list = domains.map((d) => ({
      id: d.id,
      fqdn: d.fqdn,
      status: d.status,
      salePrice: Number(d.salePrice),
      currency: d.currency,
      createdAt: d.createdAt,
      user: d.user,
    }));

    return NextResponse.json(list);
  } catch (error) {
    console.error('Transfer requests list error:', error);
    return NextResponse.json(
      { error: 'Error al listar solicitudes' },
      { status: 500 }
    );
  }
}
