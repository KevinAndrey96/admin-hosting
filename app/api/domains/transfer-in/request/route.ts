import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getDomainInfo, checkDomainAvailability } from '@/lib/spaceship';
import { getSettings } from '@/lib/settings';
import { isValidFqdn, isValidEmail } from '@/lib/domain-utils';

/**
 * Creates a transfer request (client flow only).
 * Does NOT call Spaceship - admin approves later.
 * Price comes from settings by TLD; if no price configured, uses 0.
 */
function requireAuth(session: { isLoggedIn: boolean; userId?: string; role?: string }) {
  return session.isLoggedIn && session.userId;
}

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

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Client flow only - admin uses direct transfer-in
    if (session.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Los administradores deben usar el flujo directo de transferencia' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      fqdn,
      authCode,
      privacyEnabled,
      whois,
    } = body;

    const targetUserID = session.userId!;
    const fqdnNorm = (fqdn || '').trim().toLowerCase();

    if (!fqdnNorm) {
      return NextResponse.json(
        { error: 'El dominio (FQDN) es requerido' },
        { status: 400 }
      );
    }

    if (!isValidFqdn(fqdnNorm)) {
      return NextResponse.json(
        { error: 'Formato de dominio inválido. Usa ejemplo.com' },
        { status: 400 }
      );
    }

    if (!authCode?.trim()) {
      return NextResponse.json(
        { error: 'El código de autorización (EPP) es requerido' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserID },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const existingDomain = await prisma.domain.findFirst({
      where: { fqdn: fqdnNorm },
    });
    if (existingDomain) {
      return NextResponse.json(
        { error: 'Este dominio ya está registrado en el sistema' },
        { status: 409 }
      );
    }

    const domainInSpaceship = await getDomainInfo(fqdnNorm);
    if (domainInSpaceship) {
      return NextResponse.json(
        { error: 'Este dominio ya está registrado con nosotros. No es necesario transferirlo.' },
        { status: 400 }
      );
    }

    const availability = await checkDomainAvailability(fqdnNorm);
    if (availability?.result === 'available') {
      return NextResponse.json(
        {
          error:
            'Este dominio está disponible para registro. No se puede transferir. Usa "Nuevo dominio" para registrarlo.',
        },
        { status: 400 }
      );
    }

    const whoisData = whois || {};
    const registrantEmail = (whoisData.registrantEmail || user.email || '').trim();
    if (!registrantEmail) {
      return NextResponse.json(
        { error: 'El email del registrante es requerido' },
        { status: 400 }
      );
    }
    if (!isValidEmail(registrantEmail)) {
      return NextResponse.json(
        { error: 'El email del registrante no es válido' },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const { price, currency } = getPriceFromSettings(settings, fqdnNorm);

    const whoisContact = {
      registrantName: whoisData.registrantName || user.fullName,
      registrantOrg: whoisData.registrantOrg ?? null,
      registrantEmail,
      registrantPhone: whoisData.registrantPhone ?? null,
      registrantAddress: whoisData.registrantAddress ?? null,
      registrantCity: whoisData.registrantCity ?? null,
      registrantState: whoisData.registrantState ?? null,
      registrantCountry: whoisData.registrantCountry ?? 'CO',
      registrantPostalCode: whoisData.registrantPostalCode ?? null,
    };

    const renewalDate = new Date();
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    const domain = await prisma.domain.create({
      data: {
        userID: targetUserID,
        registrarName: 'Spaceship',
        fqdn: fqdnNorm,
        salePrice: price,
        currency,
        renewalDate,
        nextBillingDate: renewalDate,
        paymentStatus: 'PENDING',
        status: 'PENDING_PAYMENT',
        authCode: authCode.trim(),
        privacyEnabled: Boolean(privacyEnabled),
        registrantName: whoisContact.registrantName || undefined,
        registrantOrg: whoisContact.registrantOrg || undefined,
        registrantEmail: whoisContact.registrantEmail || undefined,
        registrantPhone: whoisContact.registrantPhone || undefined,
        registrantAddress: whoisContact.registrantAddress || undefined,
        registrantCity: whoisContact.registrantCity || undefined,
        registrantState: whoisContact.registrantState || undefined,
        registrantCountry: whoisContact.registrantCountry || undefined,
        registrantPostalCode: whoisContact.registrantPostalCode || undefined,
      },
    });

    // Save registrant contact to user profile for future transfers
    const profileUpdate = {
      fullName: whoisContact.registrantName?.trim() || user.fullName,
      phone: whoisContact.registrantPhone?.trim() || null,
      address: whoisContact.registrantAddress?.trim() || null,
      city: whoisContact.registrantCity?.trim() || null,
      stateProvince: whoisContact.registrantState?.trim() || null,
      country: whoisContact.registrantCountry?.trim() || null,
      zipCode: whoisContact.registrantPostalCode?.trim() || null,
    };
    await prisma.user.update({
      where: { id: targetUserID },
      data: profileUpdate,
    });

    return NextResponse.json(
      {
        id: domain.id,
        fqdn: domain.fqdn,
        salePrice: Number(domain.salePrice),
        currency: domain.currency,
        message: 'Solicitud creada. Procede al pago.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Transfer request create error:', error);
    return NextResponse.json(
      { error: 'Error al crear la solicitud de transferencia' },
      { status: 500 }
    );
  }
}
