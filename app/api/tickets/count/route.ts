import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ ok: false, openCount: 0, urgentCount: 0 }, { status: 401 });
    }

    const baseWhere: any = session.role === 'ADMIN'
      ? { status: { in: ['OPEN', 'IN_PROGRESS'] } }
      : { userID: session.userId, status: { in: ['OPEN', 'IN_PROGRESS'] } };

    const [openCount, urgentCount] = await Promise.all([
      prisma.ticket.count({ where: baseWhere }),
      prisma.ticket.count({
        where: {
          ...baseWhere,
          priority: { in: ['HIGH', 'URGENT'] },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      openCount,
      urgentCount,
      role: session.role,
    });
  } catch (error: any) {
    console.error('Error fetching ticket counts:', error);
    return NextResponse.json(
      { ok: false, openCount: 0, urgentCount: 0, error: error?.message },
      { status: 500 }
    );
  }
}
