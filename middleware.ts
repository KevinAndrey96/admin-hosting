import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/clients',
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

  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const sessionUrl = new URL(`${basePath}/api/auth/session`, request.url);
    const sessionRes = await fetch(sessionUrl.toString(), {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (sessionRes.status === 401) {
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(signinUrl);
    }

    if (sessionRes.ok) {
      const data = await sessionRes.json();
      const role = data?.user?.role;
      if (isAdminOnlyPath(pathname) && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  } catch {
    const signinUrl = new URL('/signin', request.url);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
