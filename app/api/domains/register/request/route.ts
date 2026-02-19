import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getDomainPriceByTld } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      fqdn,
      withHosting = false,
      packageID,
      registrantName,
      registrantOrg,
      registrantEmail,
      registrantPhone,
      registrantAddress,
      registrantCity,
      registrantState,
      registrantCountry,
      registrantPostalCode,
      privacyEnabled = false,
    } = body;

    if (!fqdn) {
      return NextResponse.json(
        { message: "El dominio es requerido" },
        { status: 400 }
      );
    }

    if (!registrantName || !registrantEmail || !registrantPhone || !registrantAddress || !registrantCity || !registrantState || !registrantCountry) {
      return NextResponse.json(
        { message: "Los campos de contacto WHOIS son requeridos" },
        { status: 400 }
      );
    }

    if (withHosting && !packageID) {
      return NextResponse.json(
        { message: "El paquete de hosting es requerido cuando se selecciona hosting" },
        { status: 400 }
      );
    }

    // Check if domain already exists
    const existingDomain = await prisma.domain.findFirst({
      where: {
        fqdn: fqdn.toLowerCase(),
      },
    });

    if (existingDomain) {
      return NextResponse.json(
        { message: "El dominio ya existe en el sistema" },
        { status: 400 }
      );
    }

    // Verify package exists if hosting is selected
    if (withHosting && packageID) {
      const packageExists = await prisma.hostingPackage.findUnique({
        where: { id: packageID },
      });

      if (!packageExists) {
        return NextResponse.json(
          { message: "El paquete de hosting seleccionado no existe" },
          { status: 400 }
        );
      }
    }

    // Calculate price
    let salePrice = 0;
    if (!withHosting) {
      // Get domain price from settings based on TLD
      const tld = fqdn.split('.').pop()?.toLowerCase();
      if (tld) {
        const domainPrice = await getDomainPriceByTld(tld);
        salePrice = domainPrice || 0;
      }
    }

    // Create domain with REGISTRATION_REQUESTED status
    const domain = await prisma.domain.create({
      data: {
        userID: session.userId,
        registrarName: "PENDING", // Will be set by admin upon approval
        fqdn: fqdn.toLowerCase(),
        salePrice,
        currency: "COP",
        billingCycle: "ANNUAL",
        renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        nextBillingDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        paymentStatus: "PENDING",
        transferLock: true,
        healthStatus: "UNKNOWN",
        registrantName,
        registrantOrg,
        registrantEmail,
        registrantPhone,
        registrantAddress,
        registrantCity,
        registrantState,
        registrantCountry,
        registrantPostalCode,
        privacyEnabled,
        status: "REGISTRATION_REQUESTED",
        withHosting,
        registrationPackageID: withHosting ? packageID : null,
      },
    });

    // Create hosting service if hosting is selected
    let hostingId = null;
    if (withHosting && packageID) {
      const hostingService = await prisma.hostingService.create({
        data: {
          userID: session.userId,
          packageID,
          username: fqdn.split('.')[0], 
          billingCycle: "ANNUAL",
          nextBillingDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          paymentStatus: "PENDING",
          serviceStatus: "ENABLED",
        },
      });
      hostingId = hostingService.id;

      // Create the relationship between hosting and domain
      await prisma.hostingDomain.create({
        data: {
          hostingID: hostingId,
          domainID: domain.id,
        },
      });
    }

    // Flush Prisma to ensure data is written
    await prisma.$disconnect();
    await prisma.$connect();

    return NextResponse.json({
      message: "Solicitud de registro de dominio creada exitosamente",
      domainId: domain.id,
      hostingId: hostingId,
    });
  } catch (error) {
    console.error("Error creating domain registration request:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
