/**
 * WHM & cPanel API Client with High-Performance In-Memory TTL Caching.
 * 
 * Target Server: 46.224.80.244:2087 (WHM) / 46.224.80.244:2083 (cPanel UAPI)
 * Authentication:
 * - WHM Port 2087: `Authorization: whm ${WHM_USER}:${WHM_TOKEN}`
 * - cPanel Port 2083: `Authorization: cpanel ${WHM_USER}:${WHM_TOKEN}`
 * 
 * Performance & Caching Architecture:
 * - Real-time accounts list (`whmListAccounts`) cached with 60-second TTL.
 * - Real-time email list (`whmListEmailAccounts`) cached per-account with 60-second TTL.
 * - Automatic cache invalidation upon any mutating operation (account creation,
 *   package resizing, suspension, email creation, quota edit, password change, deletion).
 */

import https from 'https';

const WHM_HOST = process.env.WHM_HOST || '127.0.0.1';
const WHM_PORT = process.env.WHM_PORT || '2087';
const CPANEL_PORT = process.env.CPANEL_PORT || '2083';
const WHM_USER = process.env.WHM_USER || 'shape';
const WHM_TOKEN = process.env.WHM_API_TOKEN;

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const DEFAULT_TIMEOUT_MS = 12_000;

type WhmResult = { ok: boolean; error?: string };

// -----------------------------------------------------------------------------
// In-Memory TTL Caching Layer
// -----------------------------------------------------------------------------

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const ACCOUNTS_CACHE_TTL_MS = 60_000; // 60 seconds
const EMAILS_CACHE_TTL_MS = 60_000;   // 60 seconds

let cachedAccounts: CacheEntry<WhmAccountByDomain> | null = null;
const cachedEmails = new Map<string, CacheEntry<EmailAccountInfo[]>>();

/** Invalidate cached WHM accounts map */
export function invalidateWhmAccountsCache(): void {
  cachedAccounts = null;
}

/** Invalidate cached email list for a specific cPanel user, or all */
export function invalidateWhmEmailCache(cpanelUser?: string): void {
  if (cpanelUser) {
    cachedEmails.delete(cpanelUser.toLowerCase().trim());
  } else {
    cachedEmails.clear();
  }
}

// -----------------------------------------------------------------------------
// Core Request Dispatchers
// -----------------------------------------------------------------------------

async function whmRequest(
  endpoint: string,
  params: Record<string, string>
): Promise<WhmResult> {
  if (!WHM_TOKEN?.trim()) {
    return { ok: false, error: 'WHM_API_TOKEN no configurado' };
  }

  const search = new URLSearchParams({ 'api.version': '1', ...params }).toString();
  const path = `/json-api/${endpoint}?${search}`;

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
  invalidateWhmAccountsCache();
  return whmRequest('suspendacct', params);
}

/**
 * Unsuspends a cPanel account via WHM API.
 */
export async function whmUnsuspendAccount(username: string): Promise<WhmResult> {
  invalidateWhmAccountsCache();
  return whmRequest('unsuspendacct', { user: username });
}

/**
 * Changes a cPanel account's hosting package in WHM (changepackage).
 * Updates quotas, email limits, bandwidth, and antispam limits automatically in cPanel.
 */
