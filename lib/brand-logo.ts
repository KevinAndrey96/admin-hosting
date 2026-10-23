/** Default panel logo (under `public/`). */
export const DEFAULT_LOGO_PATH = '/assets/static/images/logo.svg';

export function resolveLogoUrl(logoUrl?: string | null): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const fallback = `${basePath}${DEFAULT_LOGO_PATH}`;

  const trimmed = logoUrl?.trim();
  if (!trimmed) {
    return fallback;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `${basePath}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}
