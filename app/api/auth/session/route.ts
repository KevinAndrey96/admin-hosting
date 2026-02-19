import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.isLoggedIn) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
        role: session.role,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    if (!process.env.SESSION_SECRET) {
      console.error('SESSION_SECRET is not set - session cannot be decrypted');
    }
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
