import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { menuItems, orderItems } from '@/db/schema';
import { eq, asc, count } from 'drizzle-orm';
import { initDb } from '@/lib/init';

export async function GET() {
  await initDb();
  const rows = await db.select().from(menuItems).orderBy(asc(menuItems.category), asc(menuItems.name));
  return NextResponse.json(rows.map(r => ({ ...r, is_available: r.is_available ? 1 : 0 })));
}

export async function POST(req: NextRequest) {
  await initDb();
  const { name, category, price, cost, image_emoji, is_available, description } = await req.json();
  const [row] = await db.insert(menuItems).values({
    name, category, price, cost: cost||0,
    image_emoji: image_emoji||'☕', is_available: is_available !== 0,
    description: description||'',
  }).returning();
  return NextResponse.json({ ...row, is_available: row.is_available ? 1 : 0 });
}

export async function PUT(req: NextRequest) {
  await initDb();
  const { id, name, category, price, cost, image_emoji, is_available, description } = await req.json();
  await db.update(menuItems).set({
    name, category, price, cost: cost||0,
    image_emoji: image_emoji||'☕', is_available: is_available !== 0,
    description: description||'',
  }).where(eq(menuItems.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await initDb();
  const { id } = await req.json();
  // Check if menu item is referenced by any order
  const [ref] = await db.select({ cnt: count() }).from(orderItems).where(eq(orderItems.menu_item_id, id));
  if (ref.cnt > 0) {
    // Soft delete: set unavailable instead of hard delete
    await db.update(menuItems).set({ is_available: false }).where(eq(menuItems.id, id));
    return NextResponse.json({ ok: true, soft: true, message: 'Item ditandai tidak tersedia (ada riwayat pesanan)' });
  }
  await db.delete(menuItems).where(eq(menuItems.id, id));
  return NextResponse.json({ ok: true });
}
