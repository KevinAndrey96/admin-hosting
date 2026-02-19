import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

function requireAdmin(session: { isLoggedIn: boolean; role?: string }) {
  return session.isLoggedIn && session.role === 'ADMIN';
}

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

// Converts "unlimited", "", null, undefined → null; number → number
function parseLimit(v: unknown): number | null {
  if (v === 'unlimited' || v === '' || v == null) return null;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return isNaN(n) ? null : n;
}

function toPackageResponse(p: Record<string, unknown> & { id: string; name: string; salePrice: unknown; currency: string; diskSpaceQuotaMb: number | null; bandwidthLimitMb: number | null; maxEmailAccounts: number | null; maxParkedDomains: number | null; maxAddonDomains: number | null; includedDomains: number; createdAt: Date }) {
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
    hostingCount: (p as { _count?: { hosting: number } })._count?.hosting ?? 0,
  };
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const packages = await prisma.hostingPackage.findMany({
      include: { _count: { select: { hosting: true } } },
      orderBy: { salePrice: 'asc' },
    });

    return NextResponse.json(packages.map(toPackageResponse));
  } catch (error) {
    console.error('Packages GET error:', error);
    return NextResponse.json(
      { error: 'Error al cargar paquetes' },
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
      name,
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

    const existing = await prisma.hostingPackage.findFirst({
      where: { name: nameNorm },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un paquete con ese nombre' },
        { status: 409 }
      );
    }

    const colorHex = body.colorHex?.trim();
    const colorHexVal = colorHex && /^#[0-9A-Fa-f]{6}$/.test(colorHex) ? colorHex : null;
    const pkg = await prisma.hostingPackage.create({
      data: {
        name: nameNorm,
        ...(colorHexVal != null && { colorHex: colorHexVal }),
        salePrice: salePriceNum,
        currency: currency?.trim() || 'COP',
        diskSpaceQuotaMb: parseLimit(diskSpaceQuotaMb),
        bandwidthLimitMb: parseLimit(bandwidthLimitMb),
        maxEmailAccounts: parseLimit(maxEmailAccounts),
        maxParkedDomains: parseLimit(maxParkedDomains),
        maxAddonDomains: parseLimit(maxAddonDomains),
        includedDomains: includedNum,
      },
    });

    return NextResponse.json(
      { ...toPackageResponse(pkg), message: 'Paquete creado correctamente.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Packages POST error:', error);
    return NextResponse.json(
      { error: 'Error al crear paquete' },
      { status: 500 }
    );
  }
}
