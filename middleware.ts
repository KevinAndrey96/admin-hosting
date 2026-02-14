import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = [
  '/dashboard',
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

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
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
