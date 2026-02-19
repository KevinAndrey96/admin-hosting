import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { whmListAccounts } from '@/lib/whm-client';

/**
 * Debug endpoint to verify WHM listaccts response.
 * GET /api/hosting/whm-status - returns raw WHM data (admin only).
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session?.isLoggedIn || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const result = await whmListAccounts();
    return NextResponse.json({
      ok: result.ok,
      error: result.error,
      accounts: result.accounts,
      accountCount: result.accounts ? Object.keys(result.accounts).length : 0,
    });
  } catch (error) {
    console.error('WHM status error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
