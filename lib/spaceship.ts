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

/** Build user-friendly error from Spaceship API response (detail + data[].field/details). */
function formatSpaceshipError(data: { detail?: string; message?: string; data?: Array<{ field?: string; details?: string }> }): string {
  const parts: string[] = [];
  const detail = data.detail ?? data.message;
  if (detail) parts.push(detail);
  const arr = Array.isArray(data.data) ? data.data : [];
  for (const item of arr) {
    if (item.field && item.details) {
      const fieldLabel: Record<string, string> = {
        city: 'Ciudad',
        address1: 'Dirección',
        postalCode: 'Código postal',
        phone: 'Teléfono',
        email: 'Email',
        firstName: 'Nombre',
        lastName: 'Apellido',
        country: 'País',
        stateProvince: 'Departamento/Estado',
        organization: 'Organización',
      };
      parts.push(`${fieldLabel[item.field] || item.field}: ${item.details}`);
    }
  }
  return parts.length ? parts.join('. ') : 'Error al procesar la solicitud.';
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
 * Check domain availability via Spaceship API.
 * GET /v1/domains/{domain}/available
 * Returns "available" if domain can be registered, or status if taken/transferable.
 */
export async function checkDomainAvailability(
  fqdn: string
): Promise<{ result: 'available' | 'taken'; domain?: string } | null> {
  const full = await getDomainAvailabilityWithPricing(fqdn);
  return full ? { result: full.result, domain: full.domain } : null;
}

export type DomainAvailabilityWithPricing = {
  result: 'available' | 'taken';
  domain?: string;
  transferPrice?: number;
  transferCurrency?: string;
  premiumPricing?: Array<{ operation?: string; price?: number; currency?: string }>;
};

/**
 * Get domain availability with transfer pricing for taken domains.
 * premiumPricing can include { operation: "transfer", price, currency }.
 */
function parseAvailabilityResponse(
  data: Record<string, unknown>,
  fqdn: string
): DomainAvailabilityWithPricing {
  const result = data.result === 'available' ? 'available' : 'taken';
  const arr = data.premiumPricing ?? data.pricing;
  const pricingArray = Array.isArray(arr) ? arr : (arr && typeof arr === 'object' ? [arr] : []);

  // Same logic as check-availability: use first item in premiumPricing (Spaceship returns
  // operation "register" for available, "transfer"/"renew" for taken - first item has the price)
  const priceObj =
    pricingArray[0] ??
    (data.pricing && typeof data.pricing === 'object' && !Array.isArray(data.pricing)
      ? (data.pricing as Record<string, unknown>)
      : null);
  const rawPrice = priceObj?.price ?? priceObj?.amount ?? data.price ?? data.amount;
  const transferPrice = rawPrice != null ? Number(rawPrice) : undefined;
  const transferCurrency = (priceObj?.currency as string) ?? (data.currency as string) ?? 'USD';

  return {
    result,
    domain: (data.domain as string) || fqdn,
    transferPrice: transferPrice != null && !isNaN(transferPrice) ? transferPrice : undefined,
    transferCurrency,
    premiumPricing: pricingArray,
  };
}

/**
 * Get domain availability with transfer pricing for taken domains.
 * Uses GET /domains/{domain}/available; falls back to POST /domains/available (bulk) if no price.
 * premiumPricing items can have: operation, price|amount, currency.
 */
export async function getDomainAvailabilityWithPricing(
  fqdn: string
): Promise<DomainAvailabilityWithPricing | null> {
  const headers = getAuthHeaders();
  if (!headers) return null;

  const res = await fetch(
    `${SPACESHIP_BASE}/domains/${encodeURIComponent(fqdn)}/available`,
    { method: 'GET', headers }
  );

  if (!res.ok) return null;
  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  let parsed = parseAvailabilityResponse(data, fqdn);

  // If no price yet, try bulk endpoint (POST) - may return different structure (for both available and taken)
  if (parsed.transferPrice == null) {
    const bulkRes = await fetch(`${SPACESHIP_BASE}/domains/available`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ domains: [fqdn] }),
    });
    if (bulkRes.ok) {
      const bulkData = await bulkRes.json().catch(() => ({})) as { domains?: Array<Record<string, unknown>> };
      const domainItem = Array.isArray(bulkData.domains) ? bulkData.domains.find(
        (d) => (d.domain as string)?.toLowerCase() === fqdn.toLowerCase()
      ) ?? bulkData.domains[0] : null;
      if (domainItem) {
        const bulkParsed = parseAvailabilityResponse(domainItem, fqdn);
        if (bulkParsed.transferPrice != null) {
          parsed = { ...parsed, transferPrice: bulkParsed.transferPrice, transferCurrency: bulkParsed.transferCurrency };
        }
      }
    }
  }

  return parsed;
}

