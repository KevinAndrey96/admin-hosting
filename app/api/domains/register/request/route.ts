import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/settings';
import { checkDomainAvailability } from '@/lib/spaceship';
import { isValidFqdn, isValidEmail } from '@/lib/domain-utils';

function getPriceFromSettings(settings: Record<string, string>, fqdn: string): { price: number; currency: string } {
  const domainLower = fqdn.toLowerCase();
  let price: number | null = null;
  const currency = 'COP';
  if (domainLower.endsWith('.com.co')) {
    const v = settings.domain_com_co_price?.trim();
    price = v ? Number(v) : null;
  } else if (domainLower.endsWith('.co')) {
    const v = settings.domain_co_price?.trim();
    price = v ? Number(v) : null;
  } else if (domainLower.endsWith('.com')) {
    const v = settings.domain_com_price?.trim();
    price = v ? Number(v) : null;
  } else if (domainLower.endsWith('.net')) {
    const v = settings.domain_net_price?.trim();
    price = v ? Number(v) : null;
  }
  return {
    price: price != null && !isNaN(price) ? price : 0,
    currency,
  };
}

/**
 * POST: Create domain registration request (client only).
 * When withHosting: creates Domain + HostingService (PENDING) + HostingDomain so pago can show price via hostingId; admin creates WHM account on approval.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    if (session.role === 'ADMIN') {
      return NextResponse.json(
        { message: 'Los administradores deben usar el flujo de nuevo dominio en el panel' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      fqdn,
      withHosting = false,
      packageID,
      registrantName,
      registrantOrg,
      registrantEmail,
      registrantPhone,
      registrantAddress,
      registrantCity,
      registrantState,
      registrantCountry,
      registrantPostalCode,
      privacyEnabled = false,
    } = body;

    const fqdnNorm = (fqdn || '').trim().toLowerCase();
    if (!fqdnNorm) {
      return NextResponse.json({ message: 'El dominio es requerido' }, { status: 400 });
    }
    if (!isValidFqdn(fqdnNorm)) {
      return NextResponse.json({ message: 'Formato de dominio inválido. Usa ejemplo.com' }, { status: 400 });
    }

    const email = (registrantEmail || '').trim();
    if (!email) {
      return NextResponse.json({ message: 'El email del registrante es requerido' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ message: 'El email del registrante no es válido' }, { status: 400 });
    }

    if (withHosting && !packageID) {
      return NextResponse.json(
        { message: 'El paquete de hosting es requerido cuando se selecciona hosting' },
        { status: 400 }
      );
    }

    const existingDomain = await prisma.domain.findFirst({
      where: { fqdn: fqdnNorm },
    });
    if (existingDomain) {
      return NextResponse.json({ message: 'El dominio ya existe en el sistema' }, { status: 409 });
    }

    const existingRequest = await prisma.domain.findFirst({
      where: {
        fqdn: fqdnNorm,
        userID: session.userId,
        status: { in: ['REGISTRATION_REQUESTED', 'PENDING_APPROVAL'] },
        authCode: null,
      },
    });
    if (existingRequest) {
      return NextResponse.json(
        { message: 'Ya tienes una solicitud de registro pendiente para este dominio' },
        { status: 409 }
      );
    }

    const availability = await checkDomainAvailability(fqdnNorm);
    if (!availability || availability.result !== 'available') {
      return NextResponse.json(
        { message: 'El dominio no está disponible para registro' },
        { status: 400 }
      );
    }

    if (withHosting && packageID) {
      const pkg = await prisma.hostingPackage.findUnique({
        where: { id: packageID },
      });
      if (!pkg) {
        return NextResponse.json({ message: 'El paquete de hosting seleccionado no existe' }, { status: 404 });
      }
    }

    const settings = await getSettings();
    const { price: salePrice, currency } = withHosting
      ? { price: 0, currency: 'COP' as const }
      : getPriceFromSettings(settings, fqdnNorm);

    const renewalDateObj = new Date();
    renewalDateObj.setFullYear(renewalDateObj.getFullYear() + 1);

    const domain = await prisma.$transaction(async (tx) => {
      const d = await tx.domain.create({
        data: {
          userID: session.userId,
          registrarName: 'Spaceship',
          fqdn: fqdnNorm,
          salePrice,
          currency,
          renewalDate: renewalDateObj,
          nextBillingDate: renewalDateObj,
          paymentStatus: 'PENDING',
          status: 'REGISTRATION_REQUESTED',
          withHosting: Boolean(withHosting),
          registrationPackageID: withHosting && packageID ? packageID : null,
          privacyEnabled: Boolean(privacyEnabled),
          registrantName: (registrantName || '').trim() || null,
          registrantOrg: (registrantOrg || '').trim() || null,
          registrantEmail: email,
          registrantPhone: (registrantPhone || '').trim() || null,
          registrantAddress: (registrantAddress || '').trim() || null,
          registrantCity: (registrantCity || '').trim() || null,
          registrantState: (registrantState || '').trim() || null,
          registrantCountry: (registrantCountry || '').trim() || 'CO',
          registrantPostalCode: (registrantPostalCode || '').trim() || null,
        },
      });

      let hostingId: string | null = null;
      if (withHosting && packageID) {
        const hostingUsername = fqdnNorm.split('.')[0] || fqdnNorm.replace(/\./g, '_');
        const hostingService = await tx.hostingService.create({
          data: {
            userID: session.userId,
            packageID,
            username: hostingUsername,
            nextBillingDate: renewalDateObj,
            paymentStatus: 'PENDING',
            serviceStatus: 'PENDING',
            domains: {
              create: [{ domainID: d.id }],
            },
          },
        });
        hostingId = hostingService.id;
      }

      return { domain: d, hostingId };
    });

    return NextResponse.json({
      message: 'Solicitud de registro creada. Serás redirigido al pago para subir el comprobante.',
      domainId: domain.domain.id,
      ...(domain.hostingId ? { hostingId: domain.hostingId } : {}),
    });
  } catch (error) {
    console.error('Error creating domain registration request:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
