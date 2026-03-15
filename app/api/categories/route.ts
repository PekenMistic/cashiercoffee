import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories, inventory } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { initDb } from '@/lib/init';

export async function GET() {
  await initDb();
  const rows = await db.select().from(categories).orderBy(categories.id);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await initDb();
  const { name, icon, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nama wajib' }, { status: 400 });
  const [row] = await db.insert(categories).values({ name: name.trim(), icon: icon || '📦', color: color || 'bg-blue-100 text-blue-700' }).returning();
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  await initDb();
  const { id, name, icon, color } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 });
  if (!name?.trim()) return NextResponse.json({ error: 'Nama wajib' }, { status: 400 });
  await db.update(categories).set({ name: name.trim(), icon: icon || '📦', color: color || 'bg-blue-100 text-blue-700' }).where(eq(categories.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await initDb();
  const { id } = await req.json();
  const [used] = await db.select({ count: count() }).from(inventory).where(eq(inventory.category_id, id));
  if (used.count > 0) return NextResponse.json({ error: 'Tidak bisa hapus: ada item inventori yang menggunakan kategori ini' }, { status: 400 });
  await db.delete(categories).where(eq(categories.id, id));
  return NextResponse.json({ ok: true });
}
