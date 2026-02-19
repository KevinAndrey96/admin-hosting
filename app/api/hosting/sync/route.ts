import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { whmListAccounts, whmSuspendAccount, whmUnsuspendAccount } from '@/lib/whm-client';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

/**
 * POST /api/hosting/sync
 * Syncs WHM with DB: for each hosting, suspend/unsuspend in WHM according to DB serviceStatus.
 * DB is the source of truth.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const hostings = await prisma.hostingService.findMany({
      where: { serviceStatus: { not: 'CANCELLED' } },
      include: {
        domains: { include: { domain: { select: { fqdn: true } } } },
      },
    });

    const whmResult = await whmListAccounts();
    const whmByDomain = whmResult.ok && whmResult.accounts ? whmResult.accounts : {};

    if (!whmResult.ok) {
      return NextResponse.json({
        error: 'No se pudo conectar a WHM para obtener la lista de cuentas.',
        detail: whmResult.error,
        hint: 'Verifica WHM_HOST, WHM_PORT y WHM_API_TOKEN en .env. Sin esta conexión no podemos resolver el username correcto de cada cuenta.',
      }, { status: 502 });
    }

    let synced = 0;
    const errors: string[] = [];

    for (const h of hostings) {
      const domains = h.domains.map((hd) => hd.domain.fqdn.toLowerCase().trim());
      const matchedDomain = domains.find((d) => d in whmByDomain);
      const whmUser = matchedDomain ? whmByDomain[matchedDomain]?.user : null;
      const username = whmUser ?? h.username;

      if (h.serviceStatus === 'SUSPENDED') {
        const result = await whmSuspendAccount(username, 'Sincronización desde panel admin');
        if (result.ok) {
          synced++;
        } else {
          errors.push(`${h.username || domains[0]}: ${result.error}`);
        }
      } else {
        const result = await whmUnsuspendAccount(username);
        if (result.ok) {
          synced++;
        } else {
          errors.push(`${h.username || domains[0]}: ${result.error}`);
        }
      }
    }

    return NextResponse.json({
      message: `Sincronización completada: ${synced} de ${hostings.length} cuentas`,
      synced,
      total: hostings.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Hosting sync error:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar con WHM' },
      { status: 500 }
    );
  }
}
