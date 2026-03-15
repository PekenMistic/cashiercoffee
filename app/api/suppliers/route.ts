import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { suppliers, inventory } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { initDb } from '@/lib/init';

export async function GET() {
  await initDb();
  return NextResponse.json(await db.select().from(suppliers).orderBy(suppliers.id));
}

export async function POST(req: NextRequest) {
  await initDb();
  const { name, contact, phone, email, category } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nama wajib' }, { status: 400 });
  const [row] = await db.insert(suppliers).values({
    name: name.trim(), contact: contact||'', phone: phone||'', email: email||'', category: category||'',
  }).returning();
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  await initDb();
  const { id, name, contact, phone, email, category } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 });
  await db.update(suppliers).set({
    name, contact: contact||'', phone: phone||'', email: email||'', category: category||'',
  }).where(eq(suppliers.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await initDb();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 });

  // Check if supplier is referenced by inventory items
  const [invRef] = await db.select({ n: count() }).from(inventory).where(eq(inventory.supplier_id, id));
  if (invRef.n > 0) {
    return NextResponse.json({
      error: `Tidak bisa hapus: ${invRef.n} item inventori menggunakan supplier ini. Pindahkan item ke supplier lain terlebih dahulu.`
    }, { status: 400 });
  }

  await db.delete(suppliers).where(eq(suppliers.id, id));
  return NextResponse.json({ ok: true });
}
