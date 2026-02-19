import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registerDomain } from '@/lib/spaceship';
import { whmCreateAccount, deriveWhmUsernameFromDomain } from '@/lib/whm-client';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn || session.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json(
        { message: 'El ID del dominio es requerido' },
        { status: 400 }
      );
    }

    // Get domain with registration request status
    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        status: 'REGISTRATION_REQUESTED',
      },
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
    });

    if (!domain) {
      return NextResponse.json(
        { message: 'Solicitud de registro no encontrada o ya procesada' },
        { status: 404 }
      );
    }

    // Create hosting account first if hosting is included
    let hostingResult = null;
    if (domain.withHosting && domain.registrationPackageID) {
      const username = deriveWhmUsernameFromDomain(domain.fqdn);
      const password = generateRandomPassword();
      
      hostingResult = await whmCreateAccount({
        domain: domain.fqdn,
        username,
        password,
        plan: domain.registrationPackageID,
        contactemail: domain.user.email,
      });

      if (!hostingResult.ok) {
        throw new Error(`Error en WHM: ${hostingResult.error}`);
      }

      // Create hosting service record
      await prisma.hostingService.create({
        data: {
          userID: domain.userID,
          packageID: domain.registrationPackageID,
          username: username,
          billingCycle: "ANNUAL",
          nextBillingDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          paymentStatus: "PAID", // Already paid
          serviceStatus: "ENABLED",
        },
      });
    }

    // Register domain in Spaceship second
    let registrationResult = null;
    if (domain.registrantEmail && domain.registrantName) {
      registrationResult = await registerDomain(
        domain.fqdn,
        {
          registrantName: domain.registrantName,
          registrantOrg: domain.registrantOrg || undefined,
          registrantEmail: domain.registrantEmail,
          registrantPhone: domain.registrantPhone || undefined,
          registrantAddress: domain.registrantAddress || undefined,
          registrantCity: domain.registrantCity || undefined,
          registrantState: domain.registrantState || undefined,
          registrantCountry: domain.registrantCountry || undefined,
          registrantPostalCode: domain.registrantPostalCode || undefined,
        },
        {
          years: 1,
          privacyEnabled: domain.privacyEnabled ?? false,
          autoRenew: false,
        }
      );

      if (!registrationResult.ok) {
        throw new Error(`Error en Spaceship: ${registrationResult.error}`);
      }
    }

    // Update domain status to ACTIVE
    await prisma.domain.update({
      where: { id: domainId },
      data: {
        status: 'ACTIVE',
        registrarName: 'Spaceship',
        paymentStatus: 'PAID',
        transferLock: true,
        healthStatus: 'UP',
      },
    });

    return NextResponse.json({
      message: 'Registro de dominio aprobado exitosamente',
      registrationResult,
      hostingResult,
    });
  } catch (error) {
    console.error('Error approving domain registration:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
