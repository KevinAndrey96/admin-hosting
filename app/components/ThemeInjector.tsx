'use client';

import { useSettings } from '../hooks/useSettings';
import { hexToRgb, isValidHexColor } from '@/lib/theme-utils';

const DEFAULT_PRIMARY = '#6366f1';
const DEFAULT_SECONDARY = '#64748b';

export default function ThemeInjector() {
  const { settings, loading } = useSettings();

  if (loading || !settings) return null;

  const primary = isValidHexColor(settings.primary_color ?? '')
    ? settings.primary_color!
    : DEFAULT_PRIMARY;
  const secondary = isValidHexColor(settings.secondary_color ?? '')
    ? settings.secondary_color!
    : DEFAULT_SECONDARY;

  const primaryRgb = hexToRgb(primary) ?? '99, 102, 241';
  const secondaryRgb = hexToRgb(secondary) ?? '100, 116, 139';

  const css = `
:root, [data-theme="light"] {
  --c-primary: ${primary};
  --c-primary-light: color-mix(in srgb, ${primary} 70%, white);
  --c-primary-dark: color-mix(in srgb, ${primary} 85%, black);
  --c-primary-hover: color-mix(in srgb, ${primary} 90%, black);
  --c-primary-rgb: ${primaryRgb};
  --c-secondary: ${secondary};
  --c-secondary-light: color-mix(in srgb, ${secondary} 70%, white);
  --c-secondary-dark: color-mix(in srgb, ${secondary} 85%, black);
  --c-secondary-rgb: ${secondaryRgb};
}
[data-theme="dark"] {
  --c-primary: color-mix(in srgb, ${primary} 85%, white);
  --c-primary-light: color-mix(in srgb, ${primary} 70%, white);
  --c-primary-dark: ${primary};
  --c-primary-hover: ${primary};
  --c-primary-rgb: ${primaryRgb};
  --c-secondary: color-mix(in srgb, ${secondary} 85%, white);
  --c-secondary-light: color-mix(in srgb, ${secondary} 70%, white);
  --c-secondary-dark: ${secondary};
  --c-secondary-rgb: ${secondaryRgb};
}
`;

  return (
    <style
      id="theme-colors-injector"
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
