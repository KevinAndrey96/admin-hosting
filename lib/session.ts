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

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'admin_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
};

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
