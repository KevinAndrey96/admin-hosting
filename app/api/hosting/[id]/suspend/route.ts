import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { whmListAccounts, whmSuspendAccount, whmUnsuspendAccount } from '@/lib/whm-client';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

async function resolveWhmUsername(
  hosting: { username: string; domains: { domain: { fqdn: string } }[] }
): Promise<string> {
  const whmResult = await whmListAccounts();
  const whmByDomain = whmResult.ok && whmResult.accounts ? whmResult.accounts : {};
  const domains = hosting.domains.map((hd) => hd.domain.fqdn.toLowerCase().trim());
  const matchedDomain = domains.find((d) => d in whmByDomain);
  return matchedDomain ? whmByDomain[matchedDomain].user : hosting.username;
}

export async function POST(
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
    const hosting = await prisma.hostingService.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        serviceStatus: true,
        domains: { include: { domain: { select: { fqdn: true } } } },
      },
    });

    if (!hosting) {
      return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action === 'unsuspend' ? 'unsuspend' : 'suspend';
    const reason = typeof body?.reason === 'string' ? body.reason : undefined;

    const whmUsername = await resolveWhmUsername(hosting);

    if (action === 'suspend') {
      if (hosting.serviceStatus === 'SUSPENDED') {
        return NextResponse.json(
          { error: 'El hosting ya está suspendido' },
          { status: 400 }
        );
      }
      if (hosting.serviceStatus === 'CANCELLED') {
        return NextResponse.json(
          { error: 'No se puede suspender un hosting cancelado' },
          { status: 400 }
        );
      }

      const result = await whmSuspendAccount(whmUsername, reason || 'Suspensión desde panel admin');
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error || 'Error al suspender en WHM' },
          { status: 502 }
        );
      }

      await prisma.hostingService.update({
        where: { id },
        data: { serviceStatus: 'SUSPENDED' },
      });
    } else {
      if (hosting.serviceStatus !== 'SUSPENDED') {
        return NextResponse.json(
          { error: 'Solo se puede desuspender un hosting suspendido' },
          { status: 400 }
        );
      }

      const result = await whmUnsuspendAccount(whmUsername);
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error || 'Error al desuspender en WHM' },
          { status: 502 }
        );
      }

      await prisma.hostingService.update({
        where: { id },
        data: { serviceStatus: 'ENABLED' },
      });
    }

    const updated = await prisma.hostingService.findUnique({
      where: { id },
      select: { id: true, serviceStatus: true },
    });

    return NextResponse.json({
      message: action === 'suspend' ? 'Hosting suspendido correctamente' : 'Hosting desuspendido correctamente',
      serviceStatus: updated?.serviceStatus ? String(updated.serviceStatus) : (action === 'suspend' ? 'SUSPENDED' : 'ENABLED'),
    });
  } catch (error) {
    console.error('Hosting suspend/unsuspend error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
