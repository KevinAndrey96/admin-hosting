/**
 * Domain health check - pings a domain and returns HTTP status code.
 * Used by cron health check and domains ping API.
 */

const DEFAULT_TIMEOUT_MS = 5_000;

async function fetchStatus(url: string, timeoutMs: number): Promise<number | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AdminPanel/1.0' },
    });
    clearTimeout(timeout);
    return res.status;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function pingDomain(
  fqdn: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<number | null> {
  const httpsStatus = await fetchStatus(`https://${fqdn}`, timeoutMs);
  if (httpsStatus !== null) return httpsStatus;
  const httpStatus = await fetchStatus(`http://${fqdn}`, timeoutMs);
  return httpStatus;
}
