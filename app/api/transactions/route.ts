import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stockTransactions, inventory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { initDb } from '@/lib/init';

export async function GET() {
  await initDb();
  const rows = await db
    .select({
      id: stockTransactions.id, type: stockTransactions.type, item_id: stockTransactions.item_id,
      qty: stockTransactions.qty, price: stockTransactions.price, source: stockTransactions.source,
      note: stockTransactions.note, date: stockTransactions.date,
      item_name: inventory.name, item_unit: inventory.unit,
    })
    .from(stockTransactions)
    .leftJoin(inventory, eq(stockTransactions.item_id, inventory.id))
    .orderBy(desc(stockTransactions.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await initDb();
  const { type, item_id, qty, price, source, note, date } = await req.json();
  const [item] = await db.select({ stock: inventory.stock }).from(inventory).where(eq(inventory.id, item_id));
  if (!item) return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
  if (type === 'out' && item.stock < qty) return NextResponse.json({ error: `Stok tidak cukup (saat ini: ${item.stock})` }, { status: 400 });
  const newStock = parseFloat((type === 'in' ? item.stock + qty : item.stock - qty).toFixed(4));
  await db.update(inventory).set({ stock: newStock }).where(eq(inventory.id, item_id));
  const [row] = await db.insert(stockTransactions).values({ type, item_id, qty, price: price || 0, source: source || '', note: note || '', date }).returning();
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  await initDb();
  const { id } = await req.json();
  await db.delete(stockTransactions).where(eq(stockTransactions.id, id));
  return NextResponse.json({ ok: true });
}
