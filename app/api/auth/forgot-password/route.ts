import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { getSettings } from '@/lib/settings';
import { buildPasswordResetEmail } from '@/lib/email-templates';
import crypto from 'crypto';

const TOKEN_EXPIRY_HOURS = 1;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'El correo electrónico es requerido' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Formato de correo inválido' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to avoid email enumeration
    const successResponse = {
      message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña.',
    };

    if (!user || user.status !== 'ENABLED') {
      return NextResponse.json(successResponse);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    await prisma.passwordResetToken.create({
      data: {
        userID: user.id,
        token,
        expiresAt,
      },
    });

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const origin = request.nextUrl.origin;
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    // APP_URL: in production, set in .env. On localhost without APP_URL, origin is used.
    const appUrl = process.env.APP_URL || `${origin}${basePath}`;
    const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${token}`;

    if (isLocalhost && !process.env.APP_URL && process.env.NODE_ENV === 'development') {
      console.log('[ForgotPassword] Localhost detectado. El enlace apunta a:', resetUrl);
    }

    const settings = await getSettings();
    const companyName = settings.company_name || 'Admin';
    const logoPath = settings.logo_url || '/assets/static/images/logo.svg';
    const base = appUrl.replace(/\/$/, '');
    const logoUrl = logoPath.startsWith('http')
      ? logoPath
      : `${base}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;

    const html = buildPasswordResetEmail({
      recipientName: user.fullName,
      resetUrl,
      companyName,
      logoUrl,
    });

    await sendEmail({
      to: user.email,
      subject: 'Restablecer contraseña',
      html,
    });

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
