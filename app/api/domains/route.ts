import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { DomainStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registerDomain } from '@/lib/spaceship';
import type { WhoisContact } from '@/lib/spaceship';
import {
  whmCreateAccount,
  deriveWhmUsernameFromDomain,
} from '@/lib/whm-client';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const allStatuses = {
      status: {
        in: [DomainStatus.ACTIVE, DomainStatus.REJECTED, DomainStatus.PENDING_PAYMENT, DomainStatus.PENDING_APPROVAL, DomainStatus.REGISTRATION_REQUESTED],
      },
    };
    const where = session.role === 'ADMIN'
      ? allStatuses
      : { userID: session.userId, ...allStatuses };

    const domains = await prisma.domain.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const list = domains.map((d) => {
      const domain = d as typeof d & { user: { fullName: string; email: string } };
      return {
        id: domain.id,
        userID: domain.userID,
        clientName: domain.user.fullName,
        clientEmail: domain.user.email,
        registrarName: domain.registrarName,
        fqdn: domain.fqdn,
        salePrice: Number(domain.salePrice),
        currency: domain.currency,
        billingCycle: domain.billingCycle,
        renewalDate: domain.renewalDate,
        nextBillingDate: domain.nextBillingDate,
        paymentStatus: domain.paymentStatus,
        status: domain.status,
        transferLock: domain.transferLock,
        healthStatus: domain.healthStatus,
        createdAt: domain.createdAt,
      };
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Domains GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar dominios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userID,
      registrarName,
      fqdn,
      salePrice,
      currency,
      renewalDate,
      paymentStatus,
      transferLock,
      registerInSpaceship,
      createHostingWithPackage,
      hostingPackageID,
    } = body;

    if (!userID?.trim()) {
      return NextResponse.json(
        { error: 'El cliente es requerido' },
        { status: 400 }
      );
    }

    const wantSpaceship = Boolean(registerInSpaceship);
    const registrarNameNorm = wantSpaceship ? 'Spaceship' : (registrarName?.trim() || '');
    if (!registrarNameNorm) {
      return NextResponse.json(
        { error: 'El registrador es requerido' },
        { status: 400 }
      );
    }

    const fqdnNorm = fqdn?.trim()?.toLowerCase();
    if (!fqdnNorm) {
      return NextResponse.json(
        { error: 'El dominio (FQDN) es requerido' },
        { status: 400 }
      );
    }

    const salePriceNum = parseFloat(salePrice);
    if (isNaN(salePriceNum) || salePriceNum < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido' },
        { status: 400 }
      );
    }

    let renewal = renewalDate ? new Date(renewalDate) : new Date();

    const user = await prisma.user.findUnique({
      where: { id: userID },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const existing = await prisma.domain.findFirst({
      where: { fqdn: fqdnNorm, userID },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Este cliente ya tiene registrado ese dominio' },
        { status: 409 }
      );
    }

    if (wantSpaceship) {
      const whois: WhoisContact = {
        registrantName: user.fullName?.trim() || 'N/A',
        registrantOrg: user.companyName?.trim() || null,
        registrantEmail: user.email?.trim() || '',
        registrantPhone: user.phone?.trim() || null,
        registrantAddress: user.address?.trim() || null,
        registrantCity: user.city?.trim() || null,
        registrantState: user.stateProvince?.trim() || null,
        registrantCountry: user.country?.trim() || 'CO',
        registrantPostalCode: user.zipCode?.trim() || null,
      };
      const regResult = await registerDomain(fqdnNorm, whois, {
        years: 1,
        privacyEnabled: false,
        autoRenew: false,
      });
      if (!regResult.ok) {
        return NextResponse.json(
          { error: regResult.error || 'Error al registrar el dominio en Spaceship.' },
          { status: 502 }
        );
      }
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      renewal = oneYearFromNow;
    }

    const domain = await prisma.domain.create({
      data: {
        userID,
        registrarName: registrarNameNorm,
        fqdn: fqdnNorm,
        salePrice: salePriceNum,
        currency: currency?.trim() || 'COP',
        renewalDate: renewal,
        nextBillingDate: renewal,
        paymentStatus: paymentStatus && ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(paymentStatus)
          ? paymentStatus
          : 'PENDING',
        transferLock: transferLock !== false,
      },
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });

    const wantHosting = Boolean(createHostingWithPackage) && Boolean(hostingPackageID?.trim());
    let hostingMessage: string | undefined;

    if (wantHosting) {
      const pkg = await prisma.hostingPackage.findUnique({
        where: { id: hostingPackageID.trim() },
      });
      if (!pkg) {
        return NextResponse.json(
          {
            id: domain.id,
            userID: domain.userID,
            clientName: domain.user.fullName,
            registrarName: domain.registrarName,
            fqdn: domain.fqdn,
            salePrice: Number(domain.salePrice),
            currency: domain.currency,
            paymentStatus: domain.paymentStatus,
            nextBillingDate: domain.nextBillingDate,
            message: 'Dominio creado correctamente. El paquete de hosting no existe; crea el servidor manualmente si lo necesitas.',
          },
          { status: 201 }
        );
      }

      const whmUsername = deriveWhmUsernameFromDomain(fqdnNorm);
      const whmPassword = randomBytes(14).toString('base64').replace(/[+/=]/g, (c) =>
        c === '+' ? 'A' : c === '/' ? 'B' : '0'
      ).slice(0, 20);

      const whmPlan = pkg.id;
      const whmResult = await whmCreateAccount({
        username: whmUsername,
        domain: fqdnNorm,
        password: whmPassword,
        plan: whmPlan,
        contactemail: user.email?.trim() || undefined,
      });

      if (!whmResult.ok) {
        return NextResponse.json(
          {
            error: `Dominio creado, pero no se pudo crear la cuenta en WHM: ${whmResult.error}. Crea el hosting manualmente desde Hosting.`,
            domainId: domain.id,
          },
          { status: 502 }
        );
      }

      const nextBillingHosting = new Date();
      nextBillingHosting.setFullYear(nextBillingHosting.getFullYear() + 1);

      await prisma.hostingService.create({
        data: {
          userID,
          packageID: pkg.id,
          username: whmResult.username,
          nextBillingDate: nextBillingHosting,
          paymentStatus: 'PENDING',
          serviceStatus: 'ENABLED',
          domains: {
            create: [{ domainID: domain.id }],
          },
        },
      });
      hostingMessage = ' Cuenta de hosting creada en WHM.';
    }

    return NextResponse.json(
      {
        id: domain.id,
        userID: domain.userID,
        clientName: domain.user.fullName,
        registrarName: domain.registrarName,
        fqdn: domain.fqdn,
        salePrice: Number(domain.salePrice),
        currency: domain.currency,
        paymentStatus: domain.paymentStatus,
        nextBillingDate: domain.nextBillingDate,
        message: 'Dominio creado correctamente.' + (hostingMessage ?? ''),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Domains POST error:', error);
    return NextResponse.json(
      { error: 'Error al crear dominio' },
      { status: 500 }
    );
  }
}
