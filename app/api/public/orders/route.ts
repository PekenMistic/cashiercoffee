import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { initDb } from '@/lib/init';
import { orders, orderItems, recipes, inventory } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const TAX = 0.10;

export async function POST(req: NextRequest) {
  await initDb();
  const body = await req.json();
  const { table_no, items, customer_notes } = body as {
    table_no: string;
    items: { menu_item_id: number; name: string; qty: number; price: number; subtotal: number }[];
    customer_notes?: string;
  };

  if (!table_no?.trim())     return NextResponse.json({ error: 'Nomor meja wajib' },       { status: 400 });
  if (!items?.length)        return NextResponse.json({ error: 'Pilih minimal 1 menu' },    { status: 400 });

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const tax      = Math.round(subtotal * TAX);
  const total    = subtotal + tax;
  const order_no = 'QR-' + Date.now().toString().slice(-8);
  const now      = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // Insert order — status 'pending' (cashier needs to process payment)
  const [order] = await db.insert(orders).values({
    order_no, cashier_id: null,
    subtotal, discount: 0, tax, total,
    payment_method: 'cash', amount_paid: 0, change_amount: 0,
    status: 'pending',
    table_no: table_no.trim(),
    source: 'qr',
    notes: customer_notes || '',
    created_at: now,
  }).returning();

  await db.insert(orderItems).values(
    items.map(i => ({
      order_id: order.id, menu_item_id: i.menu_item_id,
      name: i.name, qty: i.qty, price: i.price, subtotal: i.subtotal,
    }))
  );

  // Deduct inventory via recipes (same as POS)
  for (const item of items) {
    const itemRecipes = await db.select().from(recipes).where(eq(recipes.menu_item_id, item.menu_item_id));
    for (const r of itemRecipes) {
      const deduct = parseFloat((r.qty_used * item.qty).toFixed(4));
      const [inv]  = await db.select({ stock: inventory.stock }).from(inventory).where(eq(inventory.id, r.inventory_item_id));
      if (inv && inv.stock >= deduct) {
        await db.update(inventory).set({ stock: parseFloat((inv.stock - deduct).toFixed(4)) }).where(eq(inventory.id, r.inventory_item_id));
      }
    }
  }

  return NextResponse.json({ ok: true, order_no, order_id: order.id, total });
}

// GET: check order status (for customer polling)
export async function GET(req: NextRequest) {
  await initDb();
  const order_id = new URL(req.url).searchParams.get('order_id');
  if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 });

  const [order] = await db.select({ id: orders.id, order_no: orders.order_no, status: orders.status, total: orders.total, table_no: orders.table_no })
    .from(orders).where(eq(orders.id, parseInt(order_id)));
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = await db.select({ name: orderItems.name, qty: orderItems.qty, subtotal: orderItems.subtotal })
    .from(orderItems).where(eq(orderItems.order_id, order.id));

  return NextResponse.json({ ...order, items });
}
