/**
 * Spaceship API client for domain operations.
 * Docs: https://docs.spaceship.dev/
 */

const SPACESHIP_BASE = 'https://spaceship.dev/api/v1';

function getAuthHeaders(): Record<string, string> | null {
  const apiKey = process.env.SPACESHIP_API_KEY;
  const apiSecret = process.env.SPACESHIP_API_SECRET;
  if (!apiKey || !apiSecret) return null;
  return {
    'X-Api-Key': apiKey,
    'X-Api-Secret': apiSecret,
    'Content-Type': 'application/json',
  };
}

export type DomainInfo = {
  contacts?: { registrant?: string; admin?: string; tech?: string; billing?: string };
};

export type WhoisContact = {
  registrantName: string;
  registrantOrg?: string | null;
  registrantEmail: string;
  registrantPhone?: string | null;
  registrantAddress?: string | null;
  registrantCity?: string | null;
  registrantState?: string | null;
  registrantCountry?: string | null;
  registrantPostalCode?: string | null;
};

export type UpdateWhoisResult = { ok: true } | { ok: false; error: string };

export type UpdateNameserversResult =
  | { ok: true; provider: 'basic' | 'custom'; hosts?: string[] }
  | { ok: false; error: string };

/**
 * Update domain nameservers via Spaceship API.
 * - provider "custom": requires 2-12 hosts
 * - provider "basic": uses Spaceship default nameservers (omit hosts)
 */
export async function updateDomainNameservers(
  fqdn: string,
  nameservers: string[]
): Promise<UpdateNameserversResult> {
  const headers = getAuthHeaders();
  if (!headers) {
    return { ok: false, error: 'Spaceship API no configurado. Contacta al administrador.' };
  }

  const validHosts = nameservers
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h.length >= 4 && h.length <= 255);

  const body =
    validHosts.length >= 2
      ? { provider: 'custom' as const, hosts: validHosts.slice(0, 12) }
      : { provider: 'basic' as const };

  const res = await fetch(`${SPACESHIP_BASE}/domains/${encodeURIComponent(fqdn)}/nameservers`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data.detail ?? data.message ?? (res.status === 404 ? 'Dominio no encontrado en Spaceship.' : 'Error al actualizar nameservers.');
    console.error('Spaceship nameservers error:', res.status, data);
    return { ok: false, error: String(msg) };
  }

  return {
    ok: true,
    provider: data.provider ?? body.provider,
    hosts: data.hosts,
  };
}

/**
 * Get domain info from Spaceship (includes contact IDs, nameservers).
 */
export async function getDomainInfo(fqdn: string): Promise<DomainInfo | null> {
  const headers = getAuthHeaders();
  if (!headers) return null;

  const res = await fetch(`${SPACESHIP_BASE}/domains/${encodeURIComponent(fqdn)}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data;
}

export type SpaceshipContact = {
  firstName?: string;
  lastName?: string;
  organization?: string;
  email?: string;
  address1?: string;
  address2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
};

/**
 * Get contact details from Spaceship API (GET /v1/contacts/{contact}).
 */
export async function getContactDetails(contactId: string): Promise<SpaceshipContact | null> {
  const headers = getAuthHeaders();
  if (!headers) return null;

  const res = await fetch(`${SPACESHIP_BASE}/contacts/${encodeURIComponent(contactId)}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data;
}

export type SpaceshipDomainWhois = {
  whois: {
    registrantName: string;
    registrantOrg: string | null;
    registrantEmail: string;
    registrantPhone: string | null;
    registrantAddress: string | null;
    registrantCity: string | null;
    registrantState: string | null;
    registrantCountry: string | null;
    registrantPostalCode: string | null;
    privacyEnabled: boolean;
  };
  nameserver1: string | null;
  nameserver2: string | null;
};

export type UpdatePrivacyResult = { ok: true } | { ok: false; error: string };

/**
 * Fetch WHOIS and nameservers from Spaceship for a domain.
 * Returns null if domain not found or not in Spaceship.
 */
export async function getDomainWhoisFromSpaceship(
  fqdn: string
): Promise<SpaceshipDomainWhois | null> {
  const domainInfo = await getDomainInfo(fqdn);
  const contactId = domainInfo?.contacts?.registrant;
  if (!contactId) return null;

  const contact = await getContactDetails(contactId);
  if (!contact) return null;

  const registrantName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || '';

  const hosts = (domainInfo as { nameservers?: { hosts?: string[] } })?.nameservers?.hosts ?? [];
  const privacyLevel = (domainInfo as { privacyProtection?: { level?: string } })?.privacyProtection
    ?.level;
  const privacyEnabled = privacyLevel === 'high';

  return {
    whois: {
      registrantName,
      registrantOrg: contact.organization?.trim() || null,
      registrantEmail: contact.email?.trim() || '',
      registrantPhone: contact.phone?.trim() || null,
      registrantAddress: contact.address1?.trim() || null,
      registrantCity: contact.city?.trim() || null,
      registrantState: contact.stateProvince?.trim() || null,
      registrantCountry: contact.country?.trim() || null,
      registrantPostalCode: contact.postalCode?.trim() || null,
      privacyEnabled,
    },
    nameserver1: hosts[0] ?? null,
    nameserver2: hosts[1] ?? null,
  };
}

/**
 * Update domain privacy preference via Spaceship API.
 * PUT /v1/domains/{domain}/privacy/preference
 * privacyLevel: "public" | "high"
 */
export async function updateDomainPrivacyPreference(
  fqdn: string,
  privacyEnabled: boolean
): Promise<UpdatePrivacyResult> {
  const headers = getAuthHeaders();
  if (!headers) {
    return { ok: false, error: 'Spaceship API no configurado. Contacta al administrador.' };
  }

  const body = {
    privacyLevel: privacyEnabled ? ('high' as const) : ('public' as const),
    userConsent: true,
  };

  const res = await fetch(
    `${SPACESHIP_BASE}/domains/${encodeURIComponent(fqdn)}/privacy/preference`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.detail ?? data.message ?? 'Error al actualizar preferencia de privacidad en Spaceship.';
    console.error('Spaceship privacy error:', res.status, data);
    return { ok: false, error: String(msg) };
  }

  return { ok: true };
}

/**
 * Format phone for Spaceship API: ^\+\d{1,3}\.\d{4,}$ (e.g. +57.3001234567)
 */
function formatPhoneForSpaceship(phone: string | null | undefined, countryCode = 'CO'): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '+57.3000000000';
  const ccMap: Record<string, string> = { CO: '57', US: '1', MX: '52', ES: '34', AR: '54' };
  const cc = ccMap[countryCode] ?? '57';
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return `+${cc}.${local}`;
}

