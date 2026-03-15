import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shifts, employees } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { initDb } from '@/lib/init';

export async function GET(req: NextRequest) {
  await initDb();
  const date = new URL(req.url).searchParams.get('date');
  const base = db.select({
    id: shifts.id, employee_id: shifts.employee_id, date: shifts.date,
    shift_type: shifts.shift_type, clock_in: shifts.clock_in, clock_out: shifts.clock_out,
    hours_worked: shifts.hours_worked, notes: shifts.notes, status: shifts.status,
    employee_name: employees.name, employee_role: employees.role, hourly_rate: employees.hourly_rate,
  }).from(shifts).leftJoin(employees, eq(shifts.employee_id, employees.id));
  const rows = date
    ? await base.where(eq(shifts.date, date)).orderBy(shifts.id)
    : await base.orderBy(desc(shifts.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await initDb();
  const { employee_id, date, shift_type, clock_in, clock_out, notes, status } = await req.json();
  const [row] = await db.insert(shifts).values({ employee_id, date, shift_type, clock_in: clock_in||null, clock_out: clock_out||null, notes: notes||'', status: status||'scheduled' }).returning();
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  await initDb();
  const body = await req.json();
  const { id, action } = body;
  const now = new Date().toTimeString().slice(0, 5);
  if (action === 'clockin') {
    await db.update(shifts).set({ clock_in: now, status: 'active' }).where(eq(shifts.id, id));
  } else if (action === 'clockout') {
    const [s] = await db.select({ clock_in: shifts.clock_in }).from(shifts).where(eq(shifts.id, id));
    let hours = 0;
    if (s?.clock_in) {
      const [ih, im] = s.clock_in.split(':').map(Number);
      const [oh, om] = now.split(':').map(Number);
      hours = Math.round(((oh * 60 + om) - (ih * 60 + im)) / 60 * 10) / 10;
    }
    await db.update(shifts).set({ clock_out: now, hours_worked: hours, status: 'completed' }).where(eq(shifts.id, id));
  } else if (action === 'absent') {
    await db.update(shifts).set({ status: 'absent' }).where(eq(shifts.id, id));
  } else {
    const { employee_id, date, shift_type, clock_in, clock_out, notes, status: st, hours_worked } = body;
    await db.update(shifts).set({ employee_id, date, shift_type, clock_in: clock_in||null, clock_out: clock_out||null, hours_worked: hours_worked||0, notes: notes||'', status: st||'scheduled' }).where(eq(shifts.id, id));
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await initDb();
  const { id } = await req.json();
  await db.delete(shifts).where(eq(shifts.id, id));
  return NextResponse.json({ ok: true });
}
