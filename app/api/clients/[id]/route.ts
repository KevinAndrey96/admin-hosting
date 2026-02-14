import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const SALT_ROUNDS = 10;

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  if (!session.isLoggedIn || session.role !== 'ADMIN') {
    return false;
  }
  return true;
}

async function getClientById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { domains: true, hosting: true } },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    userID: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    companyName: user.companyName,
    address: user.address,
    zipCode: user.zipCode,
    status: user.status,
    domainsCount: user._count.domains,
    hostingCount: user._count.hosting,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function GET(
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
    const client = await getClientById(id);

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Client GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar cliente' },
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

    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { fullName, email, phone, companyName, address, zipCode, password, status } = body;

    const normalizedEmail = email?.trim()?.toLowerCase();
    if (normalizedEmail) {
      const existing = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe otro usuario con ese correo electrónico' },
          { status: 409 }
        );
      }
    }

    const data: { fullName?: string; email?: string; phone?: string | null; companyName?: string | null; address?: string | null; zipCode?: string | null; status?: 'ENABLED' | 'DISABLED'; password?: string } = {
      ...(fullName?.trim() && { fullName: fullName.trim() }),
      ...(normalizedEmail && { email: normalizedEmail }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(companyName !== undefined && { companyName: companyName?.trim() || null }),
      ...(address !== undefined && { address: address?.trim() || null }),
      ...(zipCode !== undefined && { zipCode: zipCode?.trim() || null }),
      ...(status && ['ENABLED', 'DISABLED'].includes(status) && { status: status as 'ENABLED' | 'DISABLED' }),
    };

    if (password?.trim() && password.length >= 8) {
      data.password = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    }

    await prisma.user.update({
      where: { id },
      data,
    });

    const updated = await getClientById(id);
    return NextResponse.json(updated!);
  } catch (error) {
    console.error('Client PUT error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
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
    const client = await getClientById(id);

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    if (client.userID === session.userId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: client.userID },
    });

    return NextResponse.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Client DELETE error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}
