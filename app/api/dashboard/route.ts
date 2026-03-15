import { NextResponse } from 'next/server';
import { db } from '@/db';
import { initDb } from '@/lib/init';
import { orders, orderItems, inventory, categories, employees, shifts } from '@/db/schema';
import { eq, lt, sql, desc, and } from 'drizzle-orm';

export async function GET() {
  await initDb();

  const todayStr = new Date().toISOString().split('T')[0];
  const ystStr   = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const [todaySales] = await db.select({
    orders:  sql<number>`count(*)`,
    revenue: sql<number>`coalesce(sum(total),0)`,
    avg:     sql<number>`coalesce(avg(total),0)`,
  }).from(orders).where(sql`DATE(created_at) = ${todayStr}`);

  const [ystSales] = await db.select({
    orders:  sql<number>`count(*)`,
    revenue: sql<number>`coalesce(sum(total),0)`,
  }).from(orders).where(sql`DATE(created_at) = ${ystStr}`);

  const allInv = await db.select({ id: inventory.id, stock: inventory.stock, min_stock: inventory.min_stock, expiry: inventory.expiry }).from(inventory);
  const now7 = Date.now() + 7 * 86400000;
  const invAlerts = {
    low:      allInv.filter(i => i.stock > 0 && i.stock < i.min_stock).length,
    critical: allInv.filter(i => i.stock <= i.min_stock * 0.5).length,
    expiring: allInv.filter(i => { if (!i.expiry) return false; const t = new Date(i.expiry).getTime(); return t >= Date.now() && t <= now7; }).length,
  };

  const [invValue] = await db.select({
    total: sql<number>`coalesce(sum(stock * cost),0)`,
    items: sql<number>`count(*)`,
  }).from(inventory);

  const todayShifts = await db.select({ status: shifts.status }).from(shifts).where(eq(shifts.date, todayStr));
  const activeShifts = { active: todayShifts.filter(s => s.status === 'active').length, total: todayShifts.length };

  const [empCount] = await db.select({ count: sql<number>`count(*)` }).from(employees).where(eq(employees.status, 'active'));

  const recentOrders = await db.select({
    id: orders.id, order_no: orders.order_no, total: orders.total,
    payment_method: orders.payment_method, created_at: orders.created_at,
    cashier_name: employees.name,
  }).from(orders).leftJoin(employees, eq(orders.cashier_id, employees.id)).orderBy(desc(orders.id)).limit(5);

  const weekRevenue: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const [r] = await db.select({ revenue: sql<number>`coalesce(sum(total),0)` }).from(orders).where(sql`DATE(created_at) = ${ds}`);
    weekRevenue.push({ date: ds, revenue: Number(r?.revenue ?? 0) });
  }

  const lowStockItems = await db.select({
    id: inventory.id, name: inventory.name, stock: inventory.stock,
    min_stock: inventory.min_stock, unit: inventory.unit, category_name: categories.name,
  }).from(inventory)
    .leftJoin(categories, eq(inventory.category_id, categories.id))
    .where(lt(inventory.stock, inventory.min_stock))
    .orderBy(sql`CAST(inventory.stock AS REAL) / NULLIF(CAST(inventory.min_stock AS REAL), 0) ASC`)
    .limit(5);

  const topMenuToday = await db.select({
    name: orderItems.name,
    qty:  sql<number>`sum(order_items.qty)`,
    revenue: sql<number>`sum(order_items.subtotal)`,
  }).from(orderItems)
    .innerJoin(orders, and(eq(orderItems.order_id, orders.id), sql`DATE(orders.created_at) = ${todayStr}`))
    .groupBy(orderItems.name)
    .orderBy(sql`sum(order_items.qty) DESC`)
    .limit(5);

  return NextResponse.json({
    todaySales:      { orders: Number(todaySales?.orders??0), revenue: Number(todaySales?.revenue??0), avg: Number(todaySales?.avg??0) },
    yesterdaySales:  { orders: Number(ystSales?.orders??0), revenue: Number(ystSales?.revenue??0) },
    inventoryAlerts: invAlerts,
    inventoryValue:  { total: Number(invValue?.total??0), items: Number(invValue?.items??0) },
    activeShifts,
    activeEmployees: { count: Number(empCount?.count??0) },
    recentOrders,
    weekRevenue,
    lowStockItems,
    topMenuToday,
  });
}
