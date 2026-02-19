import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { requestDomainTransfer } from '@/lib/spaceship';
import { getDomainExpirationFromWhois } from '@/lib/whois-expiration';

/**
 * POST: Approve transfer - calls Spaceship and updates domain.
 * Admin only.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const domain = await prisma.domain.findUnique({
      where: { id },
      include: { user: { select: { fullName: true, email: true } } },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (domain.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: 'La solicitud ya fue procesada' },
        { status: 400 }
      );
    }

    if (!domain.authCode) {
      return NextResponse.json(
        { error: 'Falta el código de autorización' },
        { status: 400 }
      );
    }

    const whoisContact = {
      registrantName: domain.registrantName || domain.user.fullName,
      registrantOrg: domain.registrantOrg ?? null,
      registrantEmail: domain.registrantEmail || domain.user.email,
      registrantPhone: domain.registrantPhone ?? null,
      registrantAddress: domain.registrantAddress ?? null,
      registrantCity: domain.registrantCity ?? null,
      registrantState: domain.registrantState ?? null,
      registrantCountry: domain.registrantCountry ?? 'CO',
      registrantPostalCode: domain.registrantPostalCode ?? null,
    };

    const result = await requestDomainTransfer(
      domain.fqdn,
      domain.authCode,
      whoisContact,
      {
        years: 1,
        privacyEnabled: domain.privacyEnabled,
        autoRenew: false,
      }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get expiration from WHOIS (current at old registrar) + 1 year; fallback to today + 1 year
    const whoisExpiration = await getDomainExpirationFromWhois(domain.fqdn);
    const renewalDate = whoisExpiration
      ? new Date(whoisExpiration.getTime())
      : new Date();
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    await prisma.domain.update({
      where: { id },
      data: {
        registrarName: 'Spaceship',
        renewalDate,
        nextBillingDate: renewalDate,
        paymentStatus: 'PAID',
        status: 'ACTIVE',
        authCode: null,
      },
    });

    const updated = await prisma.domain.findUnique({
      where: { id },
      include: { user: { select: { fullName: true, email: true } } },
    });

    return NextResponse.json({
      message: 'Transferencia aprobada e iniciada en Spaceship.',
      domainId: id,
      domain: updated
        ? {
            id: updated.id,
            userID: updated.userID,
            clientName: updated.user.fullName,
            clientEmail: updated.user.email,
            registrarName: updated.registrarName,
            fqdn: updated.fqdn,
            salePrice: Number(updated.salePrice),
            currency: updated.currency,
            billingCycle: updated.billingCycle,
            renewalDate: updated.renewalDate?.toISOString(),
            nextBillingDate: updated.nextBillingDate?.toISOString(),
            paymentStatus: updated.paymentStatus,
            transferLock: updated.transferLock,
            healthStatus: updated.healthStatus,
            createdAt: updated.createdAt?.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error('Transfer approve error:', error);
    return NextResponse.json(
      { error: 'Error al aprobar la transferencia' },
      { status: 500 }
    );
  }
}
