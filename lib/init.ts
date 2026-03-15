/**
 * Called once at startup to ensure schema + seed data exist.
 * Import this in your root layout or first API middleware.
 */
let initialized = false;
export async function initDb() {
  if (initialized) return;
  initialized = true;
  const { ensureSchema } = await import('@/db/migrate');
  const { seedIfEmpty }  = await import('@/db/seed');
  await ensureSchema();
  await seedIfEmpty();
}
