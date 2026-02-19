/**
 * Shared domain validation utilities.
 */

export function isValidFqdn(fqdn: string): boolean {
  if (!fqdn || fqdn.length > 253) return false;
  if (/[:/\\]/.test(fqdn)) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(fqdn);
}

export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
