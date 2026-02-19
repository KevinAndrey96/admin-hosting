/**
 * WHM API client for cPanel account suspend/unsuspend.
 * Uses native https with rejectUnauthorized: false for WHM servers with self-signed certs.
 */

import https from 'https';

const WHM_HOST = process.env.WHM_HOST || 'instanceshape.com';
const WHM_PORT = process.env.WHM_PORT || '2087';
const WHM_USER = process.env.WHM_USER || 'root';
const WHM_TOKEN = process.env.WHM_API_TOKEN;

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const DEFAULT_TIMEOUT_MS = 15_000;

type WhmResult = { ok: boolean; error?: string };

async function whmRequest(
  endpoint: string,
  params: Record<string, string>
): Promise<WhmResult> {
  if (!WHM_TOKEN?.trim()) {
    return { ok: false, error: 'WHM_API_TOKEN no configurado' };
  }

  const search = new URLSearchParams(params).toString();
  const path = `/json-api/${endpoint}${search ? `?${search}` : ''}`;

  return new Promise((resolve) => {
    const opts: https.RequestOptions = {
      hostname: WHM_HOST,
      port: parseInt(WHM_PORT || '2087', 10),
      path,
      method: 'GET',
      agent: httpsAgent,
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        Authorization: `whm ${WHM_USER}:${WHM_TOKEN}`,
      },
    };

    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const ok = res.statusCode === 200;
          if (ok) {
            resolve({ ok: true });
            return;
          }
          const data = JSON.parse(body || '{}');
          const meta = data?.metadata ?? data ?? {};
          const msgs = meta.messages;
          const reason =
            meta.reason ||
            meta.output ||
            (Array.isArray(msgs) ? msgs.filter(Boolean).join('; ') : null) ||
            (typeof data?.output === 'string' ? data.output : null);
          resolve({
            ok: false,
            error: reason?.trim() || `HTTP ${res.statusCode}`,
          });
        } catch {
          resolve(res.statusCode === 200 ? { ok: true } : { ok: false, error: 'Respuesta inválida de WHM' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message || 'Error de conexión con WHM' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout al conectar con WHM' });
    });

    req.end();
  });
}

/**
 * Suspends a cPanel account via WHM API.
 */
export async function whmSuspendAccount(
  username: string,
  reason?: string
): Promise<WhmResult> {
  const params: Record<string, string> = { user: username };
  if (reason?.trim()) params.reason = reason.trim();
  return whmRequest('suspendacct', params);
}

/**
 * Unsuspends a cPanel account via WHM API.
 */
export async function whmUnsuspendAccount(username: string): Promise<WhmResult> {
  return whmRequest('unsuspendacct', { user: username });
}

export type WhmCreateAccountResult =
  | { ok: true; username: string }
  | { ok: false; error: string };

/**
 * Creates a cPanel account in WHM (createacct).
 * username: 1–16 chars, first 8 must be unique, cannot start with number or "test".
 * plan: WHM package/plan name (must exist on server).
 */
