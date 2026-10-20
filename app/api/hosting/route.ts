import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { whmListAccounts, whmCreateAccount, whmChangePackage } from '@/lib/whm-client';
import { getHostingEffectivePrice, toNumber } from '@/lib/hosting-price';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const where = session.role === 'ADMIN'
      ? {}
      : { userID: session.userId };

    const hosting = await prisma.hostingService.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true } },
        hostingPackage: { select: { id: true, name: true, colorHex: true, salePrice: true, currency: true, diskSpaceQuotaMb: true } },
        domains: { include: { domain: { select: { id: true, fqdn: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const whmResult = await whmListAccounts();
    const whmByDomain = whmResult.ok && whmResult.accounts ? whmResult.accounts : {};

    const list = hosting.map((h) => {
      const domains = h.domains.map((hd) => hd.domain.fqdn.toLowerCase().trim());
      const matchedDomain = domains.find((d) => d in whmByDomain);
      const matchedByAccount = Object.values(whmByDomain).find(
        (a) => a.user.toLowerCase() === h.username.toLowerCase()
      );
      const diskUsed = matchedDomain
        ? whmByDomain[matchedDomain]?.diskused
        : matchedByAccount?.diskused;
      const { salePrice, currency } = getHostingEffectivePrice({
        salePriceOverride: h.salePriceOverride,
        hostingPackage: h.hostingPackage,
      });
      return {
        id: h.id,
        userID: h.userID,
        clientName: h.user.fullName,
        clientEmail: h.user.email,
        packageID: h.packageID,
        packageName: h.hostingPackage.name,
        packageColorHex: h.hostingPackage.colorHex,
        diskSpaceQuotaMb: h.hostingPackage.diskSpaceQuotaMb,
        diskUsed,
        salePrice,
        currency,
        salePriceOverride: toNumber(h.salePriceOverride) ?? null,
        domainIDs: h.domains.map((hd) => hd.domain.id),
        domainFqdns: h.domains.map((hd) => hd.domain.fqdn),
        username: h.username,
        billingCycle: h.billingCycle,
        nextBillingDate: h.nextBillingDate,
        paymentStatus: h.paymentStatus,
        serviceStatus: String(h.serviceStatus),
        paymentProofPath: h.paymentProofPath,
        isPrimaryAgency: Boolean(h.isPrimaryAgency),
        referredByHostingID: h.referredByHostingID ?? null,
        createdAt: h.createdAt,
      };
    });

    const res = NextResponse.json(list);
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (error) {
    console.error('Hosting GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar hosting' },
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
      packageID,
      domainIDs,
      username,
      nextBillingDate,
      paymentStatus,
      serviceStatus,
      salePriceOverride,
      referredByHostingID: rawRefId,
      isPrimaryAgency: rawPrimary,
    } = body;

    const referredByHostingID = rawRefId?.trim() || null;
    const isPrimaryAgency = Boolean(rawPrimary);

    let referralBonusMessage = '';
    if (referredByHostingID) {
      const agencyHosting = await prisma.hostingService.findUnique({
        where: { id: referredByHostingID },
      });
      if (agencyHosting) {
        // Extend agency hosting billing by 60 days (2 months)
        const currentBilling = new Date(agencyHosting.nextBillingDate);
        const newBilling = new Date(currentBilling.getTime() + 60 * 24 * 60 * 60 * 1000);
        await prisma.hostingService.update({
          where: { id: agencyHosting.id },
          data: { nextBillingDate: newBilling },
        });
        referralBonusMessage = ` Bonificación por referido: +2 meses otorgados a ${agencyHosting.username} (nuevo vencimiento: ${newBilling.toLocaleDateString('es-CO')}).`;
      }
    }

    if (!userID?.trim()) {
      return NextResponse.json(
        { error: 'El cliente es requerido' },
        { status: 400 }
      );
    }

    if (!packageID?.trim()) {
      return NextResponse.json(
        { error: 'El paquete es requerido' },
        { status: 400 }
      );
    }

    const usernameNorm = username?.trim();
    if (!usernameNorm) {
      return NextResponse.json(
        { error: 'El usuario/cpanel es requerido' },
        { status: 400 }
      );
    }

    const pkg = await prisma.hostingPackage.findUnique({
      where: { id: packageID },
    });
    if (!pkg) {
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userID },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const domainIdsArr = Array.isArray(domainIDs)
      ? domainIDs.filter((d: string) => d && typeof d === 'string' && d.trim())
      : [];
    if (domainIdsArr.length > 0) {
      const domains = await prisma.domain.findMany({
        where: { id: { in: domainIdsArr }, userID },
      });
      if (domains.length !== domainIdsArr.length) {
        return NextResponse.json(
          { error: 'Uno o más dominios no encontrados o no pertenecen al cliente' },
          { status: 400 }
        );
      }
    }

    const nextBilling = nextBillingDate ? new Date(nextBillingDate) : new Date();
    const overrideNum =
      salePriceOverride !== undefined && salePriceOverride !== null && salePriceOverride !== ''
        ? parseFloat(salePriceOverride)
        : null;
    const validOverride =
      overrideNum != null && !isNaN(overrideNum) && overrideNum >= 0 ? overrideNum : null;

    const autoProvision = body.autoProvision !== false;
    let whmPassword = body.cpanelPassword?.trim();
    let whmProvisioned = false;
    let whmMessage = '';

    if (autoProvision) {
      if (!whmPassword) {
        // Generate secure 16-character password (alphanumeric + symbols)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
        whmPassword = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      }

      // Check if account already exists in WHM
      const whmList = await whmListAccounts();
      const existingAccount = whmList.ok && whmList.accounts
        ? Object.values(whmList.accounts).find((a) => a.user.toLowerCase() === usernameNorm.toLowerCase())
        : null;

      if (!existingAccount) {
        // Primary domain: first linked domain or subdomain
        let primaryDomain = usernameNorm + '.instanceshape.com';
        if (domainIdsArr.length > 0) {
          const domRecord = await prisma.domain.findUnique({ where: { id: domainIdsArr[0] } });
          if (domRecord?.fqdn) primaryDomain = domRecord.fqdn.toLowerCase().trim();
        }

        const createRes = await whmCreateAccount({
          username: usernameNorm,
          domain: primaryDomain,
          password: whmPassword,
          plan: packageID,
          contactemail: user.email?.trim() || undefined,
        });

        if (!createRes.ok) {
          return NextResponse.json(
            { error: `Error de aprovisionamiento en WHM: ${createRes.error}` },
            { status: 502 }
          );
        }
        whmProvisioned = true;
        whmMessage = `Cuenta cPanel creada en WHM exitosamente (Usuario: ${usernameNorm}, Contraseña generada: ${whmPassword}).`;
      } else {
        // Account exists in WHM; synchronize package
        await whmChangePackage(usernameNorm, packageID);
        whmMessage = `La cuenta ya existía en WHM; paquete sincronizado a ${pkg.name}.`;
      }
    }

    const hosting = await prisma.hostingService.create({
      data: {
        userID,
        packageID,
        domains: domainIdsArr.length > 0
          ? { create: domainIdsArr.map((domainID: string) => ({ domainID })) }
          : undefined,
        username: usernameNorm,
        nextBillingDate: nextBilling,
        paymentStatus: paymentStatus && ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(paymentStatus)
          ? paymentStatus
          : 'PENDING',
        serviceStatus: serviceStatus && ['ENABLED', 'PENDING', 'SUSPENDED', 'CANCELLED'].includes(serviceStatus)
          ? serviceStatus
          : 'ENABLED',
        salePriceOverride: validOverride,
        isPrimaryAgency,
        referredByHostingID,
      },
      include: {
        user: { select: { fullName: true, email: true } },
        hostingPackage: { select: { name: true, salePrice: true, currency: true } },
        domains: { include: { domain: { select: { fqdn: true } } } },
      },
    });

    const { salePrice, currency } = getHostingEffectivePrice({
      salePriceOverride: hosting.salePriceOverride,
      hostingPackage: hosting.hostingPackage,
    });

    return NextResponse.json(
      {
        id: hosting.id,
        userID: hosting.userID,
        clientName: hosting.user.fullName,
        packageName: hosting.hostingPackage.name,
        salePrice,
        currency,
        salePriceOverride: toNumber(hosting.salePriceOverride) ?? null,
        domainFqdns: hosting.domains.map((hd) => hd.domain.fqdn),
        username: hosting.username,
        nextBillingDate: hosting.nextBillingDate,
        paymentStatus: hosting.paymentStatus,
        serviceStatus: hosting.serviceStatus,
        whmProvisioned,
        generatedPassword: whmProvisioned ? whmPassword : undefined,
        message: whmMessage
          ? `Hosting guardado. ${whmMessage}${referralBonusMessage}`
          : `Hosting creado correctamente.${referralBonusMessage}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Hosting POST error:', error);
    return NextResponse.json(
      { error: 'Error al crear hosting' },
      { status: 500 }
    );
  }
}
