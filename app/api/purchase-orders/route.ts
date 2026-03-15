import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { initDb } from '@/lib/init';
import { purchaseOrders, purchaseOrderItems, suppliers, inventory, stockTransactions } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

function nowStr() { return new Date().toISOString().replace('T',' ').slice(0,19); }

export async function GET(req: NextRequest) {
  await initDb();
  const id = new URL(req.url).searchParams.get('id');

  if (id) {
    const [po] = await db.select({
      id: purchaseOrders.id, po_no: purchaseOrders.po_no, supplier_id: purchaseOrders.supplier_id,
      status: purchaseOrders.status, notes: purchaseOrders.notes, created_at: purchaseOrders.created_at,
      sent_at: purchaseOrders.sent_at, received_at: purchaseOrders.received_at,
      total_value: purchaseOrders.total_value, supplier_name: suppliers.name,
    }).from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplier_id, suppliers.id))
      .where(eq(purchaseOrders.id, parseInt(id)));
    if (!po) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.po_id, parseInt(id)));
    return NextResponse.json({ ...po, items });
  }

  const rows = await db.select({
    id: purchaseOrders.id, po_no: purchaseOrders.po_no, supplier_id: purchaseOrders.supplier_id,
    status: purchaseOrders.status, notes: purchaseOrders.notes, created_at: purchaseOrders.created_at,
    total_value: purchaseOrders.total_value, supplier_name: suppliers.name,
    item_count: sql<number>`(select count(*) from purchase_order_items where po_id = purchase_orders.id)`,
  }).from(purchaseOrders)
    .leftJoin(suppliers, eq(purchaseOrders.supplier_id, suppliers.id))
    .orderBy(desc(purchaseOrders.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await initDb();
  const { supplier_id, notes, items } = await req.json();
  if (!items?.length) return NextResponse.json({ error: 'Minimal satu item' }, { status: 400 });
  const total_value = items.reduce((s: number, i: { subtotal: number }) => s + (i.subtotal || 0), 0);
  const po_no = 'PO-' + Date.now().toString().slice(-8);
  const [po] = await db.insert(purchaseOrders).values({
    po_no, supplier_id: supplier_id || null, notes: notes || '', total_value, created_at: nowStr(),
  }).returning();
  await db.insert(purchaseOrderItems).values(
    items.map((i: { inventory_item_id: number; item_name: string; qty_ordered: number; unit: string; unit_cost: number }) => ({
      po_id: po.id, inventory_item_id: i.inventory_item_id, item_name: i.item_name,
      qty_ordered: i.qty_ordered, unit: i.unit, unit_cost: i.unit_cost || 0,
      subtotal: i.qty_ordered * (i.unit_cost || 0),
    }))
  );
  return NextResponse.json({ id: po.id, po_no });
}

export async function PUT(req: NextRequest) {
  await initDb();
  const body = await req.json();
  const { id, action } = body;
  const now = nowStr();
  const dateStr = now.split(' ')[0];

  if (action === 'send') {
    await db.update(purchaseOrders).set({ status: 'sent', sent_at: now }).where(eq(purchaseOrders.id, id));
  } else if (action === 'receive') {
    const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.po_id, id));
    for (const item of items) {
      const qty = item.qty_ordered - item.qty_received;
      if (qty <= 0) continue;
      const [inv] = await db.select({ stock: inventory.stock }).from(inventory).where(eq(inventory.id, item.inventory_item_id));
      if (inv) {
        await db.update(inventory).set({ stock: parseFloat((inv.stock + qty).toFixed(4)) }).where(eq(inventory.id, item.inventory_item_id));
        await db.insert(stockTransactions).values({ type: 'in', item_id: item.inventory_item_id, qty, price: item.unit_cost, source: 'Purchase Order', note: `PO #${id}`, date: dateStr });
      }
    }
    await db.update(purchaseOrderItems).set({ qty_received: sql`qty_ordered` }).where(eq(purchaseOrderItems.po_id, id));
    await db.update(purchaseOrders).set({ status: 'received', received_at: now }).where(eq(purchaseOrders.id, id));
  } else if (action === 'cancel') {
    await db.update(purchaseOrders).set({ status: 'cancelled' }).where(eq(purchaseOrders.id, id));
  } else {
    await db.update(purchaseOrders).set({ supplier_id: body.supplier_id || null, notes: body.notes || '' }).where(eq(purchaseOrders.id, id));
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await initDb();
  const { id } = await req.json();
  const [po] = await db.select({ status: purchaseOrders.status }).from(purchaseOrders).where(eq(purchaseOrders.id, id));
  if (!po) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  if (po.status !== 'draft') return NextResponse.json({ error: 'Hanya PO draft yang bisa dihapus' }, { status: 400 });
  await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.po_id, id));
  await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  return NextResponse.json({ ok: true });
}
