import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { whmListAccounts } from '@/lib/whm-client';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const where = session.role === 'ADMIN'
      ? {}
      : { userID: session.userId };

    const hosting = await prisma.hostingService.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true } },
        hostingPackage: { select: { id: true, name: true, colorHex: true, salePrice: true, currency: true, diskSpaceQuotaMb: true } },
        domains: { include: { domain: { select: { id: true, fqdn: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const whmResult = await whmListAccounts();
    const whmByDomain = whmResult.ok && whmResult.accounts ? whmResult.accounts : {};

    const list = hosting.map((h) => {
      const domains = h.domains.map((hd) => hd.domain.fqdn.toLowerCase().trim());
      const matchedDomain = domains.find((d) => d in whmByDomain);
      const diskUsed = matchedDomain ? whmByDomain[matchedDomain]?.diskused : undefined;
      return {
        id: h.id,
        userID: h.userID,
        clientName: h.user.fullName,
        clientEmail: h.user.email,
        packageID: h.packageID,
        packageName: h.hostingPackage.name,
        packageColorHex: h.hostingPackage.colorHex,
        diskSpaceQuotaMb: h.hostingPackage.diskSpaceQuotaMb,
        diskUsed,
        salePrice: Number(h.hostingPackage.salePrice),
        currency: h.hostingPackage.currency,
        domainIDs: h.domains.map((hd) => hd.domain.id),
        domainFqdns: h.domains.map((hd) => hd.domain.fqdn),
        username: h.username,
        billingCycle: h.billingCycle,
        nextBillingDate: h.nextBillingDate,
        paymentStatus: h.paymentStatus,
        serviceStatus: String(h.serviceStatus),
        createdAt: h.createdAt,
      };
    });

    const res = NextResponse.json(list);
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (error) {
    console.error('Hosting GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar hosting' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
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
    } = body;

    if (!userID?.trim()) {
      return NextResponse.json(
        { error: 'El cliente es requerido' },
        { status: 400 }
      );
    }

    if (!packageID?.trim()) {
      return NextResponse.json(
        { error: 'El paquete es requerido' },
        { status: 400 }
      );
    }

    const usernameNorm = username?.trim();
    if (!usernameNorm) {
      return NextResponse.json(
        { error: 'El usuario/cpanel es requerido' },
        { status: 400 }
      );
    }

    const pkg = await prisma.hostingPackage.findUnique({
      where: { id: packageID },
    });
    if (!pkg) {
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userID },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const domainIdsArr = Array.isArray(domainIDs)
      ? domainIDs.filter((d: string) => d && typeof d === 'string' && d.trim())
      : [];
    if (domainIdsArr.length > 0) {
      const domains = await prisma.domain.findMany({
        where: { id: { in: domainIdsArr }, userID },
      });
      if (domains.length !== domainIdsArr.length) {
        return NextResponse.json(
          { error: 'Uno o más dominios no encontrados o no pertenecen al cliente' },
          { status: 400 }
        );
      }
    }

    const nextBilling = nextBillingDate ? new Date(nextBillingDate) : new Date();

    const hosting = await prisma.hostingService.create({
      data: {
        userID,
        packageID,
        domains: domainIdsArr.length > 0
          ? { create: domainIdsArr.map((domainID: string) => ({ domainID })) }
          : undefined,
        username: usernameNorm,
        nextBillingDate: nextBilling,
        paymentStatus: paymentStatus && ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(paymentStatus)
          ? paymentStatus
          : 'PENDING',
        serviceStatus: serviceStatus && ['ENABLED', 'SUSPENDED', 'CANCELLED'].includes(serviceStatus)
          ? serviceStatus
          : 'ENABLED',
      },
      include: {
        user: { select: { fullName: true, email: true } },
        hostingPackage: { select: { name: true, salePrice: true, currency: true } },
        domains: { include: { domain: { select: { fqdn: true } } } },
      },
    });

    return NextResponse.json(
      {
        id: hosting.id,
        userID: hosting.userID,
        clientName: hosting.user.fullName,
        packageName: hosting.hostingPackage.name,
        salePrice: Number(hosting.hostingPackage.salePrice),
        domainFqdns: hosting.domains.map((hd) => hd.domain.fqdn),
        username: hosting.username,
        nextBillingDate: hosting.nextBillingDate,
        paymentStatus: hosting.paymentStatus,
        serviceStatus: hosting.serviceStatus,
        message: 'Hosting creado correctamente.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Hosting POST error:', error);
    return NextResponse.json(
      { error: 'Error al crear hosting' },
      { status: 500 }
    );
  }
}
