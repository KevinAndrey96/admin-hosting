import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import {
  whmListAccounts,
  whmCreateAccount,
  whmChangePackage,
  whmUnsuspendAccount,
} from '@/lib/whm-client';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
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
      include: {
        user: { select: { fullName: true, email: true } },
        hostingPackage: { select: { id: true, name: true } },
        domains: { include: { domain: { select: { fqdn: true } } } },
      },
    });

    if (!hosting) {
      return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    let password = body.password?.trim();
    if (!password) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
      password = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    const whmList = await whmListAccounts();
    const accounts = whmList.ok && whmList.accounts ? whmList.accounts : {};
    const existing = Object.values(accounts).find(
      (a) => a.user.toLowerCase() === hosting.username.toLowerCase()
    );

    if (existing) {
      // Sincronizar paquete y levantar suspensión si aplica
      await whmChangePackage(hosting.username, hosting.packageID);
      if (existing.suspended === 1) {
        await whmUnsuspendAccount(hosting.username);
      }
      await prisma.hostingService.update({
        where: { id },
        data: { serviceStatus: 'ENABLED' },
      });
      return NextResponse.json({
        ok: true,
        alreadyExisted: true,
        username: hosting.username,
        message: `La cuenta ${hosting.username} ya existía en WHM. Paquete y estado sincronizados a Activo.`,
      });
    }

    // Determinar dominio principal
    const linkedDomain = hosting.domains[0]?.domain.fqdn;
    const primaryDomain = linkedDomain ? linkedDomain.toLowerCase().trim() : `${hosting.username}.instanceshape.com`;

    const createRes = await whmCreateAccount({
      username: hosting.username,
      domain: primaryDomain,
      password,
      plan: hosting.packageID,
      contactemail: hosting.user.email?.trim() || undefined,
    });

    if (!createRes.ok) {
      return NextResponse.json(
        { error: `Error de WHM al aprovisionar cuenta: ${createRes.error}` },
        { status: 502 }
      );
    }

    await prisma.hostingService.update({
      where: { id },
      data: { serviceStatus: 'ENABLED' },
    });

    return NextResponse.json({
      ok: true,
      alreadyExisted: false,
      username: hosting.username,
      password,
      domain: primaryDomain,
      packageName: hosting.hostingPackage.name,
      message: `Cuenta de cPanel aprovisionada exitosamente en WHM para ${hosting.username}.`,
    });
  } catch (error) {
    console.error('Hosting provision error:', error);
    return NextResponse.json(
      { error: 'Error al aprovisionar servicio en WHM' },
      { status: 500 }
    );
  }
}