export async function whmChangePackage(
  username: string,
  pkg: string
): Promise<WhmResult> {
  invalidateWhmAccountsCache();
  return whmRequest('changepackage', { user: username, pkg });
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

  invalidateWhmAccountsCache();

  const q: Record<string, string> = {
    username: params.username.trim().toLowerCase().slice(0, 16),
    domain: params.domain.trim().toLowerCase(),
    password: params.password,
    plan: params.plan.trim() || 'default',
  };
  if (params.contactemail?.trim()) {
    q.contactemail = params.contactemail.trim();
  }

  const search = new URLSearchParams({ 'api.version': '1', ...q }).toString();
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
        } catch {
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
 * Supports caching and dual-mode: cPanel UAPI Resellers::list_accounts (port 2083)
 * or WHM listaccts (port 2087).
 */
export async function whmListAccounts(): Promise<
  { ok: boolean; accounts?: WhmAccountByDomain; error?: string }
> {
  const now = Date.now();
  if (cachedAccounts && cachedAccounts.expiresAt > now) {
    return { ok: true, accounts: cachedAccounts.data };
  }

  const token = process.env.WHM_API_TOKEN?.trim() || WHM_TOKEN?.trim();
  if (!token) {
    return { ok: false, error: 'WHM_API_TOKEN no configurado' };
  }

  // 1. Try cPanel UAPI Resellers list_accounts on port 2083 (fastest & native for resellers)
  const tryUapiResellers = async (): Promise<WhmAccountByDomain | null> => {
    return new Promise((resolve) => {
      const opts: https.RequestOptions = {
        hostname: process.env.WHM_HOST || WHM_HOST,
        port: parseInt(CPANEL_PORT, 10),
        path: '/execute/Resellers/list_accounts',
        method: 'GET',
        agent: httpsAgent,
        timeout: 4_000,
        headers: {
          Authorization: `cpanel ${WHM_USER}:${token}`,
        },
      };

      const req = https.request(opts, (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) { resolve(null); return; }
            const parsed = JSON.parse(body || '{}');
            const data = parsed?.data ?? parsed?.result?.data;
            if (Array.isArray(data) && data.length > 0) {
              const accounts: WhmAccountByDomain = {};
              for (const a of data) {
                const dom = a?.domain?.toLowerCase()?.trim();
                const usr = a?.user?.toLowerCase()?.trim();
                if (dom && usr) {
                  accounts[dom] = { user: usr, suspended: 0 };
                }
              }
              resolve(accounts);
              return;
            }
            resolve(null);
          } catch {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.end();
    });
  };

  // 2. Fallback to WHM API 1 listaccts on port 2087
  const tryWhmListAccts = async (): Promise<WhmAccountByDomain | null> => {
    return new Promise((resolve) => {
      const path = '/json-api/listaccts?api.version=1';
      const opts: https.RequestOptions = {
        hostname: process.env.WHM_HOST || WHM_HOST,
        port: parseInt(WHM_PORT, 10),
        path,
        method: 'GET',
        agent: httpsAgent,
        timeout: 6_000,
        headers: {
          Authorization: `whm ${WHM_USER}:${token}`,
        },
      };

      const req = https.request(opts, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            const result = data?.metadata?.result ?? data?.status;
            let acct = data?.data?.acct ?? data?.acct;
            if (res.statusCode !== 200 || (result !== 1 && result !== '1')) {
              resolve(null);
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
            resolve(accounts);
          } catch {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.end();
    });
  };

  const uapiResult = await tryUapiResellers();
  if (uapiResult) {
    cachedAccounts = { data: uapiResult, expiresAt: Date.now() + ACCOUNTS_CACHE_TTL_MS };
    return { ok: true, accounts: uapiResult };
  }

  const whmResult = await tryWhmListAccts();
  if (whmResult) {
    cachedAccounts = { data: whmResult, expiresAt: Date.now() + ACCOUNTS_CACHE_TTL_MS };
    return { ok: true, accounts: whmResult };
  }

  return { ok: false, error: 'No se pudieron consultar las cuentas de cPanel/WHM' };
}

/**
 * Generic cPanel UAPI invoker.
 * First tries cPanel Port 2083 directly (`/execute/${module}/${func}`),
 * and falls back to WHM API 1 (`/json-api/cpanel`).
 */
export async function whmCpanelUapi(
  cpanelUser: string,
  module: string,
  func: string,
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<{ ok: boolean; data?: any; error?: string }> {
  const token = process.env.WHM_API_TOKEN?.trim() || WHM_TOKEN?.trim();
  if (!token) {
    return { ok: false, error: 'WHM_API_TOKEN no configurado' };
  }

  const cleanUser = cpanelUser.trim().toLowerCase();

  // 1. Try native cPanel UAPI directly on port 2083 (ultra-fast)
  const tryDirectUapi = async (): Promise<{ ok: boolean; data?: any; error?: string } | null> => {
    return new Promise((resolve) => {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          searchParams.append(k, String(v));
        }
      }
      const qs = searchParams.toString();
      const path = `/execute/${module}/${func}${qs ? `?${qs}` : ''}`;

      const opts: https.RequestOptions = {
        hostname: process.env.WHM_HOST || WHM_HOST,
        port: parseInt(CPANEL_PORT, 10),
        path,
        method: 'GET',
        agent: httpsAgent,
        timeout: DEFAULT_TIMEOUT_MS,
        headers: {
          Authorization: `cpanel ${WHM_USER}:${token}`,
        },
      };

      const req = https.request(opts, (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          try {
            if (res.statusCode === 403 || res.statusCode === 401) {
              resolve(null);
              return;
            }
            const parsed = JSON.parse(body || '{}');
            const status = parsed?.status;
            const errors = parsed?.errors;
            const messages = parsed?.messages;

            let errorMsg = '';
            if (Array.isArray(errors) && errors.length > 0) {
              errorMsg = errors.filter(Boolean).join('; ');
            } else if (typeof errors === 'string') {
              errorMsg = errors;
            } else if (status !== 1 && status !== '1') {
              errorMsg = Array.isArray(messages) ? messages.filter(Boolean).join('; ') : 'Operación no exitosa';
            }

            if (res.statusCode === 200 && (status === 1 || status === '1')) {
              resolve({ ok: true, data: parsed.data });
            } else {
              resolve({ ok: false, error: errorMsg || `HTTP ${res.statusCode}` });
            }
          } catch {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.end();
    });
  };

  // 2. Fallback to WHM API 1 /json-api/cpanel on port 2087
  const tryWhmProxy = async (): Promise<{ ok: boolean; data?: any; error?: string }> => {
    return new Promise((resolve) => {
      const queryParams: Record<string, string> = {
        'api.version': '1',
        cpanel_jsonapi_user: cleanUser,
        cpanel_jsonapi_apiversion: '3',
        cpanel_jsonapi_module: module,
        cpanel_jsonapi_func: func,
      };

      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null) {
          queryParams[key] = String(val);
        }
      }

      const search = new URLSearchParams(queryParams).toString();
      const path = `/json-api/cpanel?${search}`;

      const opts: https.RequestOptions = {
        hostname: process.env.WHM_HOST || WHM_HOST,
        port: parseInt(WHM_PORT, 10),
        path,
        method: 'GET',
        agent: httpsAgent,
        timeout: DEFAULT_TIMEOUT_MS,
        headers: {
          Authorization: `whm ${WHM_USER}:${token}`,
        },
      };

      const req = https.request(opts, (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const result = parsed?.result || parsed;
            const status = result?.status;
            const errors = result?.errors;
            const messages = result?.messages;

            let errorMsg = '';
            if (Array.isArray(errors) && errors.length > 0) {
              errorMsg = errors.filter(Boolean).join('; ');
            } else if (typeof errors === 'string') {
              errorMsg = errors;
            } else if (status !== 1 && status !== '1') {
              errorMsg = Array.isArray(messages) ? messages.filter(Boolean).join('; ') : 'Operación no exitosa';
            }

            if (res.statusCode === 200 && (status === 1 || status === '1')) {
              resolve({ ok: true, data: result.data });
            } else {
              resolve({ ok: false, error: errorMsg || `HTTP ${res.statusCode}` });
            }
          } catch {
            resolve({ ok: false, error: 'Respuesta inválida del servidor' });
          }
        });
      });
      req.on('error', (err) => resolve({ ok: false, error: err.message || 'Error de conexión con WHM' }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'Timeout al conectar con cPanel UAPI' }); });
      req.end();
    });
  };

  const direct = await tryDirectUapi();
  if (direct && direct.ok) {
    return direct;
  }
  return tryWhmProxy();
}

