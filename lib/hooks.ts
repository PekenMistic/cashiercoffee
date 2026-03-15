'use client';
/**
 * useApi — SWR-powered data fetching with offline cache fallback.
 *
 * Pattern:
 *  1. Return cached IDB data immediately (instant load)
 *  2. Fetch fresh data in background
 *  3. Update cache + UI when response arrives
 *  4. If offline, keep serving cache indefinitely
 */
import useSWR, { mutate as globalMutate } from 'swr';
import { cacheGet, cacheSet, cacheInvalidate, queuePush } from './offline-store';

// ── Fetcher with IDB fallback ──────────────────────────────────────────────
async function fetcher<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data: T = await res.json();
    // Store fresh data in IDB
    await cacheSet(url, data);
    return data;
  } catch (err) {
    // Network error — try IDB cache
    const cached = await cacheGet<T>(url);
    if (cached !== null) return cached;
    throw err;
  }
}

// ── SWR global config ─────────────────────────────────────────────────────
const SWR_CONFIG = {
  revalidateOnFocus:       false, // don't refetch on window focus
  revalidateOnReconnect:   true,  // refetch when back online
  dedupingInterval:        5_000, // dedupe requests within 5s
  focusThrottleInterval:   10_000,
  errorRetryInterval:      5_000,
  errorRetryCount:         3,
  // Load cached data from IDB as fallback before first fetch
  fallback:                {} as Record<string, unknown>,
};

// ── Generic hook ──────────────────────────────────────────────────────────
export function useApi<T>(url: string | null, fallbackData?: T) {
  const { data, error, isLoading, isValidating } = useSWR<T>(
    url,
    url ? () => fetcher<T>(url) : null,
    { ...SWR_CONFIG, fallbackData }
  );
  return {
    data,
    error,
    loading:     isLoading,
    validating:  isValidating,
    /** Revalidate (refetch) this key */
    refresh: () => url ? globalMutate(url) : undefined,
  };
}

// ── Invalidate cache and trigger refetch for a pattern ────────────────────
export async function invalidate(pattern: RegExp | string): Promise<void> {
  const re = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  await cacheInvalidate(re);
  await globalMutate(key => typeof key === 'string' && re.test(key));
}

// ── Mutation helper: queues when offline, executes immediately when online ─
interface MutationOptions {
  optimisticUpdate?: () => void; // run instantly for perceived speed
  onSuccess?: (data: unknown) => void;
  onError?: (err: Error) => void;
  invalidates?: RegExp | string;  // pattern of keys to invalidate after success
}

export async function apiFetch<T>(url: string): Promise<T> {
  return fetcher<T>(url);
}

export async function apiMutate(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  options: MutationOptions = {}
): Promise<{ queued: boolean; data?: unknown }> {
  const { optimisticUpdate, onSuccess, onError, invalidates } = options;

  optimisticUpdate?.();

  if (!navigator.onLine) {
    // Offline: queue for later sync
    await queuePush({ url, method, body });
    return { queued: true };
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    onSuccess?.(data);
    if (invalidates) await invalidate(invalidates);
    return { queued: false, data };
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    // On network error, queue
    if (!navigator.onLine || e.message.includes('fetch')) {
      await queuePush({ url, method, body });
      return { queued: true };
    }
    onError?.(e);
    throw e;
  }
}

// ── Pre-built domain hooks ─────────────────────────────────────────────────
export const useDashboard  = ()  => useApi('/api/dashboard');
export const useCategories = ()  => useApi('/api/categories');
export const useSuppliers  = ()  => useApi('/api/suppliers');
export const useInventory  = ()  => useApi('/api/inventory');
export const useTransactions = () => useApi('/api/transactions');
export const useEmployees  = ()  => useApi('/api/employees');
export const useMenu       = ()  => useApi('/api/menu');
export const useRecipes    = ()  => useApi('/api/recipes');
export const usePurchaseOrders = () => useApi('/api/purchase-orders');
export const useReorderSuggestions = () => useApi('/api/reorder-suggestions');

export const useShifts = (date: string) =>
  useApi(`/api/shifts?date=${date}`);

export const useOrders = (params?: { date?: string; limit?: number }) => {
  const qs = params
    ? '?' + Object.entries(params).filter(([,v]) => v != null).map(([k,v]) => `${k}=${v}`).join('&')
    : '';
  return useApi(`/api/orders${qs}`);
};

export const useReports = (period: 'today' | 'week' | 'month') =>
  useApi(`/api/reports?period=${period}`);

export const usePayroll = (month: string) =>
  useApi(`/api/payroll?month=${month}`);
