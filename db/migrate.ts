/**
 * Creates all tables in the SQLite DB if they don't exist yet.
 * Called automatically on first API request.
 */
import { db } from './index';
import { sql } from 'drizzle-orm';

export async function ensureSchema() {
  await db.run(sql`PRAGMA journal_mode = WAL`);
  await db.run(sql`PRAGMA foreign_keys = ON`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    icon  TEXT NOT NULL DEFAULT '📦',
    color TEXT NOT NULL DEFAULT 'bg-blue-100 text-blue-700'
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS suppliers (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    contact  TEXT NOT NULL DEFAULT '',
    phone    TEXT NOT NULL DEFAULT '',
    email    TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT ''
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS inventory (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    unit        TEXT NOT NULL DEFAULT 'pcs',
    stock       REAL NOT NULL DEFAULT 0,
    min_stock   REAL NOT NULL DEFAULT 0,
    max_stock   REAL NOT NULL DEFAULT 100,
    cost        REAL NOT NULL DEFAULT 0,
    supplier_id INTEGER REFERENCES suppliers(id),
    expiry      TEXT NOT NULL DEFAULT '',
    notes       TEXT NOT NULL DEFAULT ''
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS stock_transactions (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    type    TEXT NOT NULL CHECK(type IN ('in','out')),
    item_id INTEGER NOT NULL REFERENCES inventory(id),
    qty     REAL NOT NULL,
    price   REAL NOT NULL DEFAULT 0,
    source  TEXT NOT NULL DEFAULT '',
    note    TEXT NOT NULL DEFAULT '',
    date    TEXT NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS employees (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL,
    phone       TEXT NOT NULL DEFAULT '',
    email       TEXT NOT NULL DEFAULT '',
    pin         TEXT NOT NULL DEFAULT '',
    hourly_rate REAL NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive'))
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS shifts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id  INTEGER NOT NULL REFERENCES employees(id),
    date         TEXT NOT NULL,
    shift_type   TEXT NOT NULL CHECK(shift_type IN ('morning','afternoon','evening','full')),
    clock_in     TEXT,
    clock_out    TEXT,
    hours_worked REAL NOT NULL DEFAULT 0,
    notes        TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','active','completed','absent'))
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS menu_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL,
    price        REAL NOT NULL,
    cost         REAL NOT NULL DEFAULT 0,
    image_emoji  TEXT NOT NULL DEFAULT '☕',
    is_available INTEGER NOT NULL DEFAULT 1,
    description  TEXT NOT NULL DEFAULT ''
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no       TEXT UNIQUE NOT NULL,
    cashier_id     INTEGER REFERENCES employees(id),
    subtotal       REAL NOT NULL DEFAULT 0,
    discount       REAL NOT NULL DEFAULT 0,
    tax            REAL NOT NULL DEFAULT 0,
    total          REAL NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK(payment_method IN ('cash','card','qris')),
    amount_paid    REAL NOT NULL DEFAULT 0,
    change_amount  REAL NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'completed',
    table_no       TEXT NOT NULL DEFAULT '',
    source         TEXT NOT NULL DEFAULT 'pos',
    notes          TEXT NOT NULL DEFAULT '',
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS order_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id     INTEGER NOT NULL REFERENCES orders(id),
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
    name         TEXT NOT NULL,
    qty          INTEGER NOT NULL,
    price        REAL NOT NULL,
    subtotal     REAL NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS recipes (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id      INTEGER NOT NULL REFERENCES menu_items(id),
    inventory_item_id INTEGER NOT NULL REFERENCES inventory(id),
    qty_used          REAL NOT NULL,
    unit              TEXT NOT NULL DEFAULT 'unit',
    notes             TEXT NOT NULL DEFAULT ''
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS purchase_orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    po_no       TEXT UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    status      TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','received','cancelled')),
    notes       TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    sent_at     TEXT,
    received_at TEXT,
    total_value REAL NOT NULL DEFAULT 0
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS purchase_order_items (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id             INTEGER NOT NULL REFERENCES purchase_orders(id),
    inventory_item_id INTEGER NOT NULL REFERENCES inventory(id),
    item_name         TEXT NOT NULL,
    qty_ordered       REAL NOT NULL,
    qty_received      REAL NOT NULL DEFAULT 0,
    unit              TEXT NOT NULL,
    unit_cost         REAL NOT NULL DEFAULT 0,
    subtotal          REAL NOT NULL DEFAULT 0
  )`);
}
