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
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowedKeys = [
      'company_name',
      'logo_url',
      'primary_color',
      'secondary_color',
      'whatsapp_number',
      'daviplata_number',
      'nequi_number',
      'breb_key',
      'bancolombia_account',
      'mercadopago_payment_link',
      'renewal_reminder_enabled',
      'domain_reactivation_penalty',
      'domain_com_price',
      'domain_net_price',
      'domain_com_co_price',
      'domain_co_price',
    ];
    const hexColorKeys = ['primary_color', 'secondary_color'];
    const data: Record<string, string> = {};
    for (const key of allowedKeys) {
      const raw = body[key];
      if (raw === undefined || raw === null) continue;
      const value = String(raw).trim();
      if (hexColorKeys.includes(key)) {
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) data[key] = value;
      } else if (key === 'renewal_reminder_enabled') {
        data[key] = value === 'true' || value === '1' ? 'true' : 'false';
      } else {
        data[key] = value;
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
