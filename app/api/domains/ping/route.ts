import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

function requireAuth(session: { isLoggedIn: boolean; userId?: string; role?: string }) {
  return session.isLoggedIn && session.userId;
}

/** Validates fqdn format to prevent SSRF (only allow letters, numbers, hyphens, dots) */
function isValidFqdn(fqdn: string): boolean {
  if (!fqdn || fqdn.length > 253) return false;
  if (/[:/\\]/.test(fqdn)) return false; // No protocol or path
  return /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(fqdn);
}

async function ping(url: string, timeoutMs: number): Promise<number | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AdminPanel/1.0' },
    });
    clearTimeout(timeout);
    return res.status;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fqdn = searchParams.get('fqdn')?.trim().toLowerCase();

    if (!fqdn || !isValidFqdn(fqdn)) {
      return NextResponse.json({ error: 'FQDN inválido', statusCode: null }, { status: 400 });
    }

    const where = session.role === 'ADMIN'
      ? { fqdn: fqdn }
      : { fqdn: fqdn, userID: session.userId };
    const domain = await prisma.domain.findFirst({ where });
    if (!domain) {
      return NextResponse.json({ error: 'Dominio no encontrado o sin acceso', statusCode: null }, { status: 403 });
    }

    const timeoutMs = 5_000;

    // Try HTTPS first
    const httpsStatus = await ping(`https://${fqdn}`, timeoutMs);
    if (httpsStatus !== null) {
      return NextResponse.json({ statusCode: httpsStatus });
    }

    // Fallback to HTTP
    const httpStatus = await ping(`http://${fqdn}`, timeoutMs);
    if (httpStatus !== null) {
      return NextResponse.json({ statusCode: httpStatus });
    }

    return NextResponse.json({ statusCode: null });
  } catch (error) {
    console.error('Domain ping error:', error);
    return NextResponse.json({ statusCode: null });
  }
}
