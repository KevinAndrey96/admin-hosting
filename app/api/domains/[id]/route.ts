import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

async function getDomainById(id: string) {
  const domain = await prisma.domain.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });
  if (!domain) return null;

  return {
    id: domain.id,
    userID: domain.userID,
    clientName: domain.user.fullName,
    clientEmail: domain.user.email,
    registrarName: domain.registrarName,
    fqdn: domain.fqdn,
    salePrice: Number(domain.salePrice),
    currency: domain.currency,
    billingCycle: domain.billingCycle,
    renewalDate: domain.renewalDate,
    nextBillingDate: domain.nextBillingDate,
    paymentStatus: domain.paymentStatus,
    serviceStatus: domain.serviceStatus,
    transferLock: domain.transferLock,
    healthStatus: domain.healthStatus,
    nameserver1: domain.nameserver1,
    nameserver2: domain.nameserver2,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
    whois: {
      registrantName: domain.registrantName ?? '',
      registrantOrg: domain.registrantOrg,
      registrantEmail: domain.registrantEmail ?? '',
      registrantPhone: domain.registrantPhone,
      registrantAddress: domain.registrantAddress,
      registrantCity: domain.registrantCity,
      registrantState: domain.registrantState,
      registrantCountry: domain.registrantCountry,
      registrantPostalCode: domain.registrantPostalCode,
      privacyEnabled: domain.privacyEnabled,
    },
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
    const domain = await getDomainById(id);

    if (!domain) {
      return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(domain);
  } catch (error) {
    console.error('Domain GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar dominio' },
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
    const existing = await prisma.domain.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
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
      whois: whoisInput,
      nameserver1: nameserver1Input,
      nameserver2: nameserver2Input,
    } = body;

    const data: Record<string, unknown> = {};

    if (userID?.trim()) {
      const user = await prisma.user.findUnique({
        where: { id: userID },
      });
      if (!user) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 404 }
        );
      }
      data.userID = userID;
    }

    if (registrarName?.trim()) {
      data.registrarName = registrarName.trim();
    }

    if (fqdn?.trim()) {
      data.fqdn = fqdn.trim().toLowerCase();
    }

    if (salePrice !== undefined) {
      const salePriceNum = parseFloat(salePrice);
      if (isNaN(salePriceNum) || salePriceNum < 0) {
        return NextResponse.json(
          { error: 'El precio debe ser un número válido' },
          { status: 400 }
        );
      }
      data.salePrice = salePriceNum;
    }

    if (currency?.trim()) data.currency = currency.trim();
    if (renewalDate) {
      const renewal = new Date(renewalDate);
      data.renewalDate = renewal;
      data.nextBillingDate = renewal;
    }

    if (paymentStatus && ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(paymentStatus)) {
      data.paymentStatus = paymentStatus;
    }
    if (serviceStatus && ['ACTIVE', 'AT_RISK', 'EXPIRED'].includes(serviceStatus)) {
      data.serviceStatus = serviceStatus;
    }

    if (transferLock !== undefined) data.transferLock = transferLock !== false;

    if (nameserver1Input !== undefined) {
      data.nameserver1 = typeof nameserver1Input === 'string' && nameserver1Input.trim() ? nameserver1Input.trim() : null;
    }
    if (nameserver2Input !== undefined) {
      data.nameserver2 = typeof nameserver2Input === 'string' && nameserver2Input.trim() ? nameserver2Input.trim() : null;
    }

    if (whoisInput && typeof whoisInput === 'object') {
      const {
        registrantName,
        registrantOrg,
        registrantEmail,
        registrantPhone,
        registrantAddress,
        registrantCity,
        registrantState,
        registrantCountry,
        registrantPostalCode,
        privacyEnabled,
      } = whoisInput;

      data.registrantName = String(registrantName ?? '').trim() || null;
      data.registrantOrg = registrantOrg?.trim() || null;
      data.registrantEmail = String(registrantEmail ?? '').trim() || null;
      data.registrantPhone = registrantPhone?.trim() || null;
      data.registrantAddress = registrantAddress?.trim() || null;
      data.registrantCity = registrantCity?.trim() || null;
      data.registrantState = registrantState?.trim() || null;
      data.registrantCountry = registrantCountry?.trim() || null;
      data.registrantPostalCode = registrantPostalCode?.trim() || null;
      data.privacyEnabled = Boolean(privacyEnabled);
    }

    await prisma.domain.update({
      where: { id },
      data,
    });

    const updated = await getDomainById(id);
    return NextResponse.json(updated!);
  } catch (error) {
    console.error('Domain PUT error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar dominio' },
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
    const domain = await prisma.domain.findUnique({ where: { id } });

    if (!domain) {
      return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
    }

    await prisma.domain.delete({ where: { id } });

    return NextResponse.json({ message: 'Dominio eliminado correctamente' });
  } catch (error) {
    console.error('Domain DELETE error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar dominio' },
      { status: 500 }
    );
  }
}
