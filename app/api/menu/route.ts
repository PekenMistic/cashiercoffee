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
  const { 
    name, category, price, cost, image_emoji, image_url, is_available, description,
    dietary_tags, is_recommended, stock_quantity, reorder_level, customizations
  } = await req.json();
  const [row] = await db.insert(menuItems).values({
    name, category, price, cost: cost||0,
    image_emoji: image_emoji||'☕',
    image_url: image_url||'',
    is_available: is_available !== 0,
    description: description||'',
    dietary_tags: dietary_tags||'',
    is_recommended: is_recommended||false,
    stock_quantity: stock_quantity!==undefined ? stock_quantity : -1,
    reorder_level: reorder_level||0,
    customizations: customizations||'',
  }).returning();
  return NextResponse.json({ ...row, is_available: row.is_available ? 1 : 0 });
}

export async function PUT(req: NextRequest) {
  await initDb();
  const { 
    id, name, category, price, cost, image_emoji, image_url, is_available, description,
    dietary_tags, is_recommended, stock_quantity, reorder_level, customizations
  } = await req.json();
  await db.update(menuItems).set({
    name, category, price, cost: cost||0,
    image_emoji: image_emoji||'☕',
    image_url: image_url||'',
    is_available: is_available !== 0,
    description: description||'',
    dietary_tags: dietary_tags||'',
    is_recommended: is_recommended||false,
    stock_quantity: stock_quantity!==undefined ? stock_quantity : -1,
    reorder_level: reorder_level||0,
    customizations: customizations||'',
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
