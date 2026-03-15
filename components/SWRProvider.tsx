'use client';
import { SWRConfig } from 'swr';
import { cacheGet } from '@/lib/offline-store';
import { ReactNode } from 'react';

/**
 * Wraps the app with SWR global config.
 * Also pre-populates the SWR cache from IndexedDB so pages
 * render instantly with stale data while fresh data loads.
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus:     false,
        revalidateOnReconnect: true,
        dedupingInterval:      5_000,
        errorRetryCount:       3,
        // Custom fetcher with IDB fallback
        fetcher: async (url: string) => {
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            // Update IDB cache
            const { cacheSet } = await import('@/lib/offline-store');
            await cacheSet(url, data);
            return data;
          } catch {
            // Serve stale IDB cache when offline
            const cached = await cacheGet(url);
            if (cached !== null) return cached;
            throw new Error('Offline dan tidak ada data cache');
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
