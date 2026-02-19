import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        fullName: true,
        email: true,
        phone: true,
        companyName: true,
        role: true,
        address: true,
        city: true,
        stateProvince: true,
        country: true,
        zipCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar el perfil' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullName,
      companyName,
      phone,
      address,
      city,
      stateProvince,
      country,
      zipCode,
    } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        fullName: fullName || undefined,
        companyName: companyName || undefined,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        stateProvince: stateProvince || undefined,
        country: country || undefined,
        zipCode: zipCode || undefined,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el perfil' },
      { status: 500 }
    );
  }
}
