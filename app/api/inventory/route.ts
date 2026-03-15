import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { inventory, categories, suppliers, stockTransactions, recipes } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { initDb } from '@/lib/init';

export async function GET() {
  await initDb();
  const rows = await db
    .select({
      id: inventory.id, name: inventory.name, category_id: inventory.category_id,
      unit: inventory.unit, stock: inventory.stock, min_stock: inventory.min_stock,
      max_stock: inventory.max_stock, cost: inventory.cost, supplier_id: inventory.supplier_id,
      expiry: inventory.expiry, notes: inventory.notes,
      category_name: categories.name, category_icon: categories.icon, category_color: categories.color,
      supplier_name: suppliers.name,
    })
    .from(inventory)
    .leftJoin(categories, eq(inventory.category_id, categories.id))
    .leftJoin(suppliers, eq(inventory.supplier_id, suppliers.id))
    .orderBy(inventory.id);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await initDb();
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: 'Nama wajib' }, { status: 400 });
  const [row] = await db.insert(inventory).values({
    name: b.name.trim(), category_id: b.category_id || null, unit: b.unit || 'pcs',
    stock: b.stock ?? 0, min_stock: b.min_stock ?? 0, max_stock: b.max_stock ?? 100,
    cost: b.cost ?? 0, supplier_id: b.supplier_id || null,
    expiry: b.expiry || '', notes: b.notes || '',
  }).returning();
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  await initDb();
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 });
  await db.update(inventory).set({
    name: b.name, category_id: b.category_id || null, unit: b.unit,
    stock: b.stock, min_stock: b.min_stock, max_stock: b.max_stock,
    cost: b.cost, supplier_id: b.supplier_id || null,
    expiry: b.expiry || '', notes: b.notes || '',
  }).where(eq(inventory.id, b.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await initDb();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 });

  // Check references before deleting
  const [txnRef] = await db.select({ n: count() }).from(stockTransactions).where(eq(stockTransactions.item_id, id));
  if (txnRef.n > 0) {
    return NextResponse.json({ error: `Tidak bisa hapus: item memiliki ${txnRef.n} riwayat transaksi stok` }, { status: 400 });
  }
  const [recRef] = await db.select({ n: count() }).from(recipes).where(eq(recipes.inventory_item_id, id));
  if (recRef.n > 0) {
    return NextResponse.json({ error: `Tidak bisa hapus: item digunakan dalam ${recRef.n} resep` }, { status: 400 });
  }

  await db.delete(inventory).where(eq(inventory.id, id));
  return NextResponse.json({ ok: true });
}