/**
 * Update WHOIS/contact info via Spaceship API.
 * PUT /contacts creates a NEW contact and returns contactId; we then assign it to the domain.
 */
export async function updateDomainWhois(
  fqdn: string,
  whois: WhoisContact
): Promise<UpdateWhoisResult> {
  const headers = getAuthHeaders();
  if (!headers) {
    return { ok: false, error: 'Spaceship API no configurado. Contacta al administrador.' };
  }

  const domainInfo = await getDomainInfo(fqdn);
  if (!domainInfo?.contacts?.registrant) {
    return { ok: false, error: 'No se encontró el dominio en Spaceship.' };
  }

  const email = (whois.registrantEmail || '').trim();
  if (!email || email.length < 3) {
    return { ok: false, error: 'El email del registrante es requerido para actualizar WHOIS.' };
  }

  // Split name: "Juan Pérez" -> firstName: Juan, lastName: Pérez
  const nameParts = (whois.registrantName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || 'N/A';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const country = (whois.registrantCountry || 'CO').trim().slice(0, 2).toUpperCase() || 'CO';

  const contactBody = {
    firstName,
    lastName,
    organization: (whois.registrantOrg || '').trim().slice(0, 255) || undefined,
    email,
    address1: (whois.registrantAddress || '').trim().slice(0, 255) || 'N/A',
    address2: undefined,
    city: (whois.registrantCity || '').trim().slice(0, 255) || 'N/A',
    country,
    stateProvince: (whois.registrantState || '').trim().slice(0, 255) || undefined,
    postalCode: (whois.registrantPostalCode || '').trim().slice(0, 16) || undefined,
    phone: formatPhoneForSpaceship(whois.registrantPhone, country),
  };

  // PUT /v1/contacts creates a new contact and returns contactId
  const saveRes = await fetch(`${SPACESHIP_BASE}/contacts`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(contactBody),
  });

  const saveData = await saveRes.json().catch(() => ({}));
  const newContactId = saveData.contactId;
  if (!saveRes.ok || !newContactId) {
    const msg =
      saveData.detail ?? saveData.message ?? 'Error al guardar datos WHOIS en Spaceship.';
    console.error('Spaceship contact save error:', saveRes.status, saveData);
    return { ok: false, error: String(msg) };
  }

  // Assign the new contact to the domain (registrant, admin, tech, billing)
  const contactsBody = {
    registrant: newContactId,
    admin: domainInfo.contacts?.admin ?? newContactId,
    tech: domainInfo.contacts?.tech ?? newContactId,
    billing: domainInfo.contacts?.billing ?? newContactId,
  };

  const domainRes = await fetch(`${SPACESHIP_BASE}/domains/${encodeURIComponent(fqdn)}/contacts`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(contactsBody),
  });

  const domainData = await domainRes.json().catch(() => ({}));
  if (!domainRes.ok) {
    const msg =
      domainData.detail ?? domainData.message ?? 'Error al actualizar contactos del dominio.';
    console.error('Spaceship domain contacts error:', domainRes.status, domainData);
    return { ok: false, error: String(msg) };
  }

  return { ok: true };
}
