'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from './useSession';

export function useTicketsCount() {
  const { user } = useSession();
  const [counts, setCounts] = useState<{ openCount: number; urgentCount: number; loading: boolean }>({
    openCount: 0,
    urgentCount: 0,
    loading: true,
  });

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/tickets/count`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setCounts({
            openCount: Number(data.openCount) || 0,
            urgentCount: Number(data.urgentCount) || 0,
            loading: false,
          });
        }
      }
    } catch {
      // Ignore network errors in background poll
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchCounts();

    // Poll every 30 seconds
    const interval = setInterval(fetchCounts, 30_000);

    // Event listener for immediate sync
    const handleUpdate = () => fetchCounts();
    window.addEventListener('tickets:updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('tickets:updated', handleUpdate);
    };
  }, [user, fetchCounts]);

  return counts;
}
