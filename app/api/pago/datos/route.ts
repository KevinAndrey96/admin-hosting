import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

function requireAuth(session: { isLoggedIn: boolean; userId?: string }) {
  return session.isLoggedIn && session.userId;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!requireAuth(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const packageId = searchParams.get('packageId');
    const hostingId = searchParams.get('hostingId');
    const domainId = searchParams.get('domainId');
    const dominio = searchParams.get('dominio')?.trim().toLowerCase();

    if (!tipo) {
      return NextResponse.json({ error: 'Falta el parámetro tipo' }, { status: 400 });
    }

    if (tipo === 'renovar-hosting' && hostingId) {
      const hosting = await prisma.hostingService.findFirst({
        where: {
          id: hostingId,
          ...(session.role !== 'ADMIN' ? { userID: session.userId } : {}),
        },
        include: { hostingPackage: { select: { name: true, salePrice: true, currency: true } } },
      });
      if (!hosting) {
        return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
      }
      return NextResponse.json({
        itemLabel: hosting.hostingPackage.name,
        salePrice: Number(hosting.hostingPackage.salePrice),
        currency: hosting.hostingPackage.currency,
      });
    }

    if (tipo.includes('hosting') && packageId) {
      const pkg = await prisma.hostingPackage.findUnique({
        where: { id: packageId },
        select: { id: true, name: true, salePrice: true, currency: true },
      });
      if (!pkg) {
        return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 });
      }
      return NextResponse.json({
        itemLabel: pkg.name,
        salePrice: Number(pkg.salePrice),
        currency: pkg.currency,
      });
    }

    if (tipo.includes('dominio') && domainId) {
      const domain = await prisma.domain.findFirst({
        where: {
          id: domainId,
          ...(session.role !== 'ADMIN' ? { userID: session.userId } : {}),
        },
        select: { fqdn: true, salePrice: true, currency: true },
      });
      if (!domain) {
        return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
      }
      return NextResponse.json({
        itemLabel: domain.fqdn,
        salePrice: Number(domain.salePrice),
        currency: domain.currency,
      });
    }

    if (tipo === 'contratar-dominio' && dominio) {
      const apiKey = process.env.SPACESHIP_API_KEY;
      const apiSecret = process.env.SPACESHIP_API_SECRET;
      if (!apiKey || !apiSecret) {
        return NextResponse.json({ error: 'Servicio no configurado' }, { status: 503 });
      }
      const res = await fetch(`https://spaceship.dev/api/v1/domains/${encodeURIComponent(dominio)}/available`, {
        method: 'GET',
        headers: { 'X-Api-Key': apiKey, 'X-Api-Secret': apiSecret },
      });
      const data = await res.json().catch(() => ({}));
      const priceObj = data.premiumPricing?.[0] ?? data.pricing?.[0];
      const price = priceObj?.price ?? data.price;
      return NextResponse.json({
        itemLabel: dominio,
        salePrice: typeof price === 'number' ? price : parseFloat(String(price || 0)) || 0,
        currency: priceObj?.currency ?? data.currency ?? 'USD',
      });
    }

    return NextResponse.json({ error: 'Parámetros insuficientes' }, { status: 400 });
  } catch (error) {
    console.error('Pago datos error:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}
