import { NextResponse } from 'next/server';
import { db } from '@/db';
import { initDb } from '@/lib/init';
import { inventory, suppliers, categories } from '@/db/schema';
import { lt, eq, sql } from 'drizzle-orm';

export async function GET() {
  await initDb();
  const lowItems = await db.select({
    id: inventory.id, name: inventory.name, stock: inventory.stock,
    min_stock: inventory.min_stock, max_stock: inventory.max_stock,
    unit: inventory.unit, cost: inventory.cost,
    supplier_id: inventory.supplier_id, supplier_name: suppliers.name,
    category_name: categories.name,
    qty_to_order: sql<number>`CASE WHEN (max_stock - stock) > 0 THEN (max_stock - stock) ELSE 0 END`,
  }).from(inventory)
    .leftJoin(suppliers, eq(inventory.supplier_id, suppliers.id))
    .leftJoin(categories, eq(inventory.category_id, categories.id))
    .where(lt(inventory.stock, inventory.min_stock))
    .orderBy(sql`CAST(inventory.stock AS REAL) / NULLIF(CAST(inventory.min_stock AS REAL), 0) ASC`);

  const bySupplier: Record<string, { supplier_id:number|null; supplier_name:string; items:typeof lowItems; total_value:number }> = {};
  for (const item of lowItems) {
    const key = String(item.supplier_id ?? 'none');
    if (!bySupplier[key]) bySupplier[key] = { supplier_id: item.supplier_id, supplier_name: item.supplier_name||'Tanpa Supplier', items: [], total_value: 0 };
    bySupplier[key].items.push(item);
    bySupplier[key].total_value += Number(item.qty_to_order) * item.cost;
  }

  const expiringItems = await db.select({ id: inventory.id, name: inventory.name, stock: inventory.stock, unit: inventory.unit, expiry: inventory.expiry,
    days_left: sql<number>`CAST(julianday(expiry) - julianday('now') AS INTEGER)`,
  }).from(inventory).where(sql`expiry != '' AND expiry BETWEEN DATE('now') AND DATE('now', '+14 days')`).orderBy(inventory.expiry);

  return NextResponse.json({
    summary: { total_low_items: lowItems.length, total_suppliers_to_contact: Object.keys(bySupplier).length, total_reorder_value: lowItems.reduce((s,i)=>s+Number(i.qty_to_order)*i.cost,0), expiring_count: expiringItems.length },
    bySupplier: Object.values(bySupplier),
    expiringItems, lowItems,
  });
}
