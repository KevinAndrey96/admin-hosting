import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { unsealData } from 'iron-session';

const COOKIE_NAME = 'admin_session';

interface SessionData {
  userId?: string;
  email?: string;
  fullName?: string;
  role?: string;
  isLoggedIn?: boolean;
}

const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/pago',
  '/soporte',
  '/clients',
  '/domains',
  '/hosting',
  '/packages',
  '/settings',
  '/email',
  '/compose',
  '/calendar',
  '/charts',
  '/tables',
  '/maps',
  '/chat',
  '/ui',
  '/forms',
  '/blank',
  '/error-404',
  '/error-500',
];

const ADMIN_ONLY_PATHS = ['/settings', '/clients'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/admin';
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    const signinUrl = new URL(`${basePath}/signin`, request.url);
    return NextResponse.redirect(signinUrl);
  }

  try {
    const seal = request.cookies.get(COOKIE_NAME)?.value;
    if (!seal) {
      const signinUrl = new URL(`${basePath}/signin`, request.url);
      signinUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(signinUrl);
    }

    const session = await unsealData<SessionData>(seal, {
      password: secret,
      ttl: 60 * 60 * 24 * 30, // 30 days - matches remember-me; session cookies use ttl=0 when sealing
    });

    if (!session?.isLoggedIn) {
      const signinUrl = new URL(`${basePath}/signin`, request.url);
      signinUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(signinUrl);
    }

    if (isAdminOnlyPath(pathname) && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`${basePath}/dashboard`, request.url));
    }
  } catch {
    const signinUrl = new URL(`${basePath}/signin`, request.url);
    signinUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
