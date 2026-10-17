import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import {
  whmListAccounts,
  whmListEmailAccounts,
  whmCreateEmailAccount,
  whmUpdateEmailPassword,
  whmUpdateEmailQuota,
  whmDeleteEmailAccount,
} from '@/lib/whm-client';

function requireAuth(session: { isLoggedIn: boolean; userId?: string; role?: string }) {
  return session.isLoggedIn && session.userId;
}

/**
 * Resolves the effective cPanel username from a hosting service record.
 */
async function resolveCpanelUser(hosting: { username: string; domains: Array<{ domain: { fqdn: string } }> }) {
  const whmRes = await whmListAccounts();
  const accounts = whmRes.ok && whmRes.accounts ? whmRes.accounts : {};

  // Check direct username match
  const directMatch = Object.values(accounts).find(
    (a) => a.user.toLowerCase() === hosting.username.toLowerCase()
  );
  if (directMatch) return directMatch.user;

  // Check domain match
  for (const hd of hosting.domains) {
    const domainKey = hd.domain.fqdn.toLowerCase().trim();
    if (accounts[domainKey]) return accounts[domainKey].user;
  }

  return hosting.username.toLowerCase().trim();
}

/**
 * GET /api/emails?hostingId=...
 * Lists all email accounts for the selected hosting service.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedHostingId = searchParams.get('hostingId');

    // 1. Fetch hosting services available to this user
    const whereClause: any = session.role === 'ADMIN'
      ? { serviceStatus: { not: 'CANCELLED' } }
      : { userID: session.userId, serviceStatus: { not: 'CANCELLED' } };

    const hostings: any[] = await prisma.hostingService.findMany({
      where: whereClause,
      include: {
        user: { select: { fullName: true, email: true } },
        hostingPackage: {
          select: {
            id: true,
            name: true,
            diskSpaceQuotaMb: true,
            maxEmailAccounts: true,
          },
        },
        domains: { include: { domain: { select: { id: true, fqdn: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (hostings.length === 0) {
      return NextResponse.json({
        hostings: [],
        currentHosting: null,
        accounts: [],
        message: 'No tienes servicios de hosting activos configurados.',
      });
    }

    const selectedHosting: any = requestedHostingId
      ? hostings.find((h: any) => h.id === requestedHostingId)
      : hostings[0];

    if (!selectedHosting) {
      return NextResponse.json(
        { error: 'Servicio de hosting no encontrado o sin acceso' },
        { status: 404 }
      );
    }

    // 2. Resolve cPanel username
    const cpanelUser = await resolveCpanelUser(selectedHosting);

    // 3. Query cPanel UAPI for email accounts
    const emailRes = await whmListEmailAccounts(cpanelUser);
    if (!emailRes.ok) {
      return NextResponse.json({
        hostings: hostings.map((h: any) => ({
          id: h.id,
          username: h.username,
          packageName: h.hostingPackage?.name || 'Hosting',
          clientName: h.user?.fullName || '',
          domains: (h.domains || []).map((d: any) => d.domain?.fqdn || ''),
        })),
        currentHosting: {
          id: selectedHosting.id,
          username: selectedHosting.username,
          cpanelUser,
          packageName: selectedHosting.hostingPackage?.name || 'Hosting',
          maxEmailAccounts: selectedHosting.hostingPackage?.maxEmailAccounts ?? 'Ilimitadas',
          diskSpaceQuotaMb: selectedHosting.hostingPackage?.diskSpaceQuotaMb ?? null,
          domains: (selectedHosting.domains || []).map((d: any) => d.domain?.fqdn || ''),
        },
        accounts: [],
        error: `No se pudieron cargar los correos desde el servidor: ${emailRes.error}`,
      });
    }

    return NextResponse.json({
      hostings: hostings.map((h: any) => ({
        id: h.id,
        username: h.username,
        packageName: h.hostingPackage?.name || 'Hosting',
        clientName: h.user?.fullName || '',
        domains: (h.domains || []).map((d: any) => d.domain?.fqdn || ''),
      })),
      currentHosting: {
        id: selectedHosting.id,
        username: selectedHosting.username,
        cpanelUser,
        packageName: selectedHosting.hostingPackage?.name || 'Hosting',
        maxEmailAccounts: selectedHosting.hostingPackage?.maxEmailAccounts ?? 'Ilimitadas',
        diskSpaceQuotaMb: selectedHosting.hostingPackage?.diskSpaceQuotaMb ?? null,
        domains: (selectedHosting.domains || []).map((d: any) => d.domain?.fqdn || ''),
      },
      accounts: emailRes.accounts || [],
    });
  } catch (error) {
    console.error('Emails GET error:', error);
    return NextResponse.json(
      { error: 'Error al obtener cuentas de correo' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emails
 * Creates a new email account in cPanel.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { hostingId, email, domain, password, quotaMb } = body;

    if (!hostingId || !email || !domain || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos (hosting, correo, dominio, contraseña)' },
        { status: 400 }
      );
    }

    // Verify hosting ownership
    const hosting = await prisma.hostingService.findUnique({
      where: { id: hostingId },
      include: {
        hostingPackage: true,
        domains: { include: { domain: true } },
      },
    });

    if (!hosting) {
      return NextResponse.json({ error: 'Servicio de hosting no encontrado' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && hosting.userID !== session.userId) {
      return NextResponse.json({ error: 'No autorizado para este servicio' }, { status: 403 });
    }

    // Check plan email limits
    const maxEmails = hosting.hostingPackage?.maxEmailAccounts;
    const cpanelUser = await resolveCpanelUser(hosting);

    if (typeof maxEmails === 'number' && maxEmails > 0) {
      const existingList = await whmListEmailAccounts(cpanelUser);
      if (existingList.ok && existingList.accounts && existingList.accounts.length >= maxEmails) {
        return NextResponse.json(
          { error: `Has alcanzado el límite máximo de ${maxEmails} cuentas de correo permitidas por tu plan ${hosting.hostingPackage.name}.` },
          { status: 400 }
        );
      }
    }

    // Sanitize email prefix (letters, numbers, dot, underscore, dash)
    const sanitizedEmail = email.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const sanitizedDomain = domain.trim().toLowerCase();

    if (!sanitizedEmail) {
      return NextResponse.json({ error: 'El nombre de usuario del correo es inválido' }, { status: 400 });
    }

    const createRes = await whmCreateEmailAccount(cpanelUser, {
      email: sanitizedEmail,
      domain: sanitizedDomain,
      password: password.trim(),
      quotaMb: quotaMb !== undefined ? Number(quotaMb) : 1024,
    });

    if (!createRes.ok) {
      return NextResponse.json(
        { error: `Error de cPanel al crear cuenta de correo: ${createRes.error}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Cuenta de correo ${sanitizedEmail}@${sanitizedDomain} creada exitosamente.`,
      email: `${sanitizedEmail}@${sanitizedDomain}`,
    });
  } catch (error) {
    console.error('Emails POST error:', error);
    return NextResponse.json(
      { error: 'Error al crear la cuenta de correo' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/emails
 * Updates password or quota for an existing email account.
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { hostingId, email, domain, action, password, quotaMb } = body;

    if (!hostingId || !email || !domain || !action) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes (hostingId, email, domain, action)' },
        { status: 400 }
      );
    }

    const hosting = await prisma.hostingService.findUnique({
      where: { id: hostingId },
      include: { domains: { include: { domain: true } } },
    });

    if (!hosting) {
      return NextResponse.json({ error: 'Servicio de hosting no encontrado' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && hosting.userID !== session.userId) {
      return NextResponse.json({ error: 'No autorizado para este servicio' }, { status: 403 });
    }

    const cpanelUser = await resolveCpanelUser(hosting);
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedDomain = domain.trim().toLowerCase();

    if (action === 'password') {
      if (!password || password.trim().length < 8) {
        return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 });
      }
      const res = await whmUpdateEmailPassword(cpanelUser, {
        email: sanitizedEmail,
        domain: sanitizedDomain,
        password: password.trim(),
      });
      if (!res.ok) {
        return NextResponse.json({ error: `Error al cambiar contraseña: ${res.error}` }, { status: 502 });
      }
      return NextResponse.json({
        ok: true,
        message: `Contraseña de ${sanitizedEmail}@${sanitizedDomain} actualizada correctamente.`,
      });
    }

    if (action === 'quota') {
      const quotaNum = Number(quotaMb);
      if (isNaN(quotaNum) || quotaNum < 0) {
        return NextResponse.json({ error: 'Cuota de almacenamiento inválida' }, { status: 400 });
      }
      const res = await whmUpdateEmailQuota(cpanelUser, {
        email: sanitizedEmail,
        domain: sanitizedDomain,
        quotaMb: quotaNum,
      });
      if (!res.ok) {
        return NextResponse.json({ error: `Error al actualizar cuota: ${res.error}` }, { status: 502 });
      }
      return NextResponse.json({
        ok: true,
        message: `Cuota de ${sanitizedEmail}@${sanitizedDomain} actualizada a ${quotaNum === 0 ? 'Ilimitada' : `${quotaNum} MB`}.`,
      });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    console.error('Emails PUT error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cuenta de correo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/emails
 * Deletes an email account from cPanel.
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const hostingId = searchParams.get('hostingId');
    const email = searchParams.get('email');
    const domain = searchParams.get('domain');

    if (!hostingId || !email || !domain) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: hostingId, email, domain' },
        { status: 400 }
      );
    }

    const hosting = await prisma.hostingService.findUnique({
      where: { id: hostingId },
      include: { domains: { include: { domain: true } } },
    });

    if (!hosting) {
      return NextResponse.json({ error: 'Servicio de hosting no encontrado' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && hosting.userID !== session.userId) {
      return NextResponse.json({ error: 'No autorizado para este servicio' }, { status: 403 });
    }

    const cpanelUser = await resolveCpanelUser(hosting);
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedDomain = domain.trim().toLowerCase();

    const delRes = await whmDeleteEmailAccount(cpanelUser, {
      email: sanitizedEmail,
      domain: sanitizedDomain,
    });

    if (!delRes.ok) {
      return NextResponse.json(
        { error: `Error al eliminar cuenta de correo: ${delRes.error}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Cuenta de correo ${sanitizedEmail}@${sanitizedDomain} eliminada exitosamente.`,
    });
  } catch (error) {
    console.error('Emails DELETE error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la cuenta de correo' },
      { status: 500 }
    );
  }
}
