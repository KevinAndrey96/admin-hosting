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
      whois: true,
      nameservers: { orderBy: { position: 'asc' } },
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
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
    whois: domain.whois
      ? {
          id: domain.whois.id,
          registrantName: domain.whois.registrantName,
          registrantOrg: domain.whois.registrantOrg,
          registrantEmail: domain.whois.registrantEmail,
          registrantPhone: domain.whois.registrantPhone,
          registrantAddress: domain.whois.registrantAddress,
          registrantCity: domain.whois.registrantCity,
          registrantState: domain.whois.registrantState,
          registrantCountry: domain.whois.registrantCountry,
          registrantPostalCode: domain.whois.registrantPostalCode,
          privacyEnabled: domain.whois.privacyEnabled,
        }
      : null,
    nameservers: domain.nameservers.map((ns) => ({
      id: ns.id,
      ipv4: ns.ipv4,
      position: ns.position,
    })),
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
      nameservers: nameserversInput,
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

    await prisma.domain.update({
      where: { id },
      data,
    });

    // Upsert WHOIS
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

      const whoisData = {
        registrantName: String(registrantName ?? '').trim() || 'N/A',
        registrantOrg: registrantOrg?.trim() || null,
        registrantEmail: String(registrantEmail ?? '').trim() || 'N/A',
        registrantPhone: registrantPhone?.trim() || null,
        registrantAddress: registrantAddress?.trim() || null,
        registrantCity: registrantCity?.trim() || null,
        registrantState: registrantState?.trim() || null,
        registrantCountry: registrantCountry?.trim() || null,
        registrantPostalCode: registrantPostalCode?.trim() || null,
        privacyEnabled: Boolean(privacyEnabled),
      };

      await prisma.domainWhois.upsert({
        where: { domainID: id },
        create: { domainID: id, ...whoisData },
        update: whoisData,
      });
    }

    // Replace nameservers (máx 2, solo IPv4)
    if (Array.isArray(nameserversInput)) {
      await prisma.domainNameserver.deleteMany({ where: { domainID: id } });
      const validNs = nameserversInput
        .filter((ns: { ipv4?: string }) => ns && typeof ns.ipv4 === 'string' && ns.ipv4.trim())
        .slice(0, 2);
      if (validNs.length > 0) {
        await prisma.domainNameserver.createMany({
          data: validNs.map((ns: { ipv4: string }, i: number) => ({
            domainID: id,
            ipv4: ns.ipv4.trim(),
            position: i,
          })),
        });
      }
    }

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
