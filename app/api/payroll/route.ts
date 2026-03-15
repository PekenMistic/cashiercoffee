import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { initDb } from '@/lib/init';
import { shifts, employees } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  await initDb();
  const month = new URL(req.url).searchParams.get('month') || new Date().toISOString().slice(0,7);
  const [y, m] = month.split('-').map(Number);
  const startDate = `${y}-${String(m).padStart(2,'0')}-01`;
  const endDate   = new Date(y, m, 0).toISOString().split('T')[0];

  const payroll = await db.select({
    employee_id:      employees.id,
    employee_name:    employees.name,
    role:             employees.role,
    hourly_rate:      employees.hourly_rate,
    total_shifts:     sql<number>`count(shifts.id)`,
    completed_shifts: sql<number>`count(case when shifts.status='completed' then 1 end)`,
    absent_shifts:    sql<number>`count(case when shifts.status='absent' then 1 end)`,
    total_hours:      sql<number>`coalesce(sum(case when shifts.status='completed' then shifts.hours_worked else 0 end),0)`,
    gross_wage:       sql<number>`coalesce(sum(case when shifts.status='completed' then shifts.hours_worked*employees.hourly_rate else 0 end),0)`,
  })
  .from(employees)
  .leftJoin(shifts, and(eq(shifts.employee_id, employees.id), gte(shifts.date, startDate), lte(shifts.date, endDate)))
  .where(eq(employees.status,'active'))
  .groupBy(employees.id)
  .orderBy(employees.name);

  const [totals] = await db.select({
    total_gross:  sql<number>`coalesce(sum(case when shifts.status='completed' then shifts.hours_worked*employees.hourly_rate else 0 end),0)`,
    total_hours:  sql<number>`coalesce(sum(case when shifts.status='completed' then shifts.hours_worked else 0 end),0)`,
    total_shifts: sql<number>`count(case when shifts.status='completed' then 1 end)`,
  }).from(shifts).leftJoin(employees, eq(shifts.employee_id, employees.id))
    .where(and(gte(shifts.date, startDate), lte(shifts.date, endDate)));

  const avail = await db.selectDistinct({ month: sql<string>`strftime('%Y-%m', date)` })
    .from(shifts).orderBy(sql`1 desc`).limit(12);

  return NextResponse.json({
    month, startDate, endDate,
    payroll: payroll.map(p => ({ ...p, total_shifts: Number(p.total_shifts), completed_shifts: Number(p.completed_shifts), absent_shifts: Number(p.absent_shifts), total_hours: Number(p.total_hours), gross_wage: Number(p.gross_wage) })),
    totals: totals ? { total_gross: Number(totals.total_gross), total_hours: Number(totals.total_hours), total_shifts: Number(totals.total_shifts) } : { total_gross:0, total_hours:0, total_shifts:0 },
    availableMonths: avail.map(r => r.month),
  });
}
