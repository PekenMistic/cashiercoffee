'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react';
import { queueGetAll, queueDelete, queueCount } from './offline-store';

// ── Network status ─────────────────────────────────────────────────────────
export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const up   = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online',  up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  return online;
}

// ── Background sync engine ─────────────────────────────────────────────────
export interface SyncState {
  pending:    number;
  syncing:    boolean;
  lastSyncAt: Date | null;
  errors:     string[];
}

export function useSyncEngine(onSynced?: () => void) {
  const online = useOnlineStatus();
  const [state, setState] = useState<SyncState>({
    pending: 0, syncing: false, lastSyncAt: null, errors: [],
  });
  const syncingRef = useRef(false);

  // Count pending items
  const refreshCount = useCallback(async () => {
    const n = await queueCount();
    setState(s => ({ ...s, pending: n }));
  }, []);

  // Run sync: flush all queued mutations
  const sync = useCallback(async () => {
    if (syncingRef.current || !online) return;
    syncingRef.current = true;
    setState(s => ({ ...s, syncing: true, errors: [] }));

    const items = await queueGetAll();
    const errors: string[] = [];

    for (const item of items) {
      try {
        const res = await fetch(item.url, {
          method:  item.method,
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(item.body),
        });
        if (res.ok) {
          await queueDelete(item.id);
        } else {
          const err = await res.json().catch(() => ({}));
          errors.push(`${item.method} ${item.url}: ${err.error || res.statusText}`);
          // Remove after 5 retries to avoid infinite loop
          if (item.retries >= 5) await queueDelete(item.id);
        }
      } catch {
        errors.push(`${item.method} ${item.url}: network error`);
      }
    }

    const remaining = await queueCount();
    setState({ pending: remaining, syncing: false, lastSyncAt: new Date(), errors });
    syncingRef.current = false;
    if (items.length > 0) onSynced?.();
  }, [online, onSynced]);

  // Auto-sync when coming back online
   
  useEffect(() => {
    if (online) {
      refreshCount();  
      sync();
    }
  }, [online, refreshCount, sync]);

  // Periodic count refresh
   
  useEffect(() => {
    refreshCount();  
    const interval = setInterval(refreshCount, 10_000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  return { ...state, online, sync, refreshCount };
}
