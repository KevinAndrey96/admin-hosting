import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session) || session.role === 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const userId = session.userId!;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);

    const [
      activeHostings,
      activeDomains,
      hostingsExpiring30Days,
      domainsExpiring30Days,
      currentUser,
    ] = await Promise.all([
      prisma.hostingService.count({
        where: {
          userID: userId,
          serviceStatus: 'ENABLED',
          paymentStatus: 'PAID',
        },
      }),
      prisma.domain.count({
        where: {
          userID: userId,
          paymentStatus: 'PAID',
        },
      }),
      prisma.hostingService.count({
        where: {
          userID: userId,
          serviceStatus: 'ENABLED',
          paymentStatus: 'PAID',
          nextBillingDate: { gte: now, lte: in30Days },
        },
      }),
      prisma.domain.count({
        where: {
          userID: userId,
          paymentStatus: 'PAID',
          nextBillingDate: { gte: now, lte: in30Days },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, isAgencyPartner: true },
      }),
    ]);

    let agencyPromotion = null;
    if (currentUser?.isAgencyPartner) {
      const primaryHosting = await prisma.hostingService.findFirst({
        where: {
          userID: userId,
          isPrimaryAgency: true,
        },
        include: {
          domains: { include: { domain: { select: { fqdn: true } } } },
        },
      });

      const referralsCount = primaryHosting
        ? await prisma.hostingService.count({
            where: { referredByHostingID: primaryHosting.id },
          })
        : 0;

      agencyPromotion = {
        active: true,
        primaryHosting: primaryHosting
          ? {
              id: primaryHosting.id,
              username: primaryHosting.username,
              nextBillingDate: primaryHosting.nextBillingDate,
              primaryDomain: primaryHosting.domains[0]?.domain.fqdn || `${primaryHosting.username}.com`,
            }
          : null,
        referralsCount,
        bonusMonthsEarned: referralsCount * 2,
      };
    }

    return NextResponse.json({
      activeHostings,
      activeDomains,
      hostingsExpiring30Days,
      domainsExpiring30Days,
      agencyPromotion,
    });
  } catch (error) {
    console.error('Client dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Error al cargar estadísticas' },
      { status: 500 }
    );
  }
}
