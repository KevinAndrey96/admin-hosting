import { NextRequest, NextResponse } from 'next/server';
import { getSettings, setSettings } from '@/lib/settings';
import { getSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const allowedKeys = ['company_name', 'logo_url'];
    const data: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (typeof body[key] === 'string') {
        data[key] = body[key].trim();
      }
    }

    await setSettings(data);
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
