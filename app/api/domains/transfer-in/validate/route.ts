import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/settings';
import { getDomainInfo, getDomainAvailabilityWithPricing } from '@/lib/spaceship';
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

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

/**
 * GET /api/domains/transfer-in/validate?domain=example.com&email=user@example.com
 * Validates that the domain can be transferred in (admin or client).
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain')?.trim().toLowerCase();
    const email = searchParams.get('email')?.trim();

    if (!domain) {
      return NextResponse.json(
        { valid: false, error: 'El dominio es requerido' },
        { status: 400 }
      );
    }

    if (!isValidFqdn(domain)) {
      return NextResponse.json(
        { valid: false, error: 'Formato de dominio inválido. Usa ejemplo.com' },
        { status: 400 }
      );
    }

    if (email !== undefined && email !== null && email !== '') {
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { valid: false, error: 'El email del registrante no es válido' },
          { status: 400 }
        );
      }
    }

    const existingDomain = await prisma.domain.findFirst({
      where: { fqdn: domain },
    });
    if (existingDomain) {
      return NextResponse.json(
        { valid: false, error: 'Este dominio ya está registrado en el sistema' },
        { status: 200 }
      );
    }

    const domainInSpaceship = await getDomainInfo(domain);
    if (domainInSpaceship) {
      return NextResponse.json(
        { valid: false, error: 'Este dominio ya está registrado con nosotros. No es necesario transferirlo.' },
        { status: 200 }
      );
    }

    const availability = await getDomainAvailabilityWithPricing(domain);
    if (!availability) {
      return NextResponse.json(
        { valid: false, error: 'No se pudo verificar el dominio. Intenta de nuevo más tarde.' },
        { status: 200 }
      );
    }

    if (availability.result === 'available') {
      return NextResponse.json(
        {
          valid: false,
          error:
            'Este dominio está disponible para registro. No se puede transferir un dominio libre. Usa "Nuevo dominio" para registrarlo.',
        },
        { status: 200 }
      );
    }

    const settings = await getSettings();
    const { price, currency } = getPriceFromSettings(settings, domain);

    return NextResponse.json({
      valid: true,
      domain: availability.domain || domain,
      message: 'El dominio es transferible. Los datos son correctos.',
      price,
      currency,
    });
  } catch (error) {
    console.error('Transfer-in validate error:', error);
    return NextResponse.json(
      { valid: false, error: 'Error al validar' },
      { status: 500 }
    );
  }
}