export type EmailAccountInfo = {
  email: string;
  user: string;
  domain: string;
  diskused: string;
  diskquota: string;
  diskusedpercent: number;
  humandiskused: string;
  humandiskquota: string;
  suspendedLogin: boolean;
  suspendedIncoming: boolean;
};

/**
 * Lists all email accounts for a cPanel user with disk usage and quotas.
 * Cached in-memory with 60s TTL for sub-millisecond tab switching.
 */
export async function whmListEmailAccounts(cpanelUser: string): Promise<{ ok: boolean; accounts?: EmailAccountInfo[]; error?: string }> {
  const userKey = cpanelUser.trim().toLowerCase();
  const cached = cachedEmails.get(userKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return { ok: true, accounts: cached.data };
  }

  const res = await whmCpanelUapi(cpanelUser, 'Email', 'list_pops_with_disk');
  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  const rawList = Array.isArray(res.data) ? res.data : [];
  const accounts: EmailAccountInfo[] = rawList.map((item: any) => ({
    email: item.email || `${item.user}@${item.domain}`,
    user: item.user,
    domain: item.domain,
    diskused: item.diskused || '0',
    diskquota: item.diskquota || 'unlimited',
    diskusedpercent: Number(item.diskusedpercent) || 0,
    humandiskused: item.humandiskused || `${item.diskused || 0} MB`,
    humandiskquota: item.humandiskquota || (item.diskquota === 'unlimited' ? 'Ilimitada' : `${item.diskquota} MB`),
    suspendedLogin: item.suspended_login === 1 || item.suspended_login === '1',
    suspendedIncoming: item.suspended_incoming === 1 || item.suspended_incoming === '1',
  }));

  cachedEmails.set(userKey, { data: accounts, expiresAt: now + EMAILS_CACHE_TTL_MS });

  return { ok: true, accounts };
}