/**
 * Extract TLD from domain (e.g. ejemplo.com -> com, test.com.co -> com.co).
 */
function extractTld(domain: string): string | null {
  const d = domain.toLowerCase().trim();
  if (d.endsWith('.com.co')) return 'com.co';
  if (d.endsWith('.it.com')) return 'it.com';
  const parts = d.split('.');
  const tld = parts[parts.length - 1] ?? '';
  return tld && tld.length >= 2 ? tld : null;
}

/** TLD to Spaceship pricing-bff productSlug. */
const TLD_TO_PRODUCT_SLUG: Record<string, string> = {
  com: 'com',
  net: 'net',
  org: 'org',
  lat: 'lat',
  ai: 'ai',
  'it.com': 'it_com',
  shop: 'shop',
  cv: 'cv',
  inc: 'inc',
  blog: 'blog',
  llc: 'llc',
  io: 'io',
  chat: 'chat',
  live: 'live',
  art: 'art',
  one: 'one',
  cc: 'cc',
  ac: 'ac',
  sh: 'sh',
  gg: 'gg',
  new: 'new',
  best: 'best',
  fm: 'fm',
  page: 'page',
  eco: 'eco',
  co: 'co',
  'com.co': 'com_co',
};

function buildProductItem(productSlug: string) {
  return {
    priceTypes: ['purchase', 'renewal'],
    product: {
      productSlug,
      plan: {
        pricingPlanParams: { transfer: 0, sld: 'spaceship-query1' },
        pricingPlanSlug: 'regular',
        period: 'P1Y',
      },
    },
  };
}

/**
 * Try pricing-bff API first. Falls back to spaceship.dev when Cloudflare blocks (403).
 */
