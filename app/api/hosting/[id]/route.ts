import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getHostingEffectivePrice, toNumber } from '@/lib/hosting-price';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

async function getHostingById(id: string) {
  const h = await prisma.hostingService.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      hostingPackage: { select: { id: true, name: true, salePrice: true, currency: true } },
      domains: { include: { domain: { select: { id: true, fqdn: true } } } },
    },
  });
  if (!h) return null;

  const { salePrice, currency } = getHostingEffectivePrice({
    salePriceOverride: h.salePriceOverride,
    hostingPackage: h.hostingPackage,
  });

  return {
    id: h.id,
    userID: h.userID,
    clientName: h.user.fullName,
    clientEmail: h.user.email,
    packageID: h.packageID,
    packageName: h.hostingPackage.name,
    salePrice,
    currency,
    salePriceOverride: toNumber(h.salePriceOverride) ?? null,
    domainIDs: h.domains.map((hd) => hd.domain.id),
    domainFqdns: h.domains.map((hd) => hd.domain.fqdn),
    username: h.username,
    billingCycle: h.billingCycle,
    nextBillingDate: h.nextBillingDate,
    paymentStatus: h.paymentStatus,
    serviceStatus: h.serviceStatus,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const hosting = await getHostingById(id);

    if (!hosting) {
      return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
    }

    return NextResponse.json(hosting);
  } catch (error) {
    console.error('Hosting GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar hosting' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.hostingService.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const {
      userID,
      packageID,
      domainIDs,
      username,
      nextBillingDate,
      paymentStatus,
      serviceStatus,
      salePriceOverride,
    } = body;

    const data: Record<string, unknown> = {};

    if (userID?.trim()) {
      const user = await prisma.user.findUnique({ where: { id: userID } });
      if (!user) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }
      data.userID = userID;
    }

    if (packageID?.trim()) {
      const pkg = await prisma.hostingPackage.findUnique({ where: { id: packageID } });
      if (!pkg) {
        return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 });
      }
      data.packageID = packageID;
    }

    if (username?.trim()) data.username = username.trim();

    if (nextBillingDate) data.nextBillingDate = new Date(nextBillingDate);
    if (paymentStatus && ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(paymentStatus)) {
      data.paymentStatus = paymentStatus;
    }
    if (serviceStatus && ['ENABLED', 'PENDING', 'SUSPENDED', 'CANCELLED'].includes(serviceStatus)) {
      data.serviceStatus = serviceStatus;
    }
    if (salePriceOverride !== undefined) {
      if (salePriceOverride === null || salePriceOverride === '') {
        data.salePriceOverride = null;
      } else {
        const overrideNum = parseFloat(salePriceOverride);
        if (!isNaN(overrideNum) && overrideNum >= 0) {
          data.salePriceOverride = overrideNum;
        }
      }
    }

    const domainIdsArr = Array.isArray(domainIDs)
      ? domainIDs.filter((d: string) => d && typeof d === 'string' && d.trim())
      : [];
    const effectiveUserID = (data.userID as string) || existing.userID;

    if (domainIdsArr.length > 0) {
      const domains = await prisma.domain.findMany({
        where: { id: { in: domainIdsArr }, userID: effectiveUserID },
      });
      if (domains.length !== domainIdsArr.length) {
        return NextResponse.json(
          { error: 'Uno o más dominios no encontrados o no pertenecen al cliente' },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction([
      prisma.hostingService.update({
        where: { id },
        data,
      }),
      prisma.hostingDomain.deleteMany({ where: { hostingID: id } }),
      ...(domainIdsArr.length > 0
        ? [
            prisma.hostingDomain.createMany({
              data: domainIdsArr.map((domainID: string) => ({ hostingID: id, domainID })),
            }),
          ]
        : []),
    ]);

    const updated = await getHostingById(id);
    return NextResponse.json(updated!);
  } catch (error) {
    console.error('Hosting PUT error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar hosting' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const hosting = await prisma.hostingService.findUnique({ where: { id } });

    if (!hosting) {
      return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
    }

    await prisma.hostingService.delete({ where: { id } });

    return NextResponse.json({ message: 'Hosting eliminado correctamente' });
  } catch (error) {
    console.error('Hosting DELETE error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar hosting' },
      { status: 500 }
    );
  }
}
