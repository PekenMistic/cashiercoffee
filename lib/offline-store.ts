'use client';
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME    = 'brewstock-offline';
const DB_VERSION = 1;

export interface SyncItem {
  id:        string;
  url:       string;
  method:    'POST' | 'PUT' | 'DELETE';
  body:      unknown;
  createdAt: number;
  retries:   number;
}

export interface CacheEntry {
  url:   string;
  data:  unknown;
  ts:    number; // unix ms
}

let _db: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('cache'))
        db.createObjectStore('cache', { keyPath: 'url' });
      if (!db.objectStoreNames.contains('sync_queue'))
        db.createObjectStore('sync_queue', { keyPath: 'id' });
    },
  });
  return _db;
}

// ── Cache ──────────────────────────────────────────────────────────────────
export async function cacheGet<T>(url: string): Promise<T | null> {
  try {
    const db    = await getDB();
    const entry = await db.get('cache', url) as CacheEntry | undefined;
    if (!entry) return null;
    // Stale after 30 minutes (data freshness)
    if (Date.now() - entry.ts > 30 * 60 * 1000) return null;
    return entry.data as T;
  } catch { return null; }
}

export async function cacheSet(url: string, data: unknown): Promise<void> {
  try {
    const db = await getDB();
    await db.put('cache', { url, data, ts: Date.now() } satisfies CacheEntry);
  } catch { /* storage full / unavailable */ }
}

export async function cacheInvalidate(pattern: RegExp): Promise<void> {
  try {
    const db   = await getDB();
    const keys = await db.getAllKeys('cache') as string[];
    await Promise.all(keys.filter(k => pattern.test(k)).map(k => db.delete('cache', k)));
  } catch { /* ignore */ }
}

export async function cacheInvalidateAll(): Promise<void> {
  try { const db = await getDB(); await db.clear('cache'); } catch { /* ignore */ }
}

// ── Sync Queue ────────────────────────────────────────────────────────────
export async function queuePush(item: Omit<SyncItem, 'id' | 'createdAt' | 'retries'>): Promise<void> {
  try {
    const db = await getDB();
    await db.add('sync_queue', {
      ...item,
      id:        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
      retries:   0,
    } satisfies SyncItem);
  } catch { /* ignore */ }
}

export async function queueGetAll(): Promise<SyncItem[]> {
  try { const db = await getDB(); return (await db.getAll('sync_queue')) as SyncItem[]; }
  catch { return []; }
}

export async function queueDelete(id: string): Promise<void> {
  try { const db = await getDB(); await db.delete('sync_queue', id); } catch { /* ignore */ }
}

export async function queueCount(): Promise<number> {
  try { const db = await getDB(); return await db.count('sync_queue'); }
  catch { return 0; }
}
