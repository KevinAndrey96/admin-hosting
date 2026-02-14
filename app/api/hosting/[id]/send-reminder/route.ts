import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/settings';
import { sendEmail } from '@/lib/email';
import {
  getDaysUntilExpiration,
  buildHostingReminderEmail,
} from '@/lib/renewal-reminder-email';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

export async function POST(
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
    const hosting = await prisma.hostingService.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        hostingPackage: { select: { name: true } },
      },
    });

    if (!hosting) {
      return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
    }

    if (hosting.paymentStatus === 'CANCELLED') {
      return NextResponse.json(
        { error: 'No se puede enviar recordatorio a un hosting cancelado' },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const companyName = settings.company_name || 'Admin';
    const logoUrl = settings.logo_url || '';
    const logoFullUrl = logoUrl?.startsWith('http')
      ? logoUrl
      : logoUrl
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://instanceshape.com'}${logoUrl}`
        : '';
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const appUrl = (
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://instanceshape.com'
    ).replace(/\/$/, '');

    const expDate = new Date(hosting.nextBillingDate);
    const daysLeft = getDaysUntilExpiration(expDate);

    const { subject, html } = buildHostingReminderEmail({
      companyName,
      logoFullUrl,
      clientName: hosting.user.fullName,
      packageName: hosting.hostingPackage.name,
      username: hosting.username,
      expDate,
      daysLeft,
      type: 'manual',
      appUrl,
      basePath,
      reactivationPenalty: settings.domain_reactivation_penalty,
    });

    await sendEmail({
      to: hosting.user.email,
      subject,
      html,
    });

    return NextResponse.json({
      message: `Recordatorio enviado a ${hosting.user.email}`,
      daysLeft,
    });
  } catch (error) {
    console.error('Hosting send-reminder error:', error);
    return NextResponse.json(
      { error: 'Error al enviar el recordatorio' },
      { status: 500 }
    );
  }
}
