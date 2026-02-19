import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registerDomain } from '@/lib/spaceship';
import { whmCreateAccount, deriveWhmUsernameFromDomain } from '@/lib/whm-client';

/**
 * POST: Approve domain registration request (admin only).
 * Order: (1) Create hosting in WHM + DB if withHosting, (2) Register domain in Spaceship, (3) Set domain ACTIVE.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn || session.role !== 'ADMIN') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const domainId = body?.domainId?.trim();

    if (!domainId) {
      return NextResponse.json(
        { message: 'El ID del dominio es requerido' },
        { status: 400 }
      );
    }

    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        status: { in: ['REGISTRATION_REQUESTED', 'PENDING_APPROVAL'] },
        authCode: null,
      },
      include: {
        user: { select: { fullName: true, email: true } },
        hostingDomains: {
          include: { hosting: true },
        },
      },
    });

    if (!domain) {
      return NextResponse.json(
        { message: 'Solicitud de registro no encontrada o ya procesada' },
        { status: 404 }
      );
    }

    const registrantEmail = (domain.registrantEmail || domain.user?.email || '').trim();
    if (!registrantEmail) {
      return NextResponse.json(
        { message: 'Falta el email del registrante en la solicitud' },
        { status: 400 }
      );
    }

    // 1) Create hosting in WHM if requested; update existing PENDING hosting or create new
    let hostingResult: { ok: true; username: string } | { ok: false; error: string } | null = null;
    if (domain.withHosting && domain.registrationPackageID) {
      const pkg = await prisma.hostingPackage.findUnique({
        where: { id: domain.registrationPackageID },
      });
      if (!pkg) {
        return NextResponse.json(
          { message: 'Paquete de hosting de la solicitud no existe' },
          { status: 400 }
        );
      }
      const whmUsername = deriveWhmUsernameFromDomain(domain.fqdn);
      const whmPassword = randomBytes(14)
        .toString('base64')
        .replace(/[+/=]/g, (c) => (c === '+' ? 'A' : c === '/' ? 'B' : '0'))
        .slice(0, 20);

      hostingResult = await whmCreateAccount({
        username: whmUsername,
        domain: domain.fqdn,
        password: whmPassword,
        plan: pkg.id,
        contactemail: domain.user?.email?.trim() || undefined,
      });

      if (!hostingResult.ok) {
        return NextResponse.json(
          { message: `No se pudo crear la cuenta en WHM: ${hostingResult.error}` },
          { status: 502 }
        );
      }

      const nextBillingHosting = new Date();
      nextBillingHosting.setFullYear(nextBillingHosting.getFullYear() + 1);

      const existingPendingHosting = domain.hostingDomains?.find(
        (hd) => hd.hosting?.serviceStatus === 'PENDING'
      )?.hosting;

      if (existingPendingHosting) {
        await prisma.hostingService.update({
          where: { id: existingPendingHosting.id },
          data: {
            username: hostingResult.ok ? hostingResult.username : existingPendingHosting.username,
            nextBillingDate: nextBillingHosting,
            serviceStatus: 'ENABLED',
          },
        });
      } else {
        await prisma.hostingService.create({
          data: {
            userID: domain.userID,
            packageID: pkg.id,
            username: hostingResult.ok ? hostingResult.username : whmUsername,
            nextBillingDate: nextBillingHosting,
            paymentStatus: 'PENDING',
            serviceStatus: 'ENABLED',
            domains: {
              create: [{ domainID: domain.id }],
            },
          },
        });
      }
    }

    // 2) Register domain in Spaceship
    const whois = {
      registrantName: (domain.registrantName || domain.user?.fullName || 'N/A').trim(),
      registrantOrg: domain.registrantOrg?.trim() || undefined,
      registrantEmail,
      registrantPhone: domain.registrantPhone?.trim() || undefined,
      registrantAddress: domain.registrantAddress?.trim() || undefined,
      registrantCity: domain.registrantCity?.trim() || undefined,
      registrantState: domain.registrantState?.trim() || undefined,
      registrantCountry: domain.registrantCountry?.trim() || 'CO',
      registrantPostalCode: domain.registrantPostalCode?.trim() || undefined,
    };

    const registrationResult = await registerDomain(domain.fqdn, whois, {
      years: 1,
      privacyEnabled: domain.privacyEnabled,
      autoRenew: false,
    });

    if (!registrationResult.ok) {
      return NextResponse.json(
        { message: `No se pudo registrar el dominio en Spaceship: ${registrationResult.error}` },
        { status: 502 }
      );
    }

    // 3) Update domain to ACTIVE and set renewal date
    const renewalDate = new Date();
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    await prisma.domain.update({
      where: { id: domainId },
      data: {
        status: 'ACTIVE',
        registrarName: 'Spaceship',
        paymentStatus: 'PAID',
        renewalDate,
        nextBillingDate: renewalDate,
        transferLock: true,
      },
    });

    return NextResponse.json({
      message: 'Registro de dominio aprobado. Hosting creado en WHM (si aplica) y dominio registrado en Spaceship.',
      domain: domain.fqdn,
      hostingCreated: !!hostingResult?.ok,
    });
  } catch (error) {
    console.error('Approve domain registration error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error al aprobar el registro' },
      { status: 500 }
    );
  }
}
