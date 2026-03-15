import { NextResponse } from 'next/server';
import { db } from '@/db';
import { initDb } from '@/lib/init';
import { menuItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  await initDb();
  const rows = await db.select().from(menuItems)
    .where(eq(menuItems.is_available, true))
    .orderBy(menuItems.category, menuItems.name);
  return NextResponse.json(rows.map(r => ({ ...r, is_available: 1 })));
}
