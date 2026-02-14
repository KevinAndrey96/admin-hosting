import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendEmail } from '@/lib/email';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

function requireAuth(session: { isLoggedIn: boolean; userId?: string; role?: string }) {
  return session.isLoggedIn && session.userId;
}

async function getDomainById(id: string) {
  const domain = await prisma.domain.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });
  if (!domain) return null;

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
    transferLock: domain.transferLock,
    healthStatus: domain.healthStatus,
    nameserver1: domain.nameserver1,
    nameserver2: domain.nameserver2,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
    whois: {
      registrantName: domain.registrantName ?? '',
      registrantOrg: domain.registrantOrg,
      registrantEmail: domain.registrantEmail ?? '',
      registrantPhone: domain.registrantPhone,
      registrantAddress: domain.registrantAddress,
      registrantCity: domain.registrantCity,
      registrantState: domain.registrantState,
      registrantCountry: domain.registrantCountry,
      registrantPostalCode: domain.registrantPostalCode,
      privacyEnabled: domain.privacyEnabled,
    },
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const domain = await getDomainById(id);

    if (!domain) {
      return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && domain.userID !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(domain);
  } catch (error) {
    console.error('Domain GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar dominio' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.domain.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
    }

    const isClient = session.role !== 'ADMIN';
    if (isClient && existing.userID !== session.userId) {
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
      whois: whoisInput,
      nameserver1: nameserver1Input,
      nameserver2: nameserver2Input,
    } = body;

    const data: Record<string, unknown> = {};

    if (!isClient) {
      if (userID?.trim()) {
        const user = await prisma.user.findUnique({
          where: { id: userID },
        });
        if (!user) {
          return NextResponse.json(
            { error: 'Cliente no encontrado' },
            { status: 404 }
          );
        }
        data.userID = userID;
      }

      if (registrarName?.trim()) {
        data.registrarName = registrarName.trim();
      }

      if (fqdn?.trim()) {
        data.fqdn = fqdn.trim().toLowerCase();
      }

      if (salePrice !== undefined) {
        const salePriceNum = parseFloat(salePrice);
        if (isNaN(salePriceNum) || salePriceNum < 0) {
          return NextResponse.json(
            { error: 'El precio debe ser un número válido' },
            { status: 400 }
          );
        }
        data.salePrice = salePriceNum;
      }

      if (currency?.trim()) data.currency = currency.trim();
      if (renewalDate) {
        const renewal = new Date(renewalDate);
        data.renewalDate = renewal;
        data.nextBillingDate = renewal;
      }

      if (paymentStatus && ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(paymentStatus)) {
        data.paymentStatus = paymentStatus;
      }
    }

    if (transferLock !== undefined) data.transferLock = transferLock !== false;

    if (nameserver1Input !== undefined) {
      data.nameserver1 = typeof nameserver1Input === 'string' && nameserver1Input.trim() ? nameserver1Input.trim() : null;
    }
    if (nameserver2Input !== undefined) {
      data.nameserver2 = typeof nameserver2Input === 'string' && nameserver2Input.trim() ? nameserver2Input.trim() : null;
    }

    if (whoisInput && typeof whoisInput === 'object') {
      const {
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
      } = whoisInput;

      data.registrantName = String(registrantName ?? '').trim() || null;
      data.registrantOrg = registrantOrg?.trim() || null;
      data.registrantEmail = String(registrantEmail ?? '').trim() || null;
      data.registrantPhone = registrantPhone?.trim() || null;
      data.registrantAddress = registrantAddress?.trim() || null;
      data.registrantCity = registrantCity?.trim() || null;
      data.registrantState = registrantState?.trim() || null;
      data.registrantCountry = registrantCountry?.trim() || null;
      data.registrantPostalCode = registrantPostalCode?.trim() || null;
      data.privacyEnabled = Boolean(privacyEnabled);
    }

    const hasChanges = Object.keys(data).length > 0 && (() => {
      for (const key of Object.keys(data)) {
        const oldVal = (existing as Record<string, unknown>)[key];
        let newVal = data[key];
        if (key === 'salePrice') {
          if (Number(existing.salePrice) !== Number(newVal)) return true;
          continue;
        }
        if (key === 'renewalDate' || key === 'nextBillingDate') {
          const oldDate = oldVal instanceof Date ? oldVal.toISOString().slice(0, 10) : String(oldVal ?? '').slice(0, 10);
          const newDate = newVal instanceof Date ? newVal.toISOString().slice(0, 10) : String(newVal ?? '').slice(0, 10);
          if (oldDate !== newDate) return true;
          continue;
        }
        const oldStr = oldVal == null ? '' : String(oldVal);
        const newStr = newVal == null ? '' : String(newVal);
        if (oldStr !== newStr) return true;
      }
      return false;
    })();

    await prisma.domain.update({
      where: { id },
      data,
    });

    if (hasChanges) {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', status: 'ENABLED' },
        select: { email: true, fullName: true },
      });
      const user = await prisma.user.findUnique({
        where: { id: existing.userID },
        select: { fullName: true, email: true },
      });
      const changeSource = isClient
        ? 'El cliente ha realizado cambios en el dominio'
        : 'El dominio precisa de cambios';
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Cambios en dominio</title></head>
<body style="margin:0;padding:0;font-family:sans-serif;background:#f4f4f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a2e;">Dominio con cambios pendientes</h2>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4a4a68;">
            ${changeSource} <strong>${existing.fqdn}</strong>.
          </p>
          <p style="margin:0 0 8px;font-size:14px;color:#6c757d;">
            Cliente: ${user?.fullName ?? '—'} (${user?.email ?? '—'})
          </p>
          <p style="margin:0;font-size:14px;color:#6c757d;">
            Por favor, revisa los cambios realizados en el panel de administración.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `[Acción requerida] ${existing.fqdn} - Dominio con cambios`,
          html,
        });
      }
    }

    const updated = await getDomainById(id);
    return NextResponse.json(updated!);
  } catch (error) {
    console.error('Domain PUT error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar dominio' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const domain = await prisma.domain.findUnique({ where: { id } });

    if (!domain) {
      return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
    }

    await prisma.domain.delete({ where: { id } });

    return NextResponse.json({ message: 'Dominio eliminado correctamente' });
  } catch (error) {
    console.error('Domain DELETE error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar dominio' },
      { status: 500 }
    );
  }
}
