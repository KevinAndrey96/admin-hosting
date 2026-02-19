import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getHostingEffectivePrice } from '@/lib/hosting-price';

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session) || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    const in5Days = new Date(now);
    in5Days.setDate(in5Days.getDate() + 5);

    const [
      totalDomains,
      activeDomains,
      domainsExpiring30Days,
      totalHostings,
      activeHostingsData,
      clientCount,
      hostingsExpiring5Days,
    ] = await Promise.all([
      prisma.domain.count(),
      prisma.domain.count({ where: { paymentStatus: 'PAID' } }),
      prisma.domain.count({
        where: {
          paymentStatus: 'PAID',
          nextBillingDate: { gte: now, lte: in30Days },
        },
      }),
      prisma.hostingService.count(),
      prisma.hostingService.findMany({
        where: {
          serviceStatus: 'ENABLED',
          paymentStatus: 'PAID',
        },
        select: {
          salePriceOverride: true,
          hostingPackage: { select: { salePrice: true, currency: true } },
        },
      }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.hostingService.count({
        where: {
          serviceStatus: 'ENABLED',
          paymentStatus: 'PAID',
          nextBillingDate: { lte: in5Days },
        },
      }),
    ]);

    const activeHostings = activeHostingsData.length;
    const activeHostingsAnnualValue = activeHostingsData.reduce((sum, h) => {
      const { salePrice } = getHostingEffectivePrice({
        salePriceOverride: h.salePriceOverride,
        hostingPackage: h.hostingPackage,
      });
      return sum + salePrice;
    }, 0);
    const currency = activeHostingsData[0]?.hostingPackage.currency ?? 'COP';

    return NextResponse.json({
      totalDomains,
      activeDomains,
      domainsExpiring30Days,
      totalHostings,
      activeHostings,
      activeHostingsAnnualValue,
      currency,
      clientCount,
      hostingsExpiring5Days,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Error al cargar estadísticas' },
      { status: 500 }
    );
  }
}
