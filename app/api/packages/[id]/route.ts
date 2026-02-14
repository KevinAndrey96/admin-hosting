import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

function parseLimit(v: unknown): number | null {
  if (v === 'unlimited' || v === '' || v == null) return null;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return isNaN(n) ? null : n;
}

function toPackageResponse(p: Record<string, unknown> & { id: string; name: string; salePrice: unknown; currency: string; diskSpaceQuotaMb: number | null; bandwidthLimitMb: number | null; maxEmailAccounts: number | null; maxParkedDomains: number | null; maxAddonDomains: number | null; includedDomains: number; createdAt: Date; updatedAt: Date }) {
  return {
    id: p.id,
    name: p.name,
    colorHex: (p.colorHex as string | null | undefined) ?? null,
    salePrice: Number(p.salePrice),
    currency: p.currency,
    diskSpaceQuotaMb: p.diskSpaceQuotaMb,
    bandwidthLimitMb: p.bandwidthLimitMb,
    maxEmailAccounts: p.maxEmailAccounts,
    maxParkedDomains: p.maxParkedDomains,
    maxAddonDomains: p.maxAddonDomains,
    includedDomains: p.includedDomains,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    hostingCount: (p as { _count?: { hosting: number } })._count?.hosting ?? 0,
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
    const pkg = await prisma.hostingPackage.findUnique({
      where: { id },
      include: { _count: { select: { hosting: true } } },
    });

    if (!pkg) {
      return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 });
    }

    return NextResponse.json(toPackageResponse(pkg));
  } catch (error) {
    console.error('Package GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar paquete' },
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
    const existing = await prisma.hostingPackage.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      colorHex: colorHexInput,
      salePrice,
      currency,
      diskSpaceQuotaMb,
      bandwidthLimitMb,
      maxEmailAccounts,
      maxParkedDomains,
      maxAddonDomains,
      includedDomains,
    } = body;

    const nameNorm = name?.trim();
    if (!nameNorm) {
      return NextResponse.json(
        { error: 'El nombre del paquete es requerido' },
        { status: 400 }
      );
    }

    const salePriceNum = parseFloat(salePrice);
    if (isNaN(salePriceNum) || salePriceNum < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido' },
        { status: 400 }
      );
    }

    const includedNum = parseInt(String(includedDomains ?? 1), 10);
    if (isNaN(includedNum) || includedNum < 0) {
      return NextResponse.json(
        { error: 'Dominios incluidos debe ser un número válido' },
        { status: 400 }
      );
    }

    const duplicate = await prisma.hostingPackage.findFirst({
      where: { name: nameNorm, id: { not: id } },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: 'Ya existe otro paquete con ese nombre' },
        { status: 409 }
      );
    }

    const colorHex = colorHexInput?.trim();
    const colorHexVal = colorHex && /^#[0-9A-Fa-f]{6}$/.test(colorHex) ? colorHex : null;
    const pkg = await prisma.hostingPackage.update({
      where: { id },
      data: {
        name: nameNorm,
        ...(colorHexInput !== undefined && { colorHex: colorHexVal }),
        salePrice: salePriceNum,
        currency: currency?.trim() || 'COP',
        diskSpaceQuotaMb: parseLimit(diskSpaceQuotaMb),
        bandwidthLimitMb: parseLimit(bandwidthLimitMb),
        maxEmailAccounts: parseLimit(maxEmailAccounts),
        maxParkedDomains: parseLimit(maxParkedDomains),
        maxAddonDomains: parseLimit(maxAddonDomains),
        includedDomains: includedNum,
      },
      include: { _count: { select: { hosting: true } } },
    });

    return NextResponse.json(toPackageResponse(pkg));
  } catch (error) {
    console.error('Package PUT error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar paquete' },
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
    const pkg = await prisma.hostingPackage.findUnique({
      where: { id },
      include: { _count: { select: { hosting: true } } },
    });

    if (!pkg) {
      return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 });
    }

    if (((pkg as { _count?: { hosting: number } })._count?.hosting ?? 0) > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar: hay hostings usando este paquete' },
        { status: 400 }
      );
    }

    await prisma.hostingPackage.delete({ where: { id } });

    return NextResponse.json({ message: 'Paquete eliminado correctamente' });
  } catch (error) {
    console.error('Package DELETE error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar paquete' },
      { status: 500 }
    );
  }
}
