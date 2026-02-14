import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

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
    const price = data.premiumPricing?.[0];

    return NextResponse.json({
      domain: data.domain || domain,
      available: result === 'available',
      result,
      price: price?.price,
      currency: price?.currency || 'USD',
    });
  } catch (error) {
    console.error('Check availability error:', error);
    return NextResponse.json(
      { error: 'Error de conexión al verificar disponibilidad' },
      { status: 500 }
    );
  }
}
