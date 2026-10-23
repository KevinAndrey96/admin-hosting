'use client';

import { useState, useEffect, useCallback } from 'react';
import { resolveLogoUrl } from '@/lib/brand-logo';

export type SettingsMap = Record<string, string>;

const SETTINGS_STORAGE_KEY = 'admin_panel_settings_v1';
const SETTINGS_STORAGE_TTL_MS = 5 * 60 * 1000;

function readCachedSettings(): SettingsMap | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { savedAt: number; data: SettingsMap };
    if (!parsed?.data || Date.now() - parsed.savedAt > SETTINGS_STORAGE_TTL_MS) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCachedSettings(data: SettingsMap): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), data })
    );
  } catch {
    // ignore quota / private mode
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<SettingsMap | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const cached = readCachedSettings();
    if (cached) {
      setSettingsState(cached);
      setLoading(false);
    }

    try {
      const res = await fetch(`${basePath}/api/settings`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSettingsState(data);
        writeCachedSettings(data);
      } else if (!cached) {
        setSettingsState({});
      }
    } catch {
      if (!cached) {
        setSettingsState({});
      }
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
      writeCachedSettings(updated);
      return updated;
    }
    throw new Error('Failed to save');
  }, []);

  const logoUrl = resolveLogoUrl(settings?.logo_url);

  const companyName = settings?.company_name || 'Azulática';

  return {
    settings,
    loading,
    logoUrl,
    companyName,
    fetchSettings,
    updateSettings,
  };
}
