/**
 * Get domain expiration date from public WHOIS (raw TCP port 43).
 * No external dependencies - uses Node's net module.
 */

import { createConnection } from 'net';

/** WHOIS servers by TLD (fallback: whois.iana.org for referral) */
const TLD_WHOIS: Record<string, string> = {
  com: 'whois.verisign-grs.com',
  net: 'whois.verisign-grs.com',
  org: 'whois.pir.org',
  co: 'whois.nic.co',
  'com.co': 'whois.nic.co',
  info: 'whois.afilias.info',
  biz: 'whois.biz',
};

const EXPIRY_PATTERNS = [
  /Expir(y|ation)\s*(Date|Time)\s*:\s*(.+)/i,
  /Registry\s+Expir(y|ation)\s*(Date|Time)\s*:\s*(.+)/i,
  /paid-till\s*:\s*(.+)/i,
  /expires\s*:\s*(.+)/i,
  /Expir\s*:\s*(.+)/i,
];

function getWhoisHost(fqdn: string): string {
  const d = fqdn.toLowerCase().trim();
  if (d.endsWith('.com.co')) return TLD_WHOIS['com.co'] ?? 'whois.iana.org';
  const tld = d.split('.').pop() ?? '';
  return TLD_WHOIS[tld] ?? 'whois.iana.org';
}

function parseExpirationFromRaw(raw: string): Date | null {
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    for (const re of EXPIRY_PATTERNS) {
      const m = line.match(re);
      if (m) {
        const dateStr = (m[3] ?? m[1] ?? m[0]).toString().trim();
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
  }
  return null;
}

function whoisQuery(host: string, domain: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = createConnection(43, host, () => {
      socket.write(domain + '\r\n');
    });

    let data = '';
    socket.setEncoding('utf8');
    socket.on('data', (chunk) => { data += chunk; });
    socket.on('end', () => { resolve(data); });
    socket.on('error', reject);

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('WHOIS timeout'));
    }, timeoutMs);
    socket.on('close', () => clearTimeout(timer));
  });
}

/**
 * Get domain expiration date from WHOIS.
 * Returns null if lookup fails or expiration cannot be parsed.
 */
export async function getDomainExpirationFromWhois(fqdn: string): Promise<Date | null> {
  const domain = fqdn.toLowerCase().trim();
  if (!domain || domain.length < 4) return null;

  try {
    const host = getWhoisHost(domain);
    const raw = await whoisQuery(host, domain, 8000);
    return parseExpirationFromRaw(raw);
  } catch {
    return null;
  }
}
