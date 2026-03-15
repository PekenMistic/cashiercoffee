import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { initDb } from '@/lib/init';
import { orders, orderItems, inventory, shifts, employees } from '@/db/schema';
import { sql, and, eq, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  await initDb();
  const period = new URL(req.url).searchParams.get('period') || 'month';
  const now = new Date();
  let dateFrom: string | null = null;
  if (period === 'today') dateFrom = now.toISOString().split('T')[0];
  else if (period === 'week')  { const d = new Date(now); d.setDate(d.getDate()-6);  dateFrom = d.toISOString().split('T')[0]; }
  else if (period === 'month') { const d = new Date(now); d.setDate(d.getDate()-29); dateFrom = d.toISOString().split('T')[0]; }

  const cond = dateFrom ? sql`DATE(created_at) >= ${dateFrom}` : undefined;

  const [orderSummary] = await db.select({
    total_orders:    sql<number>`count(*)`,
    total_revenue:   sql<number>`coalesce(sum(total),0)`,
    total_discount:  sql<number>`coalesce(sum(discount),0)`,
    avg_order_value: sql<number>`coalesce(avg(total),0)`,
  }).from(orders).where(cond);

  // Revenue by day
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const revenueByDay: { date: string; revenue: number; orders: number }[] = [];
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate()-i);
    const ds = d.toISOString().split('T')[0];
    const [r] = await db.select({
      revenue: sql<number>`coalesce(sum(total),0)`,
      cnt:     sql<number>`count(*)`,
    }).from(orders).where(sql`DATE(created_at) = ${ds}`);
    revenueByDay.push({ date: ds, revenue: Number(r?.revenue??0), orders: Number(r?.cnt??0) });
  }

  // Top products
  const topQ = db.select({
    name:    orderItems.name,
    qty:     sql<number>`sum(order_items.qty)`,
    revenue: sql<number>`sum(order_items.subtotal)`,
  }).from(orderItems).innerJoin(orders, eq(orderItems.order_id, orders.id))
    .groupBy(orderItems.name).orderBy(sql`sum(order_items.qty) desc`).limit(10);
  const topProducts = cond ? await topQ.where(cond) : await topQ;

  // Revenue by menu category
  const catQ = db.select({
    category: orderItems.name,
    revenue:  sql<number>`sum(order_items.subtotal)`,
    qty:      sql<number>`sum(order_items.qty)`,
  }).from(orderItems).innerJoin(orders, eq(orderItems.order_id, orders.id))
    .groupBy(orderItems.name).orderBy(sql`sum(order_items.subtotal) desc`).limit(6);
  const revenueByCategory = cond ? await catQ.where(cond) : await catQ;

  // Payment breakdown
  const payQ = db.select({
    payment_method: orders.payment_method,
    count: sql<number>`count(*)`,
    total: sql<number>`coalesce(sum(total),0)`,
  }).from(orders).groupBy(orders.payment_method).orderBy(sql`sum(total) desc`);
  const paymentBreakdown = cond ? await payQ.where(cond) : await payQ;

  // Cashier performance
  const cashQ = db.select({
    cashier_name:  sql<string>`coalesce(employees.name,'Unknown')`,
    total_orders:  sql<number>`count(orders.id)`,
    total_revenue: sql<number>`coalesce(sum(orders.total),0)`,
  }).from(orders).leftJoin(employees, eq(orders.cashier_id, employees.id))
    .groupBy(employees.name).orderBy(sql`sum(orders.total) desc`);
  const cashierPerformance = cond ? await cashQ.where(cond) : await cashQ;

  // Inventory stats
  const [inventoryStats] = await db.select({
    total_items:    sql<number>`count(*)`,
    total_value:    sql<number>`coalesce(sum(stock*cost),0)`,
    low_stock:      sql<number>`count(case when stock < min_stock and stock > 0 then 1 end)`,
    critical_stock: sql<number>`count(case when stock <= min_stock*0.5 then 1 end)`,
    out_of_stock:   sql<number>`count(case when stock <= 0 then 1 end)`,
  }).from(inventory);

  // Expiring items (14 days)
  const expiringItems = await db.select({ id: inventory.id, name: inventory.name, stock: inventory.stock, unit: inventory.unit, expiry: inventory.expiry })
    .from(inventory)
    .where(sql`expiry != '' AND expiry BETWEEN DATE('now') AND DATE('now', '+14 days')`)
    .orderBy(inventory.expiry);

  // Shift summary
  const shiftCond = dateFrom
    ? and(gte(shifts.date, dateFrom), eq(shifts.status, 'completed'))
    : eq(shifts.status, 'completed');
  const [shiftSummary] = await db.select({
    total_shifts: sql<number>`count(*)`,
    total_hours:  sql<number>`coalesce(sum(hours_worked),0)`,
    total_wage:   sql<number>`coalesce(sum(shifts.hours_worked * employees.hourly_rate),0)`,
  }).from(shifts).leftJoin(employees, eq(shifts.employee_id, employees.id)).where(shiftCond);

  const todayStr = now.toISOString().split('T')[0];
  const [todayStats] = await db.select({
    today_orders:  sql<number>`count(*)`,
    today_revenue: sql<number>`coalesce(sum(total),0)`,
  }).from(orders).where(sql`DATE(created_at) = ${todayStr}`);

  return NextResponse.json({
    period,
    orderSummary:       { total_orders: Number(orderSummary?.total_orders??0), total_revenue: Number(orderSummary?.total_revenue??0), total_discount: Number(orderSummary?.total_discount??0), avg_order_value: Number(orderSummary?.avg_order_value??0) },
    revenueByDay,
    topProducts,
    revenueByCategory,
    paymentBreakdown,
    cashierPerformance,
    inventoryStats:     { total_items: Number(inventoryStats?.total_items??0), total_value: Number(inventoryStats?.total_value??0), low_stock: Number(inventoryStats?.low_stock??0), critical_stock: Number(inventoryStats?.critical_stock??0), out_of_stock: Number(inventoryStats?.out_of_stock??0) },
    expiringItems,
    stockMovement: [],
    shiftSummary:       { total_shifts: Number(shiftSummary?.total_shifts??0), total_hours: Number(shiftSummary?.total_hours??0), total_wage: Number(shiftSummary?.total_wage??0) },
    todayStats:         { today_orders: Number(todayStats?.today_orders??0), today_revenue: Number(todayStats?.today_revenue??0) },
  });
}
