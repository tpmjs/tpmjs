'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiEnvelope } from '~/lib/admin/types';

interface Options {
  /** Re-fetch interval while the tab is visible; 0 disables auto-refresh. */
  refreshMs?: number;
}

interface State<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  updatedAt: Date | null;
  refresh: () => void;
}

/** GET an admin envelope; throws with a readable message on auth or API failure. */
export async function fetchEnvelope<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Access denied. Admin role required.');
  }
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!body.success) throw new Error(body.error);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return body.data;
}

/**
 * Fetches an admin API resource with visibility-aware auto-refresh.
 * Keeps the last good payload on screen while a refresh is in flight, and maps
 * 401/403 to an explicit access message so pages never render a generic failure.
 */
export function useAdminResource<T>(url: string | null, options: Options = {}): State<T> {
  const refreshMs = options.refreshMs ?? 0;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const generation = useRef(0);

  const load = useCallback(async () => {
    if (!url) return;
    const gen = ++generation.current;
    setRefreshing(true);
    try {
      const payload = await fetchEnvelope<T>(url);
      if (gen !== generation.current) return;
      setData(payload);
      setError(null);
      setUpdatedAt(new Date());
    } catch (err) {
      if (gen !== generation.current) return;
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      if (gen === generation.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [url]);

  useEffect(() => {
    setLoading(Boolean(url));
    void load();
  }, [load, url]);

  useEffect(() => {
    if (!refreshMs || !url) return;
    const tick = () => {
      if (document.visibilityState === 'visible') void load();
    };
    const timer = window.setInterval(tick, refreshMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [load, refreshMs, url]);

  return { data, error, loading, refreshing, updatedAt, refresh: () => void load() };
}