async function getPriceFromPricingBff(domain: string, tld: string, productSlug: string): Promise<{ price: number; currency: string } | null> {
  const headers = getAuthHeaders();
  if (!headers) return null;

  const body = {
    currencies: ['USD'],
    products: [buildProductItem(productSlug)],
    includeFields: ['components', 'modifiers', 'params', 'discount', 'pricePerPeriod', 'outputValues', 'reducers'],
    includeBasePrice: true,
  };

  const res = await fetch('https://www.spaceship.com/gateway/api/v1/pricing-bff/price/getPrices', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const rawText = await res.text();
  if (!res.ok) {
    if (res.status === 403) {
      console.warn('[getSpaceshipTransferPrice] pricing-bff 403 (Cloudflare) - falling back to spaceship.dev');
    } else {
      console.error('[getSpaceshipTransferPrice] pricing-bff error:', res.status, rawText.slice(0, 200));
    }
    return null;
  }

  let data: { products?: Array<{ product?: { productSlug?: string }; prices?: Array<{ priceType?: string; total?: { USD?: { price?: { amount?: string; currency?: string } } } }> }> };
  try {
    data = JSON.parse(rawText);
  } catch {
    return null;
  }

  const product = (data.products ?? []).find((p) => p.product?.productSlug === productSlug);
  const renewalPrice = product?.prices?.find((p) => (p.priceType ?? '').toLowerCase() === 'renewal');
  const priceItem = renewalPrice ?? product?.prices?.[0];
  const amount = priceItem?.total?.USD?.price?.amount;
  const currency = priceItem?.total?.USD?.price?.currency ?? 'USD';
  const price = amount != null ? parseFloat(amount) : NaN;

  if (isNaN(price) || price <= 0) return null;
  return { price, currency };
}

/**
 * Get Spaceship transfer price. Tries pricing-bff first; falls back to spaceship.dev when Cloudflare blocks (403).
 */
export async function getSpaceshipTransferPrice(
  domain: string
): Promise<{ price: number; currency: string } | null> {
  const tld = extractTld(domain);
  if (!tld) {
    console.warn('[getSpaceshipTransferPrice] Invalid or missing TLD for domain:', domain);
    return null;
  }

  const productSlug = TLD_TO_PRODUCT_SLUG[tld];
  if (!productSlug) {
    console.warn('[getSpaceshipTransferPrice] TLD not in mapping:', tld, 'domain:', domain, 'supported:', Object.keys(TLD_TO_PRODUCT_SLUG).join(', '));
    return null;
  }

  const headers = getAuthHeaders();
  if (!headers) {
    console.warn('[getSpaceshipTransferPrice] Missing SPACESHIP_API_KEY or SPACESHIP_API_SECRET');
    return null;
  }

  // 1) Try pricing-bff (exact renewal price)
  let result = await getPriceFromPricingBff(domain, tld, productSlug);
  if (result) {
    console.log('[getSpaceshipTransferPrice] OK (pricing-bff) domain:', domain, 'price:', result.price, result.currency);
    return result;
  }

  // 2) Fallback: spaceship.dev (no Cloudflare) - try actual domain then probe domain
  let availability = await getDomainAvailabilityWithPricing(domain);
  if (availability?.transferPrice) {
    console.log('[getSpaceshipTransferPrice] OK (spaceship.dev fallback) domain:', domain, 'price:', availability.transferPrice, availability.transferCurrency);
    return { price: availability.transferPrice, currency: availability.transferCurrency ?? 'USD' };
  }

  const probeDomain = `xk${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.replace(/\./g, '') + '.' + tld;
  availability = await getDomainAvailabilityWithPricing(probeDomain);
  if (availability?.transferPrice) {
    console.log('[getSpaceshipTransferPrice] OK (spaceship.dev probe) domain:', domain, 'price:', availability.transferPrice, availability.transferCurrency);
    return { price: availability.transferPrice, currency: availability.transferCurrency ?? 'USD' };
  }

  console.warn('[getSpaceshipTransferPrice] All sources failed for domain:', domain);
  return null;
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
 * Sanitize city for Spaceship API. Spaceship requires ASCII letters, spaces, hyphens.
 * Normalizes accented chars (Bogotá -> Bogota, Medellín -> Medellin).
 */
function sanitizeCityForSpaceship(city: string | null | undefined): string {
  const raw = (city || '').trim();
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
  return normalized || 'Bogota';
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
 * Sanitize postal code for Spaceship. Colombia (.co, .com.co) requires 6-digit numeric.
 * Invalid values (letters, wrong length, empty) are replaced with Bogotá default.
 */
function sanitizePostalCodeForSpaceship(
  postalCode: string | null | undefined,
  countryCode = 'CO'
): string | undefined {
  const raw = (postalCode || '').trim().slice(0, 16);
  const digitsOnly = raw.replace(/\D/g, '');
  if (countryCode === 'CO') {
    if (digitsOnly.length === 6) return digitsOnly;
    return '110111'; // Bogotá default - required for .co/.com.co
  }
  if (!raw) return undefined;
  return raw;
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

  const city = sanitizeCityForSpaceship(whois.registrantCity);

  const contactBody = {
    firstName,
    lastName,
    organization: (whois.registrantOrg || '').trim().slice(0, 255) || undefined,
    email,
    address1: (whois.registrantAddress || '').trim().slice(0, 255) || 'N/A',
    address2: undefined,
    city,
    country,
    stateProvince: (whois.registrantState || '').trim().slice(0, 255) || undefined,
    postalCode: sanitizePostalCodeForSpaceship(whois.registrantPostalCode, country),
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
    const msg = formatSpaceshipError(saveData);
    console.error('Spaceship contact save error:', saveRes.status, saveData);
    return { ok: false, error: msg };
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

// -----------------------------------------------------------------------------
// Domain Transfer In
// -----------------------------------------------------------------------------

export type TransferInResult =
  | { ok: true; operationId: string }
  | { ok: false; error: string };

export type AsyncOperationStatus = 'pending' | 'success' | 'failed';

export type AsyncOperationResult =
  | { ok: true; status: AsyncOperationStatus; details?: string }
  | { ok: false; error: string };

/**
 * Request domain transfer in via Spaceship API.
 * POST /v1/domains/{domain}/transfers
 * Returns 202 with spaceship-async-operationid header.
 */
export async function requestDomainTransfer(
  fqdn: string,
  authCode: string,
  whois: WhoisContact,
  options: { years?: number; privacyEnabled?: boolean; autoRenew?: boolean }
): Promise<TransferInResult> {
  const headers = getAuthHeaders();
  if (!headers) {
    return { ok: false, error: 'Spaceship API no configurado. Contacta al administrador.' };
  }

  const email = (whois.registrantEmail || '').trim();
  if (!email || email.length < 3) {
    return { ok: false, error: 'El email del registrante es requerido.' };
  }

  const authCodeTrim = (authCode || '').trim();
  if (!authCodeTrim) {
    return { ok: false, error: 'El código de autorización (EPP) es requerido.' };
  }

  const nameParts = (whois.registrantName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || 'N/A';
  const lastName = nameParts.slice(1).join(' ') || firstName;
  const country = (whois.registrantCountry || 'CO').trim().slice(0, 2).toUpperCase() || 'CO';

  const city = sanitizeCityForSpaceship(whois.registrantCity);

  const contactBody = {
    firstName,
    lastName,
    organization: (whois.registrantOrg || '').trim().slice(0, 255) || undefined,
    email,
    address1: (whois.registrantAddress || '').trim().slice(0, 255) || 'N/A',
    address2: undefined,
    city,
    country,
    stateProvince: (whois.registrantState || '').trim().slice(0, 255) || undefined,
    postalCode: sanitizePostalCodeForSpaceship(whois.registrantPostalCode, country),
    phone: formatPhoneForSpaceship(whois.registrantPhone, country),
  };

  const saveRes = await fetch(`${SPACESHIP_BASE}/contacts`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(contactBody),
  });

  const saveData = await saveRes.json().catch(() => ({}));
  const contactId = saveData.contactId;
  if (!saveRes.ok || !contactId) {
    const msg = formatSpaceshipError(saveData);
    console.error('Spaceship contact save error:', saveRes.status, JSON.stringify(saveData), 'contactBody:', JSON.stringify(contactBody));
    return { ok: false, error: msg };
  }

  const body = {
    authCode: authCodeTrim,
    autoRenew: options.autoRenew ?? false,
    privacyProtection: {
      level: options.privacyEnabled ? ('high' as const) : ('public' as const),
      userConsent: true,
    },
    contacts: {
      registrant: contactId,
      admin: contactId,
      tech: contactId,
      billing: contactId,
    },
  };

  // Use ASCII/punycode for domain in URL (required by some registries)
  const domainAscii = (() => {
    try {
      return new URL(`http://${fqdn}`).hostname || fqdn;
    } catch {
      return fqdn;
    }
  })();

  // POST /v1/domains/{domain}/transfer (singular, per Spaceship API docs)
  const res = await fetch(
    `${SPACESHIP_BASE}/domains/${encodeURIComponent(domainAscii)}/transfer`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    let msg = formatSpaceshipError(data) || 'Error al iniciar la transferencia.';
    if (res.status === 404) {
      msg =
        'No se encontró el recurso. Verifica que el dominio esté correcto, que el TLD sea compatible con transferencias, y que el dominio esté registrado en otro registrador.';
    }
    if (
      /payment|balance|funds|billing|pago|saldo/i.test(msg) ||
      /payment method is not available/i.test(String(data.detail ?? data.message ?? ''))
    ) {
      msg =
        'Método de pago no disponible. Asegúrate de tener saldo suficiente o un método de pago configurado en tu cuenta del registrador.';
    }
    console.error('Spaceship transfer error:', res.status, JSON.stringify(data));
    return { ok: false, error: msg };
  }

  const operationId = res.headers.get('spaceship-async-operationid');
  if (!operationId) {
    return { ok: false, error: 'Spaceship no devolvió el ID de operación.' };
  }

  return { ok: true, operationId };
}

