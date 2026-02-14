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

    if (!requireAuth(session) || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);

    const [hostings, domains] = await Promise.all([
      prisma.hostingService.findMany({
        where: {
          serviceStatus: 'ENABLED',
          paymentStatus: 'PAID',
        },
        select: {
          nextBillingDate: true,
          hostingPackage: { select: { salePrice: true, currency: true } },
        },
      }),
      prisma.domain.findMany({
        where: { paymentStatus: 'PAID' },
        select: { nextBillingDate: true, salePrice: true, currency: true },
      }),
    ]);

    const monthly: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) monthly[m] = 0;

    for (const h of hostings) {
      const d = h.nextBillingDate;
      if (d.getFullYear() === year) {
        monthly[d.getMonth() + 1] += Number(h.hostingPackage.salePrice);
      }
    }
    for (const d of domains) {
      const date = d.nextBillingDate;
      if (date.getFullYear() === year) {
        monthly[date.getMonth() + 1] += Number(d.salePrice);
      }
    }

    const data = MONTH_LABELS.map((label, i) => ({
      month: label,
      monthNum: i + 1,
      income: monthly[i + 1],
    }));

    const total = data.reduce((s, d) => s + d.income, 0);
    const bestMonth = data.length ? data.reduce((a, b) => (a.income >= b.income ? a : b), data[0]) : null;
    const worstMonth = data.length ? data.reduce((a, b) => (a.income <= b.income ? a : b), data[0]) : null;
    const average = total / 12;

    const currency = hostings[0]?.hostingPackage.currency ?? domains[0]?.currency ?? 'COP';

    return NextResponse.json({
      year,
      currency,
      data,
      total,
      bestMonth: bestMonth ? { month: bestMonth.month, value: bestMonth.income } : null,
      worstMonth: worstMonth ? { month: worstMonth.month, value: worstMonth.income } : null,
      average,
    });
  } catch (error) {
    console.error('Monthly income error:', error);
    return NextResponse.json(
      { error: 'Error al cargar ingreso mensual' },
      { status: 500 }
    );
  }
}