/**
 * Creates a new email account in cPanel.
 */
export async function whmCreateEmailAccount(
  cpanelUser: string,
  params: { email: string; domain: string; password: string; quotaMb?: number }
): Promise<{ ok: boolean; error?: string }> {
  invalidateWhmEmailCache(cpanelUser);
  return whmCpanelUapi(cpanelUser, 'Email', 'add_pop', {
    email: params.email.trim().toLowerCase(),
    domain: params.domain.trim().toLowerCase(),
    password: params.password,
    quota: params.quotaMb !== undefined ? params.quotaMb : 1024,
  });
}

/**
 * Changes password for an existing email account in cPanel.
 */
export async function whmUpdateEmailPassword(
  cpanelUser: string,
  params: { email: string; domain: string; password: string }
): Promise<{ ok: boolean; error?: string }> {
  invalidateWhmEmailCache(cpanelUser);
  return whmCpanelUapi(cpanelUser, 'Email', 'passwd_pop', {
    email: params.email.trim().toLowerCase(),
    domain: params.domain.trim().toLowerCase(),
    password: params.password,
  });
}

/**
 * Updates disk quota for an existing email account in cPanel.
 */
export async function whmUpdateEmailQuota(
  cpanelUser: string,
  params: { email: string; domain: string; quotaMb: number }
): Promise<{ ok: boolean; error?: string }> {
  invalidateWhmEmailCache(cpanelUser);
  return whmCpanelUapi(cpanelUser, 'Email', 'edit_pop_quota', {
    email: params.email.trim().toLowerCase(),
    domain: params.domain.trim().toLowerCase(),
    quota: params.quotaMb,
  });
}

/**
 * Deletes an email account from cPanel.
 */
export async function whmDeleteEmailAccount(
  cpanelUser: string,
  params: { email: string; domain: string }
): Promise<{ ok: boolean; error?: string }> {
  invalidateWhmEmailCache(cpanelUser);
  return whmCpanelUapi(cpanelUser, 'Email', 'delete_pop', {
    email: params.email.trim().toLowerCase(),
    domain: params.domain.trim().toLowerCase(),
  });
}
