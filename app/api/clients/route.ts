import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Cambiar2026!';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  if (!session.isLoggedIn || session.role !== 'ADMIN') {
    return false;
  }
  return true;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        clientProfile: {
          include: {
            _count: { select: { domains: true, hosting: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const list = users.map((u) => ({
      id: u.clientProfile?.id ?? u.id,
      userID: u.id,
      role: u.role,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      status: u.status,
      domainsCount: u.clientProfile?._count?.domains ?? 0,
      hostingCount: u.clientProfile?._count?.hosting ?? 0,
      createdAt: u.createdAt,
    }));

    return NextResponse.json(list);
  } catch (error) {
    console.error('Clients GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar clientes' },
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
    const { fullName, email, phone, status, password } = body;

    if (!fullName?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'El correo electrónico es requerido' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Formato de correo inválido' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese correo' },
        { status: 409 }
      );
    }

    const pwd = password?.trim() || DEFAULT_PASSWORD;
    if (pwd.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(pwd, SALT_ROUNDS);

    const userStatus = status && ['ENABLED', 'DISABLED'].includes(status) ? status : 'ENABLED';

    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        password: hashedPassword,
        role: 'CLIENT',
        status: userStatus,
      },
    });

    const clientProfile = await prisma.clientProfile.create({
      data: { userID: user.id },
    });

    return NextResponse.json(
      {
        id: clientProfile.id,
        userID: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        message: 'Cliente creado. Puede usar "¿Olvidaste tu contraseña?" para definir su contraseña.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Clients POST error:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
