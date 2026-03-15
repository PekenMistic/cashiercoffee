import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes, inventory, menuItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { initDb } from '@/lib/init';

export async function GET(req: NextRequest) {
  await initDb();
  const menuItemId = new URL(req.url).searchParams.get('menu_item_id');
  const q = db.select({
    id: recipes.id, menu_item_id: recipes.menu_item_id, inventory_item_id: recipes.inventory_item_id,
    qty_used: recipes.qty_used, unit: recipes.unit, notes: recipes.notes,
    inventory_name: inventory.name, inventory_unit: inventory.unit,
    current_stock: inventory.stock, menu_name: menuItems.name, menu_category: menuItems.category,
  }).from(recipes)
    .leftJoin(inventory, eq(recipes.inventory_item_id, inventory.id))
    .leftJoin(menuItems, eq(recipes.menu_item_id, menuItems.id));

  const rows = menuItemId
    ? await q.where(eq(recipes.menu_item_id, parseInt(menuItemId))).orderBy(recipes.id)
    : await q.orderBy(menuItems.category, menuItems.name, recipes.id);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await initDb();
  const { menu_item_id, inventory_item_id, qty_used, unit, notes } = await req.json();
  if (!menu_item_id || !inventory_item_id || !qty_used) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
  const [row] = await db.insert(recipes).values({ menu_item_id, inventory_item_id, qty_used, unit: unit||'unit', notes: notes||'' }).returning();
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  await initDb();
  const { id, qty_used, unit, notes } = await req.json();
  await db.update(recipes).set({ qty_used, unit: unit||'unit', notes: notes||'' }).where(eq(recipes.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await initDb();
  const { id } = await req.json();
  await db.delete(recipes).where(eq(recipes.id, id));
  return NextResponse.json({ ok: true });
}
