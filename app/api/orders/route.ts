import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, employees, inventory, recipes, stockTransactions } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { initDb } from '@/lib/init';

export async function GET(req: NextRequest) {
  await initDb();
  const { searchParams } = new URL(req.url);
  const date   = searchParams.get('date');
  const limit  = parseInt(searchParams.get('limit') || '0');
  const source = searchParams.get('source');
  const status = searchParams.get('status');

  let q = db
    .select({
      id: orders.id, order_no: orders.order_no, cashier_id: orders.cashier_id,
      subtotal: orders.subtotal, discount: orders.discount, tax: orders.tax, total: orders.total,
      payment_method: orders.payment_method, amount_paid: orders.amount_paid,
      change_amount: orders.change_amount, status: orders.status,
      table_no: orders.table_no, source: orders.source, notes: orders.notes,
      created_at: orders.created_at, cashier_name: employees.name,
      item_count: sql<number>`(select count(*) from order_items where order_id = orders.id)`,
    })
    .from(orders)
    .leftJoin(employees, eq(orders.cashier_id, employees.id))
    .orderBy(desc(orders.id))
    .$dynamic();

  if (date)   q = q.where(sql`DATE(${orders.created_at}) = ${date}`);
  if (source) q = q.where(eq(orders.source, source as 'pos' | 'qr'));
  if (status) q = q.where(eq(orders.status, status));
  if (limit)  q = q.limit(limit);

  const rows = await q;
  const result = await Promise.all(rows.map(async o => ({
    ...o,
    items: await db.select().from(orderItems).where(eq(orderItems.order_id, o.id)),
  })));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  await initDb();
  const { cashier_id, items, subtotal, discount, tax, total, payment_method, amount_paid, change_amount, notes, table_no, source } = await req.json();
  if (!items || items.length === 0) return NextResponse.json({ error: 'Tidak ada item' }, { status: 400 });

  const now = new Date();
  const order_no = 'ORD-' + now.getTime().toString().slice(-8);
  const dateStr = now.toISOString().split('T')[0];

  const [order] = await db.insert(orders).values({
    order_no, cashier_id: cashier_id || null, subtotal, discount: discount||0,
    tax: tax||0, total, payment_method: payment_method||'cash',
    amount_paid, change_amount: change_amount||0, notes: notes||'',
    table_no: table_no||'', source: source||'qr',
  }).returning();

  await db.insert(orderItems).values(
    items.map((i: { menu_item_id: number; name: string; qty: number; price: number; subtotal: number }) => ({
      order_id: order.id, menu_item_id: i.menu_item_id, name: i.name,
      qty: i.qty, price: i.price, subtotal: i.subtotal,
    }))
  );

  // Deduct inventory via recipes
  for (const item of items) {
    const recs = await db
      .select({ inventory_item_id: recipes.inventory_item_id, qty_used: recipes.qty_used })
      .from(recipes)
      .where(eq(recipes.menu_item_id, item.menu_item_id));

    for (const r of recs) {
      const deductQty = parseFloat((r.qty_used * item.qty).toFixed(4));
      const [inv] = await db.select({ stock: inventory.stock }).from(inventory).where(eq(inventory.id, r.inventory_item_id));
      if (inv) {
        const newStock = parseFloat(Math.max(0, inv.stock - deductQty).toFixed(4));
        await db.update(inventory).set({ stock: newStock }).where(eq(inventory.id, r.inventory_item_id));
        await db.insert(stockTransactions).values({ type: 'out', item_id: r.inventory_item_id, qty: deductQty, price: 0, source: 'POS', note: `Order #${order_no}`, date: dateStr });
      }
    }
  }

  return NextResponse.json({ id: order.id, order_no });
}

export async function PUT(req: NextRequest) {
  await initDb();
  const { id, action, status, notes } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 });

  if (action === 'complete') {
    await db.update(orders).set({ status: 'completed' }).where(eq(orders.id, id));
  } else if (action === 'cancel_qr') {
    await db.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, id));
  } else if (status) {
    await db.update(orders).set({ status }).where(eq(orders.id, id));
  } else if (notes !== undefined) {
    await db.update(orders).set({ notes }).where(eq(orders.id, id));
  }

  return NextResponse.json({ ok: true });
}
