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
  const userAsClient = await prisma.user.findFirst({
    where: { id },
    include: {
      clientProfile: {
        include: { _count: { select: { domains: true, hosting: true } } },
      },
    },
  });
  if (userAsClient) {
    return {
      id: userAsClient.clientProfile?.id ?? userAsClient.id,
      userID: userAsClient.id,
      fullName: userAsClient.fullName,
      email: userAsClient.email,
      phone: userAsClient.phone,
      status: userAsClient.status,
      domainsCount: userAsClient.clientProfile?._count?.domains ?? 0,
      hostingCount: userAsClient.clientProfile?._count?.hosting ?? 0,
      createdAt: userAsClient.createdAt,
      updatedAt: userAsClient.updatedAt,
    };
  }
  const profile = await prisma.clientProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, status: true } },
      _count: { select: { domains: true, hosting: true } },
    },
  });
  if (profile) {
    return {
      id: profile.id,
      userID: profile.userID,
      fullName: profile.user.fullName,
      email: profile.user.email,
      phone: profile.user.phone,
      status: profile.user.status,
      domainsCount: profile._count.domains,
      hostingCount: profile._count.hosting,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
  return null;
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
    const body = await request.json();
    const { fullName, email, phone, password, status } = body;

    let userId: string;
    let clientProfileId: string | null = null;
    let userRole: string = 'CLIENT';

    const user = await prisma.user.findFirst({
      where: { id },
      include: { clientProfile: true },
    });
    if (user) {
      userId = user.id;
      userRole = user.role;
      clientProfileId = user.clientProfile?.id ?? null;
    } else {
      const profile = await prisma.clientProfile.findUnique({
        where: { id },
        include: { user: true },
      });
      if (!profile) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }
      userId = profile.userID;
      userRole = profile.user.role;
      clientProfileId = profile.id;
    }

    const normalizedEmail = email?.trim()?.toLowerCase();
    if (normalizedEmail) {
      const existing = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: userId },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe otro usuario con ese correo electrónico' },
          { status: 409 }
        );
      }
    }

    const data: { fullName?: string; email?: string; phone?: string | null; status?: 'ENABLED' | 'DISABLED'; password?: string } = {
      ...(fullName?.trim() && { fullName: fullName.trim() }),
      ...(normalizedEmail && { email: normalizedEmail }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(status && ['ENABLED', 'DISABLED'].includes(status) && { status: status as 'ENABLED' | 'DISABLED' }),
    };

    if (password?.trim() && password.length >= 8) {
      data.password = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    }

    await prisma.user.update({
      where: { id: userId },
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
