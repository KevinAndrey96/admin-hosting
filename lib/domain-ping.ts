/**
 * Domain health check - pings a domain and returns HTTP status code.
 * Uses native https/http with rejectUnauthorized: false for cPanel/shared hosting
 * where SSL verification often fails (self-signed certs, etc).
 */

import https from 'https';
import http from 'http';

const DEFAULT_TIMEOUT_MS = 15_000;
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function pingUrl(url: string, timeoutMs: number): Promise<number | null> {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;
    const opts: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: '/',
      method: 'GET',
      family: 4,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AdminPanel/1.0)',
        Host: parsed.hostname,
      },
      ...(isHttps && { agent: httpsAgent }),
    };
    const req = lib.request(opts, (res) => {
      res.resume();
      resolve(res.statusCode ?? null);
    });
    req.on('error', () => resolve(null));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

export async function pingDomain(
  fqdn: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<number | null> {
  const httpsStatus = await pingUrl(`https://${fqdn}`, timeoutMs);
  if (httpsStatus !== null) return httpsStatus;
  return pingUrl(`http://${fqdn}`, timeoutMs);
}
