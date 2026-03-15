/**
 * Seed script — run once with: npm run db:seed
 * Also called automatically on first app start if DB is empty.
 */
import { db } from './index';
import { ensureSchema } from './migrate';
import {
  categories, suppliers, inventory, employees, menuItems,
  shifts, orders, orderItems, recipes, stockTransactions,
} from './schema';
import { sql } from 'drizzle-orm';

export async function seedIfEmpty() {
  await ensureSchema();
  const rows = await db.select({ n: sql<number>`count(*)` }).from(categories);
  if (Number(rows[0]?.n) > 0) return; // already seeded
  console.log('🌱 First run — seeding demo data…');
  await runSeed();
  console.log('✅ Seed complete');
}

export async function runSeed() {
  // Ensure schema exists first
  const { ensureSchema } = await import('./migrate');
  await ensureSchema();

  // Wipe existing data
  await db.run(sql`DELETE FROM purchase_order_items`);
  await db.run(sql`DELETE FROM purchase_orders`);
  await db.run(sql`DELETE FROM recipes`);
  await db.run(sql`DELETE FROM order_items`);
  await db.run(sql`DELETE FROM orders`);
  await db.run(sql`DELETE FROM shifts`);
  await db.run(sql`DELETE FROM stock_transactions`);
  await db.run(sql`DELETE FROM inventory`);
  await db.run(sql`DELETE FROM menu_items`);
  await db.run(sql`DELETE FROM employees`);
  await db.run(sql`DELETE FROM suppliers`);
  await db.run(sql`DELETE FROM categories`);

  // ── Categories ──────────────────────────────────────────────────────────
  const cats = await db.insert(categories).values([
    { name: 'Coffee Beans',     icon: '☕', color: 'bg-amber-100 text-amber-800' },
    { name: 'Dairy & Milk',     icon: '🥛', color: 'bg-blue-100 text-blue-700' },
    { name: 'Syrups & Sauces',  icon: '🧴', color: 'bg-green-100 text-green-700' },
    { name: 'Cups & Packaging', icon: '📦', color: 'bg-yellow-100 text-yellow-700' },
    { name: 'Tea & Beverages',  icon: '🍵', color: 'bg-purple-100 text-purple-700' },
    { name: 'Equipment',        icon: '⚙️', color: 'bg-red-100 text-red-700' },
  ]).returning();
  const [c1,,,,c5] = cats;

  // ── Suppliers ────────────────────────────────────────────────────────────
  const sups = await db.insert(suppliers).values([
    { name: 'Java Highland Beans Co.', contact: 'Budi Santoso', phone: '+62 812-3456-7890', email: 'budi@javabeans.id', category: 'Coffee Beans' },
    { name: 'Fresh Dairy Indo',         contact: 'Sari Dewi',    phone: '+62 813-2345-6789', email: 'sari@freshdairy.id', category: 'Dairy & Milk' },
    { name: 'Monin Distributor',        contact: 'Ahmad',        phone: '+62 811-9876-5432', email: 'ahmad@monin.id',    category: 'Syrups' },
    { name: 'PackagingPlus',            contact: 'Linda',        phone: '+62 877-4455-6677', email: 'linda@packplus.id', category: 'Packaging' },
  ]).returning();
  const [s1, s2, s3, s4] = sups;

  // ── Inventory ─────────────────────────────────────────────────────────────
  const inv = await db.insert(inventory).values([
    { name: 'Arabica Gayo Beans',   category_id: c1.id, unit: 'kg',     stock: 8,   min_stock: 10,  max_stock: 50,   cost: 120000, supplier_id: s1.id, expiry: '2026-06-30', notes: 'Single origin Aceh Gayo' },
    { name: 'Robusta Toraja Beans', category_id: c1.id, unit: 'kg',     stock: 22,  min_stock: 10,  max_stock: 50,   cost: 85000,  supplier_id: s1.id, expiry: '2026-07-15', notes: '' },
    { name: 'Espresso Blend',       category_id: c1.id, unit: 'kg',     stock: 3,   min_stock: 10,  max_stock: 30,   cost: 110000, supplier_id: s1.id, expiry: '2026-05-30', notes: 'Urgent reorder needed' },
    { name: 'Full Cream Milk',      category_id: cats[1].id, unit: 'liter',  stock: 45,  min_stock: 20,  max_stock: 100,  cost: 14000,  supplier_id: s2.id, expiry: '2026-04-20', notes: '' },
    { name: 'Oat Milk',             category_id: cats[1].id, unit: 'liter',  stock: 12,  min_stock: 15,  max_stock: 60,   cost: 32000,  supplier_id: s2.id, expiry: '2026-05-01', notes: '' },
    { name: 'Vanilla Syrup',        category_id: cats[2].id, unit: 'bottle', stock: 6,   min_stock: 5,   max_stock: 20,   cost: 95000,  supplier_id: s3.id, expiry: '2027-01-01', notes: '' },
    { name: 'Caramel Syrup',        category_id: cats[2].id, unit: 'bottle', stock: 4,   min_stock: 5,   max_stock: 20,   cost: 95000,  supplier_id: s3.id, expiry: '2027-01-01', notes: '' },
    { name: 'Hot Paper Cup 12oz',   category_id: cats[3].id, unit: 'pcs',    stock: 320, min_stock: 200, max_stock: 1000, cost: 1200,   supplier_id: s4.id, expiry: '',           notes: '' },
    { name: 'Cold Cup 16oz',        category_id: cats[3].id, unit: 'pcs',    stock: 180, min_stock: 150, max_stock: 800,  cost: 1500,   supplier_id: s4.id, expiry: '',           notes: '' },
    { name: 'Chamomile Tea Bags',   category_id: c5.id, unit: 'box',    stock: 8,   min_stock: 5,   max_stock: 30,   cost: 45000,  supplier_id: s2.id, expiry: '2026-12-31', notes: '' },
    { name: 'Green Tea Powder',     category_id: c5.id, unit: 'kg',     stock: 1.5, min_stock: 2,   max_stock: 10,   cost: 180000, supplier_id: s2.id, expiry: '2026-09-01', notes: '' },
  ]).returning();
  const [i1,,i3,i4,,,,i8,i9,i10,i11] = inv;

  // ── Employees ─────────────────────────────────────────────────────────────
  const emps = await db.insert(employees).values([
    { name: 'Andi Pratama',  role: 'Barista',    phone: '+62 812-0001-0001', email: 'andi@brew.id',  pin: '1234', hourly_rate: 25000, status: 'active' as const },
    { name: 'Siti Rahayu',   role: 'Kasir',      phone: '+62 812-0002-0002', email: 'siti@brew.id',  pin: '2345', hourly_rate: 22000, status: 'active' as const },
    { name: 'Bowo Santoso',  role: 'Barista',    phone: '+62 812-0003-0003', email: 'bowo@brew.id',  pin: '3456', hourly_rate: 25000, status: 'active' as const },
    { name: 'Maya Kusuma',   role: 'Supervisor', phone: '+62 812-0004-0004', email: 'maya@brew.id',  pin: '4567', hourly_rate: 35000, status: 'active' as const },
    { name: 'Rizky Fadli',   role: 'Kasir',      phone: '+62 812-0005-0005', email: 'rizky@brew.id', pin: '5678', hourly_rate: 22000, status: 'inactive' as const },
  ]).returning();
  const [e1, e2,, e4] = emps;

  // ── Menu Items ─────────────────────────────────────────────────────────────
  const menus = await db.insert(menuItems).values([
    { name: 'Espresso',       category: 'Coffee',     price: 18000, cost: 5000,  image_emoji: '☕', is_available: true, description: 'Single shot espresso' },
    { name: 'Americano',      category: 'Coffee',     price: 22000, cost: 6000,  image_emoji: '☕', is_available: true, description: 'Espresso + hot water' },
    { name: 'Cappuccino',     category: 'Coffee',     price: 28000, cost: 8000,  image_emoji: '🥛', is_available: true, description: 'Espresso + steamed milk foam' },
    { name: 'Latte',          category: 'Coffee',     price: 30000, cost: 8500,  image_emoji: '☕', is_available: true, description: 'Espresso + steamed milk' },
    { name: 'V60 Pour Over',  category: 'Coffee',     price: 35000, cost: 12000, image_emoji: '☕', is_available: true, description: 'Manual brew pour over' },
    { name: 'Cold Brew',      category: 'Coffee',     price: 32000, cost: 9000,  image_emoji: '🧊', is_available: true, description: 'Cold steeped 12h' },
    { name: 'Matcha Latte',   category: 'Non-Coffee', price: 32000, cost: 10000, image_emoji: '🍵', is_available: true, description: 'Japanese matcha with milk' },
    { name: 'Teh Tarik',      category: 'Non-Coffee', price: 18000, cost: 4000,  image_emoji: '🍵', is_available: true, description: 'Pulled milk tea' },
    { name: 'Lemon Tea',      category: 'Non-Coffee', price: 20000, cost: 3000,  image_emoji: '🍋', is_available: true, description: 'Iced lemon tea' },
    { name: 'Cokelat Susu',   category: 'Non-Coffee', price: 25000, cost: 6000,  image_emoji: '🍫', is_available: true, description: 'Hot chocolate milk' },
    { name: 'Croissant',      category: 'Food',       price: 22000, cost: 8000,  image_emoji: '🥐', is_available: true, description: 'French croissant' },
    { name: 'Roti Bakar',     category: 'Food',       price: 18000, cost: 5000,  image_emoji: '🍞', is_available: true, description: 'Toasted bread with jam' },
    { name: 'Banana Cake',    category: 'Food',       price: 25000, cost: 9000,  image_emoji: '🍰', is_available: true, description: 'Homemade banana cake' },
    { name: 'Kentang Goreng', category: 'Food',       price: 20000, cost: 6000,  image_emoji: '🍟', is_available: true, description: 'Crispy french fries' },
  ]).returning();
  const [m1,m2,m3,m4,m5,m6,m7,m8,m9,m10] = menus;

  // ── Recipes (BOM) ──────────────────────────────────────────────────────────
  await db.insert(recipes).values([
    { menu_item_id: m1.id, inventory_item_id: i3.id,  qty_used: 0.018, unit: 'kg',    notes: '18g espresso blend' },
    { menu_item_id: m1.id, inventory_item_id: i8.id,  qty_used: 1,     unit: 'pcs',   notes: 'Hot cup 12oz' },
    { menu_item_id: m2.id, inventory_item_id: i3.id,  qty_used: 0.018, unit: 'kg',    notes: '18g espresso blend' },
    { menu_item_id: m2.id, inventory_item_id: i8.id,  qty_used: 1,     unit: 'pcs',   notes: 'Hot cup 12oz' },
    { menu_item_id: m3.id, inventory_item_id: i3.id,  qty_used: 0.018, unit: 'kg',    notes: 'Espresso blend' },
    { menu_item_id: m3.id, inventory_item_id: i4.id,  qty_used: 0.12,  unit: 'liter', notes: 'Full cream 120ml' },
    { menu_item_id: m3.id, inventory_item_id: i8.id,  qty_used: 1,     unit: 'pcs',   notes: 'Hot cup 12oz' },
    { menu_item_id: m4.id, inventory_item_id: i3.id,  qty_used: 0.018, unit: 'kg',    notes: 'Espresso blend' },
    { menu_item_id: m4.id, inventory_item_id: i4.id,  qty_used: 0.18,  unit: 'liter', notes: 'Full cream 180ml' },
    { menu_item_id: m4.id, inventory_item_id: i8.id,  qty_used: 1,     unit: 'pcs',   notes: 'Hot cup 12oz' },
    { menu_item_id: m5.id, inventory_item_id: i1.id,  qty_used: 0.022, unit: 'kg',    notes: 'Arabica Gayo 22g' },
    { menu_item_id: m5.id, inventory_item_id: i8.id,  qty_used: 1,     unit: 'pcs',   notes: 'Hot cup 12oz' },
    { menu_item_id: m6.id, inventory_item_id: i3.id,  qty_used: 0.025, unit: 'kg',    notes: 'Espresso blend 25g' },
    { menu_item_id: m6.id, inventory_item_id: i9.id,  qty_used: 1,     unit: 'pcs',   notes: 'Cold cup 16oz' },
    { menu_item_id: m7.id, inventory_item_id: i11.id, qty_used: 0.008, unit: 'kg',    notes: 'Green tea powder 8g' },
    { menu_item_id: m7.id, inventory_item_id: i4.id,  qty_used: 0.18,  unit: 'liter', notes: 'Full cream 180ml' },
    { menu_item_id: m7.id, inventory_item_id: i9.id,  qty_used: 1,     unit: 'pcs',   notes: 'Cold cup 16oz' },
    { menu_item_id: m8.id, inventory_item_id: i10.id, qty_used: 0.05,  unit: 'box',   notes: '~1 tea bag' },
    { menu_item_id: m8.id, inventory_item_id: i4.id,  qty_used: 0.15,  unit: 'liter', notes: 'Full cream 150ml' },
    { menu_item_id: m8.id, inventory_item_id: i8.id,  qty_used: 1,     unit: 'pcs',   notes: 'Hot cup 12oz' },
    { menu_item_id: m9.id, inventory_item_id: i10.id, qty_used: 0.05,  unit: 'box',   notes: '~1 tea bag' },
    { menu_item_id: m9.id, inventory_item_id: i9.id,  qty_used: 1,     unit: 'pcs',   notes: 'Cold cup 16oz' },
    { menu_item_id: m10.id, inventory_item_id: i4.id, qty_used: 0.20,  unit: 'liter', notes: 'Full cream 200ml' },
    { menu_item_id: m10.id, inventory_item_id: i8.id, qty_used: 1,     unit: 'pcs',   notes: 'Hot cup 12oz' },
  ]);

  // ── Shifts ──────────────────────────────────────────────────────────────────
  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  await db.insert(shifts).values([
    { employee_id: e1.id, date: today,     shift_type: 'morning'   as const, clock_in: '07:00', clock_out: null,    hours_worked: 0,   status: 'active'    as const },
    { employee_id: e2.id, date: today,     shift_type: 'morning'   as const, clock_in: '07:05', clock_out: null,    hours_worked: 0,   status: 'active'    as const },
    { employee_id: e4.id, date: today,     shift_type: 'afternoon' as const, clock_in: null,    clock_out: null,    hours_worked: 0,   status: 'scheduled' as const },
    { employee_id: e1.id, date: yesterday, shift_type: 'morning'   as const, clock_in: '07:00', clock_out: '15:00', hours_worked: 8,   status: 'completed' as const },
    { employee_id: e2.id, date: yesterday, shift_type: 'morning'   as const, clock_in: '07:10', clock_out: '15:05', hours_worked: 7.9, status: 'completed' as const },
  ]);

  // ── Seed transactions ─────────────────────────────────────────────────────
  await db.insert(stockTransactions).values([
    { type: 'in' as const,  item_id: i1.id, qty: 20,  price: 120000, source: 'Java Highland Beans Co.', note: 'Monthly restock',   date: daysAgo(25) },
    { type: 'out' as const, item_id: i4.id, qty: 10,  price: 14000,  source: 'Kitchen',                 note: 'Morning shift',     date: daysAgo(10) },
    { type: 'in' as const,  item_id: i8.id, qty: 500, price: 1200,   source: 'PackagingPlus',            note: '',                  date: daysAgo(15) },
    { type: 'out' as const, item_id: i1.id, qty: 5,   price: 0,      source: 'Kitchen',                 note: 'Week use',          date: daysAgo(9) },
    { type: 'out' as const, item_id: i3.id, qty: 4,   price: 0,      source: 'Kitchen',                 note: '',                  date: daysAgo(8) },
  ]);

  // ── 30-day demo orders ─────────────────────────────────────────────────────
  const menuPrices: Record<number, number> = {};
  for (const m of menus) menuPrices[m.id] = m.price;

  const cashiers = [e1.id, e2.id, e4.id];
  const pays: Array<'cash'|'card'|'qris'> = ['cash','cash','cash','qris','card'];

  let seq = 1;
  for (let d = 29; d >= 0; d--) {
    const numOrders = 4 + Math.floor(Math.random() * 8);
    for (let j = 0; j < numOrders; j++) {
      const h   = 7 + Math.floor(Math.random() * 13);
      const min = Math.floor(Math.random() * 60);
      const dt  = new Date();
      dt.setDate(dt.getDate() - d);
      dt.setHours(h, min, 0, 0);
      const dtStr = dt.toISOString().replace('T', ' ').slice(0, 19);

      const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
      const pay     = pays[Math.floor(Math.random() * pays.length)];
      const itemCnt = 1 + Math.floor(Math.random() * 3);
      let sub = 0;
      const lineItems: Array<{ menuId: number; qty: number }> = [];
      for (let k = 0; k < itemCnt; k++) {
        const mi  = menus[Math.floor(Math.random() * menus.length)];
        const qty = 1 + Math.floor(Math.random() * 2);
        lineItems.push({ menuId: mi.id, qty });
        sub += menuPrices[mi.id] * qty;
      }
      const disc  = Math.random() < 0.12 ? 5000 : 0;
      const tax   = Math.round((sub - disc) * 0.1);
      const total = sub - disc + tax;

      const [ord] = await db.insert(orders).values({
        order_no: `ORD-${String(seq++).padStart(6,'0')}`,
        cashier_id: cashier, subtotal: sub, discount: disc,
        tax, total, payment_method: pay,
        amount_paid: total, change_amount: 0,
        created_at: dtStr,
      }).returning();

      await db.insert(orderItems).values(
        lineItems.map(li => ({
          order_id: ord.id, menu_item_id: li.menuId,
          name: menus.find(m => m.id === li.menuId)!.name,
          qty: li.qty, price: menuPrices[li.menuId],
          subtotal: menuPrices[li.menuId] * li.qty,
        }))
      );
    }
  }
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}

// Run directly: npm run db:seed
if (require.main === module) {
  runSeed()
    .then(() => { console.log('✅ Seed complete'); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); });
}
