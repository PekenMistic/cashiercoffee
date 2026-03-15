import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employees, shifts, orders } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { initDb } from '@/lib/init';

export async function GET() {
  await initDb();
  return NextResponse.json(await db.select().from(employees).orderBy(employees.id));
}

export async function POST(req: NextRequest) {
  await initDb();
  const { name, role, phone, email, pin, hourly_rate, status } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nama wajib' }, { status: 400 });
  const [row] = await db.insert(employees).values({
    name: name.trim(), role, phone: phone||'', email: email||'',
    pin: pin||'', hourly_rate: hourly_rate||0, status: status||'active',
  }).returning();
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  await initDb();
  const { id, name, role, phone, email, pin, hourly_rate, status } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 });
  await db.update(employees).set({
    name, role, phone: phone||'', email: email||'',
    pin: pin||'', hourly_rate: hourly_rate||0, status: status||'active',
  }).where(eq(employees.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await initDb();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 });

  // Check if employee has orders (cashier history)
  const [ordRef] = await db.select({ n: count() }).from(orders).where(eq(orders.cashier_id, id));
  if (ordRef.n > 0) {
    // Soft delete — mark inactive instead
    await db.update(employees).set({ status: 'inactive' }).where(eq(employees.id, id));
    return NextResponse.json({ ok: true, soft: true, message: `Karyawan ditandai non-aktif (memiliki ${ordRef.n} riwayat order)` });
  }

  // Check shifts
  const [shiftRef] = await db.select({ n: count() }).from(shifts).where(eq(shifts.employee_id, id));
  if (shiftRef.n > 0) {
    await db.update(employees).set({ status: 'inactive' }).where(eq(employees.id, id));
    return NextResponse.json({ ok: true, soft: true, message: `Karyawan ditandai non-aktif (memiliki ${shiftRef.n} riwayat shift)` });
  }

  await db.delete(employees).where(eq(employees.id, id));
  return NextResponse.json({ ok: true });
}
