import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const TRANSFER_STATUSES = ['PENDING_PAYMENT', 'PENDING_APPROVAL'] as ['PENDING_PAYMENT', 'PENDING_APPROVAL'];

/**
 * GET: List domains with pending TRANSFER only (authCode set).
 * Excludes registration requests (REGISTRATION_REQUESTED or PENDING_* without authCode).
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
      ? {
          status: { in: [...TRANSFER_STATUSES] },
          authCode: { not: null },
        }
      : {
          userID: session.userId,
          status: { in: [...TRANSFER_STATUSES] },
          authCode: { not: null },
        };

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
