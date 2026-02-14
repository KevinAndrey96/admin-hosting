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

    const domains = await prisma.domain.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const list = domains.map((d) => ({
      id: d.id,
      userID: d.userID,
      clientName: d.user.fullName,
      clientEmail: d.user.email,
      registrarName: d.registrarName,
      fqdn: d.fqdn,
      salePrice: Number(d.salePrice),
      currency: d.currency,
      billingCycle: d.billingCycle,
      renewalDate: d.renewalDate,
      nextBillingDate: d.nextBillingDate,
      paymentStatus: d.paymentStatus,
      serviceStatus: d.serviceStatus,
      transferLock: d.transferLock,
      healthStatus: d.healthStatus,
      createdAt: d.createdAt,
    }));

    return NextResponse.json(list);
  } catch (error) {
    console.error('Domains GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar dominios' },
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
      registrarName,
      fqdn,
      salePrice,
      currency,
      renewalDate,
      paymentStatus,
      serviceStatus,
      transferLock,
    } = body;

    if (!userID?.trim()) {
      return NextResponse.json(
        { error: 'El cliente es requerido' },
        { status: 400 }
      );
    }

    const registrarNameNorm = registrarName?.trim();
    if (!registrarNameNorm) {
      return NextResponse.json(
        { error: 'El registrador es requerido' },
        { status: 400 }
      );
    }

    const fqdnNorm = fqdn?.trim()?.toLowerCase();
    if (!fqdnNorm) {
      return NextResponse.json(
        { error: 'El dominio (FQDN) es requerido' },
        { status: 400 }
      );
    }

    const salePriceNum = parseFloat(salePrice);
    if (isNaN(salePriceNum) || salePriceNum < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido' },
        { status: 400 }
      );
    }

    const renewal = renewalDate ? new Date(renewalDate) : new Date();

    const user = await prisma.user.findUnique({
      where: { id: userID },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const existing = await prisma.domain.findFirst({
      where: { fqdn: fqdnNorm, userID },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Este cliente ya tiene registrado ese dominio' },
        { status: 409 }
      );
    }

    const domain = await prisma.domain.create({
      data: {
        userID,
        registrarName: registrarNameNorm,
        fqdn: fqdnNorm,
        salePrice: salePriceNum,
        currency: currency?.trim() || 'COP',
        renewalDate: renewal,
        nextBillingDate: renewal,
        paymentStatus: paymentStatus && ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(paymentStatus)
          ? paymentStatus
          : 'PENDING',
        serviceStatus: serviceStatus && ['ACTIVE', 'AT_RISK', 'EXPIRED'].includes(serviceStatus)
          ? serviceStatus
          : 'ACTIVE',
        transferLock: transferLock !== false,
      },
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });

    return NextResponse.json(
      {
        id: domain.id,
        userID: domain.userID,
        clientName: domain.user.fullName,
        registrarName: domain.registrarName,
        fqdn: domain.fqdn,
        salePrice: Number(domain.salePrice),
        currency: domain.currency,
        paymentStatus: domain.paymentStatus,
        serviceStatus: domain.serviceStatus,
        nextBillingDate: domain.nextBillingDate,
        message: 'Dominio creado correctamente.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Domains POST error:', error);
    return NextResponse.json(
      { error: 'Error al crear dominio' },
      { status: 500 }
    );
  }
}
