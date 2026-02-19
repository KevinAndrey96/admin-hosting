import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const registrationRequests = await prisma.domain.findMany({
      where: {
        status: 'REGISTRATION_REQUESTED',
      },
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const list = await Promise.all(
      registrationRequests.map(async (d) => {
        let hostingPackage = null;
        if (d.withHosting && d.registrationPackageID) {
          hostingPackage = await prisma.hostingPackage.findUnique({
            where: { id: d.registrationPackageID },
            select: { name: true },
          });
        }

        const domain = d as typeof d & { 
          user: { fullName: string; email: string } 
        };
        return {
          id: domain.id,
          fqdn: domain.fqdn,
          status: domain.status,
          salePrice: Number(domain.salePrice),
          currency: domain.currency,
          createdAt: domain.createdAt.toISOString(),
          withHosting: domain.withHosting,
          registrationPackageID: domain.registrationPackageID,
          user: domain.user,
          hostingPackage,
        };
      })
    );

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    return NextResponse.json(
      { error: 'Error al cargar solicitudes de registro' },
      { status: 500 }
    );
  }
}