// -----------------------------------------------------------------------------
// Domain Registration (new domain)
// -----------------------------------------------------------------------------

export type RegisterDomainResult =
  | { ok: true; operationId: string }
  | { ok: false; error: string };

/**
 * Register a new domain via Spaceship API.
 * POST /v1/domains/{domain}
 * Creates contact from whois, then registers domain. Returns 202 with operationId.
 */
export async function registerDomain(
  fqdn: string,
  whois: WhoisContact,
  options: { years?: number; privacyEnabled?: boolean; autoRenew?: boolean }
): Promise<RegisterDomainResult> {
  const headers = getAuthHeaders();
  if (!headers) {
    return { ok: false, error: 'Spaceship API no configurado. Contacta al administrador.' };
  }

  const email = (whois.registrantEmail || '').trim();
  if (!email || email.length < 3) {
    return { ok: false, error: 'El email del registrante es requerido.' };
  }

  const nameParts = (whois.registrantName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || 'N/A';
  const lastName = nameParts.slice(1).join(' ') || firstName;
  const country = (whois.registrantCountry || 'CO').trim().slice(0, 2).toUpperCase() || 'CO';
  const city = sanitizeCityForSpaceship(whois.registrantCity);

  const contactBody = {
    firstName,
    lastName,
    organization: (whois.registrantOrg || '').trim().slice(0, 255) || undefined,
    email,
    address1: (whois.registrantAddress || '').trim().slice(0, 255) || 'N/A',
    address2: undefined,
    city,
    country,
    stateProvince: (whois.registrantState || '').trim().slice(0, 255) || undefined,
    postalCode: sanitizePostalCodeForSpaceship(whois.registrantPostalCode, country),
    phone: formatPhoneForSpaceship(whois.registrantPhone, country),
  };

  const saveRes = await fetch(`${SPACESHIP_BASE}/contacts`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(contactBody),
  });

  const saveData = await saveRes.json().catch(() => ({}));
  const contactId = saveData.contactId;
  if (!saveRes.ok || !contactId) {
    const msg = formatSpaceshipError(saveData);
    console.error('Spaceship contact save error (register):', saveRes.status, JSON.stringify(saveData));
    return { ok: false, error: msg };
  }

  const domainAscii = (() => {
    try {
      return new URL(`http://${fqdn}`).hostname || fqdn;
    } catch {
      return fqdn;
    }
  })();

  const body = {
    autoRenew: options.autoRenew ?? false,
    years: options.years ?? 1,
    privacyProtection: {
      level: options.privacyEnabled ? ('high' as const) : ('public' as const),
      userConsent: true,
    },
    contacts: {
      registrant: contactId,
      admin: contactId,
      tech: contactId,
      billing: contactId,
    },
  };

  const res = await fetch(
    `${SPACESHIP_BASE}/domains/${encodeURIComponent(domainAscii)}`,
    { method: 'POST', headers, body: JSON.stringify(body) }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = formatSpaceshipError(data) || 'Error al registrar el dominio.';
    console.error('Spaceship register error:', res.status, JSON.stringify(data));
    return { ok: false, error: msg };
  }

  const operationId = res.headers.get('spaceship-async-operationid');
  if (!operationId) {
    return { ok: false, error: 'Spaceship no devolvió el ID de operación.' };
  }

  return { ok: true, operationId };
}

/**
 * Get async operation status from Spaceship.
 * GET /v1/async-operations/{operationId}
 */
export async function getAsyncOperationStatus(
  operationId: string
): Promise<AsyncOperationResult> {
  const headers = getAuthHeaders();
  if (!headers) {
    return { ok: false, error: 'Spaceship API no configurado.' };
  }

  const res = await fetch(
    `${SPACESHIP_BASE}/async-operations/${encodeURIComponent(operationId)}`,
    { method: 'GET', headers }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.detail ?? data.message ?? 'Error al consultar el estado.';
    return { ok: false, error: String(msg) };
  }

  const status = (data.status ?? 'pending') as AsyncOperationStatus;
  const details = data.details ?? data.message;

  return {
    ok: true,
    status,
    details: typeof details === 'string' ? details : JSON.stringify(details),
  };
}
