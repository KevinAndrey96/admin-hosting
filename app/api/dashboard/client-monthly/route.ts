import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session) || session.role === 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const userId = session.userId!;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);

    const [hostings, domains] = await Promise.all([
      prisma.hostingService.findMany({
        where: {
          userID: userId,
          serviceStatus: 'ENABLED',
          paymentStatus: 'PAID',
        },
        select: { nextBillingDate: true },
      }),
      prisma.domain.findMany({
        where: {
          userID: userId,
          paymentStatus: 'PAID',
        },
        select: { nextBillingDate: true },
      }),
    ]);

    const hostingByMonth: Record<number, number> = {};
    const domainByMonth: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      hostingByMonth[m] = 0;
      domainByMonth[m] = 0;
    }

    for (const h of hostings) {
      const d = h.nextBillingDate;
      if (d.getFullYear() === year) {
        hostingByMonth[d.getMonth() + 1] += 1;
      }
    }
    for (const d of domains) {
      const date = d.nextBillingDate;
      if (date.getFullYear() === year) {
        domainByMonth[date.getMonth() + 1] += 1;
      }
    }

    const data = MONTH_LABELS.map((label, i) => ({
      month: label,
      monthNum: i + 1,
      hosting: hostingByMonth[i + 1],
      domain: domainByMonth[i + 1],
    }));

    return NextResponse.json({ year, data });
  } catch (error) {
    console.error('Client monthly error:', error);
    return NextResponse.json(
      { error: 'Error al cargar datos mensuales' },
      { status: 500 }
    );
  }
}
