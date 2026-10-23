import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import {
  whmCreateUserSession,
  whmResolveAccountUsername,
  type WhmUserSessionService,
} from '@/lib/whm-client';

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

function parseService(value: unknown): WhmUserSessionService | null {
  if (value === 'cpanel' || value === 'webmail') {
    return value;
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const service = parseService(body?.service);
    if (!service) {
      return NextResponse.json({ error: 'Servicio no válido' }, { status: 400 });
    }

    const hosting = await prisma.hostingService.findUnique({
      where: { id },
      select: {
        id: true,
        userID: true,
        username: true,
        serviceStatus: true,
        domains: { include: { domain: { select: { fqdn: true } } } },
      },
    });

    if (!hosting) {
      return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && hosting.userID !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (hosting.serviceStatus !== 'ENABLED') {
      return NextResponse.json(
        { error: 'El servicio no está activo; no se puede acceder a cPanel' },
        { status: 400 }
      );
    }

    const domainFqdns = hosting.domains.map((hd) => hd.domain.fqdn);
    const whmUser = await whmResolveAccountUsername({
      username: hosting.username,
      domainFqdns,
    });

    const sessionResult = await whmCreateUserSession(whmUser, service);
    if (!sessionResult.ok || !sessionResult.url) {
      return NextResponse.json(
        { error: sessionResult.error || 'No se pudo crear la sesión en WHM' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: sessionResult.url });
  } catch (error) {
    console.error('Hosting SSO error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
