'use client';

import { useState, useEffect, useCallback } from 'react';

export type SettingsMap = Record<string, string>;

export function useSettings() {
  const [settings, setSettingsState] = useState<SettingsMap | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettingsState(data);
      } else {
        setSettingsState({});
      }
    } catch {
      setSettingsState({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (data: Partial<SettingsMap>) => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const res = await fetch(`${basePath}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setSettingsState(updated);
      return updated;
    }
    throw new Error('Failed to save');
  }, []);

  const logoUrl = settings?.logo_url
    ? settings.logo_url.startsWith('http')
      ? settings.logo_url
      : `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${settings.logo_url.startsWith('/') ? '' : '/'}${settings.logo_url}`
    : `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/assets/static/images/logo.svg`;

  const companyName = settings?.company_name || 'Adminator';

  return {
    settings,
    loading,
    logoUrl,
    companyName,
    fetchSettings,
    updateSettings,
  };
}
