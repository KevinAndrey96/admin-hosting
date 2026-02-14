'use client';

import { useEffect, useState } from 'react';

type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'CLIENT';
};

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const res = await fetch(`${basePath}/api/auth/session`, {
          credentials: 'include',
        });

        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setUser(data.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
