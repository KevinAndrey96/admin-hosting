import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import https from 'https';
import http from 'http';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function requireAuth(session: { isLoggedIn: boolean; userId?: string; role?: string }) {
  return session.isLoggedIn && session.userId;
}

/** Validates fqdn format to prevent SSRF (only allow letters, numbers, hyphens, dots) */
function isValidFqdn(fqdn: string): boolean {
  if (!fqdn || fqdn.length > 253) return false;
  if (/[:/\\]/.test(fqdn)) return false; // No protocol or path
  return /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(fqdn);
}

async function ping(url: string, timeoutMs: number): Promise<{ status: number | null; error?: string }> {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;
    const opts: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: '/',
      method: 'GET', // HEAD often blocked by firewalls
      family: 4, // Force IPv4 - some hosts have broken IPv6
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AdminPanel/1.0)',
        Host: parsed.hostname,
      },
      ...(isHttps && { agent: httpsAgent }),
    };
    const req = lib.request(opts, (res) => {
      res.resume(); // Consume response body
      resolve({ status: res.statusCode ?? null });
    });
    req.on('error', (err) => {
      resolve({ status: null, error: err.message });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ status: null, error: 'timeout' });
    });
    req.end();
  });
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

    const timeoutMs = 15_000; // 15s - shared hosting can be slow

    // Try HTTPS first
    const httpsResult = await ping(`https://${fqdn}`, timeoutMs);
    if (httpsResult.status !== null) {
      return NextResponse.json({ statusCode: httpsResult.status });
    }

    // Fallback to HTTP
    const httpResult = await ping(`http://${fqdn}`, timeoutMs);
    if (httpResult.status !== null) {
      return NextResponse.json({ statusCode: httpResult.status });
    }

    // Log for debugging (check cPanel Node.js logs)
    console.error(`Domain ping failed for ${fqdn}:`, httpsResult.error || httpResult.error);
    return NextResponse.json({ statusCode: null });
  } catch (error) {
    console.error('Domain ping error:', error);
    return NextResponse.json({ statusCode: null });
  }
}
