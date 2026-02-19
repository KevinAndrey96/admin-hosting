import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { requestDomainTransfer, getDomainInfo, checkDomainAvailability } from '@/lib/spaceship';
import { isValidFqdn, isValidEmail } from '@/lib/domain-utils';

function requireAuth(session: { isLoggedIn: boolean; userId?: string; role?: string }) {
  return session.isLoggedIn && session.userId;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userID,
      fqdn,
      authCode,
      salePrice,
      currency,
      privacyEnabled,
      whois,
    } = body;

    // Admin: userID required. Client: use session userId
    const targetUserID =
      session.role === 'ADMIN' && userID?.trim()
        ? userID.trim()
        : session.userId!;

    if (!targetUserID) {
      return NextResponse.json(
        { error: 'El cliente es requerido' },
        { status: 400 }
      );
    }

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

    const salePriceNum = parseFloat(salePrice);
    if (isNaN(salePriceNum) || salePriceNum < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido (0 o mayor)' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserID },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
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

    const result = await requestDomainTransfer(
      fqdnNorm,
      authCode,
      whoisContact,
      {
        years: 1,
        privacyEnabled: Boolean(privacyEnabled),
        autoRenew: false,
      }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    const renewalDate = new Date();
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    const domain = await prisma.domain.create({
      data: {
        userID: targetUserID,
        registrarName: 'Spaceship',
        fqdn: fqdnNorm,
        salePrice: salePriceNum,
        currency: (currency || 'COP').trim(),
        renewalDate,
        nextBillingDate: renewalDate,
        paymentStatus: 'PENDING',
        transferLock: true,
        registrantName: whoisContact.registrantName || undefined,
        registrantOrg: whoisContact.registrantOrg || undefined,
        registrantEmail: whoisContact.registrantEmail || undefined,
        registrantPhone: whoisContact.registrantPhone || undefined,
        registrantAddress: whoisContact.registrantAddress || undefined,
        registrantCity: whoisContact.registrantCity || undefined,
        registrantState: whoisContact.registrantState || undefined,
        registrantCountry: whoisContact.registrantCountry || undefined,
        registrantPostalCode: whoisContact.registrantPostalCode || undefined,
        privacyEnabled: Boolean(privacyEnabled),
      },
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });

    // Save registrant contact to user profile for future transfers (avoid updating email - used for login)
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
        operationId: result.operationId,
        message:
          'Transferencia iniciada correctamente. El dominio estará disponible en 5-7 días hábiles.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Transfer-in error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la transferencia' },
      { status: 500 }
    );
  }
}
