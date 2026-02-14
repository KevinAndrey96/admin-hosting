import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/settings';

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

function isValidFqdn(fqdn: string): boolean {
  if (!fqdn || fqdn.length > 253) return false;
  if (/[:/\\]/.test(fqdn)) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(fqdn);
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain')?.trim().toLowerCase();

    if (!domain || !isValidFqdn(domain)) {
      return NextResponse.json(
        { error: 'Dominio inválido. Usa formato ejemplo.com' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SPACESHIP_API_KEY;
    const apiSecret = process.env.SPACESHIP_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Servicio de verificación no configurado. Contacta al administrador.' },
        { status: 503 }
      );
    }

    const res = await fetch(`https://spaceship.dev/api/v1/domains/${encodeURIComponent(domain)}/available`, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'X-Api-Secret': apiSecret,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Spaceship availability error:', res.status, data);
      return NextResponse.json(
        { error: data.detail || 'Error al verificar disponibilidad' },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const result = data.result === 'available' ? 'available' : 'taken';
    const domainLower = (data.domain || domain).toLowerCase();

    // For .com, .net, .com.co, .co: use configured price from settings
    const settings = await getSettings();
    let price: number | null = null;
    let currency = 'COP';

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

    // Fallback to Spaceship price when no configured price for these TLDs or for other TLDs
    if (price == null || isNaN(price)) {
      const priceObj =
        data.premiumPricing?.[0] ??
        data.pricing?.[0] ??
        (data.pricing && typeof data.pricing === 'object' && !Array.isArray(data.pricing) ? data.pricing : null);
      const rawPrice = priceObj?.price ?? data.price;
      price = rawPrice != null ? Number(rawPrice) : null;
      currency = priceObj?.currency ?? data.currency ?? 'COP';
    }

    if (price != null && isNaN(price)) price = null;

    return NextResponse.json({
      domain: data.domain || domain,
      available: result === 'available',
      result,
      price: price != null && !isNaN(price) ? price : null,
      currency,
    });
  } catch (error) {
    console.error('Check availability error:', error);
    return NextResponse.json(
      { error: 'Error de conexión al verificar disponibilidad' },
      { status: 500 }
    );
  }
}