export async function whmCreateAccount(params: {
  username: string;
  domain: string;
  password: string;
  plan: string;
  contactemail?: string;
}): Promise<WhmCreateAccountResult> {
  if (!WHM_TOKEN?.trim()) {
    return { ok: false, error: 'WHM_API_TOKEN no configurado' };
  }

  const q: Record<string, string> = {
    username: params.username.trim().toLowerCase().slice(0, 16),
    domain: params.domain.trim().toLowerCase(),
    password: params.password,
    plan: params.plan.trim() || 'default',
  };
  if (params.contactemail?.trim()) {
    q.contactemail = params.contactemail.trim();
  }

  const search = new URLSearchParams(q).toString();
  const path = `/json-api/createacct?${search}`;

  return new Promise((resolve) => {
    const opts: https.RequestOptions = {
      hostname: WHM_HOST,
      port: parseInt(WHM_PORT || '2087', 10),
      path,
      method: 'GET',
      agent: httpsAgent,
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        Authorization: `whm ${WHM_USER}:${WHM_TOKEN}`,
      },
    };

    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const meta = data?.metadata ?? data ?? {};
          const result = meta.result ?? data?.result;
          const reasonRaw = meta.reason ?? meta.output ?? data?.reason;
          let reasonStr =
            typeof reasonRaw === 'string'
              ? reasonRaw
              : Array.isArray(meta.messages)
                ? meta.messages.filter(Boolean).join('; ')
                : typeof data?.output === 'string'
                  ? data.output
                  : '';
          const hasAccountData = data?.data && typeof data.data === 'object';

          // WHM can return result as an array of outcomes (e.g. [{ status: 1, statusmsg: 'Account Creation Ok' }])
          const firstResult = Array.isArray(result) ? result[0] : result;
          const itemStatus = firstResult && typeof firstResult === 'object' ? firstResult.status : firstResult;
          const itemStatusmsg =
            firstResult && typeof firstResult === 'object' && typeof firstResult.statusmsg === 'string'
              ? firstResult.statusmsg
              : '';
          if (itemStatusmsg && !reasonStr) reasonStr = itemStatusmsg;

          const isSuccess =
            res.statusCode === 200 &&
            (result === 1 ||
              result === '1' ||
              result === true ||
              itemStatus === 1 ||
              itemStatus === '1' ||
              (typeof itemStatusmsg === 'string' && /account creation ok/i.test(itemStatusmsg)) ||
              hasAccountData ||
              (typeof reasonStr === 'string' && /account creation ok|creation ok|ok/i.test(reasonStr)));

          if (isSuccess) {
            resolve({ ok: true, username: q.username });
            return;
          }
          resolve({
            ok: false,
            error: (reasonStr?.trim() || `HTTP ${res.statusCode}`) as string,
          });
        } catch (parseErr) {
          console.error('[WHM createacct] parse error:', parseErr);
          console.error('[WHM createacct] raw body (first 500 chars):', (body || '').slice(0, 500));
          resolve({
            ok: false,
            error: res.statusCode === 200 ? 'Respuesta inválida de WHM' : `HTTP ${res.statusCode}`,
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message || 'Error de conexión con WHM' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout al conectar con WHM' });
    });

    req.end();
  });
}

/**
 * Derive a cPanel username from a domain (e.g. ejemplo.com -> ejemplo).
 * Max 16 chars, alphanumeric only; if starts with number, prefix with 'u'.
 */
export function deriveWhmUsernameFromDomain(domain: string): string {
  const base = domain.split('.')[0]?.toLowerCase() || 'site';
  const sanitized = base.replace(/[^a-z0-9]/g, '').slice(0, 16) || 'site';
  return /^\d/.test(sanitized) ? `u${sanitized}`.slice(0, 16) : sanitized;
}

/** domain (lowercase) -> { user, suspended, diskused } */
export type WhmAccountByDomain = Record<string, { user: string; suspended: number; diskused?: string }>;

/**
 * Lists all cPanel accounts from WHM keyed by domain.
 * Returns WHM username for each domain (DB username may differ).
 */
export async function whmListAccounts(): Promise<
  { ok: boolean; accounts?: WhmAccountByDomain; error?: string }
> {
  if (!process.env.WHM_API_TOKEN?.trim()) {
    return { ok: false, error: 'WHM_API_TOKEN no configurado' };
  }

  // No 'want' param - get full response; some WHM versions handle it differently
  const path = '/json-api/listaccts';

  return new Promise((resolve) => {
    const opts: https.RequestOptions = {
      hostname: process.env.WHM_HOST || 'instanceshape.com',
      port: parseInt(process.env.WHM_PORT || '2087', 10),
      path,
      method: 'GET',
      agent: httpsAgent,
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        Authorization: `whm ${process.env.WHM_USER || 'root'}:${process.env.WHM_API_TOKEN}`,
      },
    };

    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          // Support both formats: metadata.result/data.acct (standard) and status/acct (root)
          const result = data?.metadata?.result ?? data?.status;
          let acct = data?.data?.acct ?? data?.acct;
          if (res.statusCode !== 200 || (result !== 1 && result !== '1')) {
            resolve({
              ok: false,
              error: data?.metadata?.reason ?? data?.statusmsg ?? `HTTP ${res.statusCode}`,
            });
            return;
          }
          if (!Array.isArray(acct) && acct && typeof acct === 'object') {
            acct = [acct];
          }
          if (!Array.isArray(acct)) acct = [];
          const accounts: WhmAccountByDomain = {};
          for (const a of acct) {
            const domain = a?.domain;
            const user = a?.user;
            if (domain && typeof domain === 'string' && user && typeof user === 'string') {
              const diskused = a?.diskused;
              accounts[domain.toLowerCase().trim()] = {
                user,
                suspended: a?.suspended === 1 ? 1 : 0,
                diskused: typeof diskused === 'string' ? diskused : undefined,
              };
            }
          }
          resolve({ ok: true, accounts });
        } catch {
          resolve({ ok: false, error: 'Respuesta inválida de WHM' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message || 'Error de conexión con WHM' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout al conectar con WHM' });
    });

    req.end();
  });
}
