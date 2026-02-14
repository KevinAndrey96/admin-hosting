import { getIronSession, SessionOptions } from 'iron-session';

export type UserRole = 'ADMIN' | 'CLIENT';

export interface SessionData {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isLoggedIn: boolean;
}

const defaultSession: SessionData = {
  userId: '',
  email: '',
  fullName: '',
  role: 'CLIENT',
  isLoggedIn: false,
};

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'admin_session',
  cookieOptions: {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 7, // 7 days (default for reading existing sessions)
  },
};

/** Login options: with remember = 30-day cookie; without = session (cleared on browser close) */
export function getSessionOptionsForLogin(remember: boolean): SessionOptions {
  return {
    ...sessionOptions,
    cookieOptions: {
      ...baseCookieOptions,
      maxAge: remember ? 60 * 60 * 24 * 30 : undefined, // 30 days or session
    },
  };
}

export async function getSessionForLogin(
  cookieStore: Awaited<ReturnType<typeof import('next/headers').cookies>>,
  remember: boolean
) {
  return getIronSession<SessionData>(cookieStore, getSessionOptionsForLogin(remember));
}

export async function getSession(cookieStore: ReturnType<typeof import('next/headers').cookies>) {
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    session.userId = defaultSession.userId;
    session.email = defaultSession.email;
    session.fullName = defaultSession.fullName;
    session.role = defaultSession.role;
    session.isLoggedIn = defaultSession.isLoggedIn;
  }
  if (!session.role) {
    session.role = defaultSession.role;
  }

  return session;
}
