import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// ── DB path: ./data/brewstock.db (relative to project root) ───────────────
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH  = path.join(DATA_DIR, 'brewstock.db');

// Ensure data/ directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Singleton client
declare global { var __libsqlClient: ReturnType<typeof createClient> | undefined; }

function makeClient() {
  return createClient({ url: `file:${DB_PATH}` });
}

const client = global.__libsqlClient ?? makeClient();
if (process.env.NODE_ENV !== 'production') global.__libsqlClient = client;

export const db = drizzle(client, { schema });
export type DB  = typeof db;
