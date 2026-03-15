import {
  sqliteTable as table, integer, text, real
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// ── Tables ────────────────────────────────────────────────────────────────
export const categories = table('categories', {
  id:    integer('id').primaryKey({ autoIncrement: true }),
  name:  text('name').notNull(),
  icon:  text('icon').notNull().default('📦'),
  color: text('color').notNull().default('bg-blue-100 text-blue-700'),
});

export const suppliers = table('suppliers', {
  id:       integer('id').primaryKey({ autoIncrement: true }),
  name:     text('name').notNull(),
  contact:  text('contact').notNull().default(''),
  phone:    text('phone').notNull().default(''),
  email:    text('email').notNull().default(''),
  category: text('category').notNull().default(''),
});

export const inventory = table('inventory', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  name:        text('name').notNull(),
  category_id: integer('category_id').references(() => categories.id),
  unit:        text('unit').notNull().default('pcs'),
  stock:       real('stock').notNull().default(0),
  min_stock:   real('min_stock').notNull().default(0),
  max_stock:   real('max_stock').notNull().default(100),
  cost:        real('cost').notNull().default(0),
  supplier_id: integer('supplier_id').references(() => suppliers.id),
  expiry:      text('expiry').notNull().default(''),
  notes:       text('notes').notNull().default(''),
});

export const stockTransactions = table('stock_transactions', {
  id:      integer('id').primaryKey({ autoIncrement: true }),
  type:    text('type', { enum: ['in', 'out'] }).notNull(),
  item_id: integer('item_id').references(() => inventory.id).notNull(),
  qty:     real('qty').notNull(),
  price:   real('price').notNull().default(0),
  source:  text('source').notNull().default(''),
  note:    text('note').notNull().default(''),
  date:    text('date').notNull(),
});

export const employees = table('employees', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  name:        text('name').notNull(),
  role:        text('role').notNull(),
  phone:       text('phone').notNull().default(''),
  email:       text('email').notNull().default(''),
  pin:         text('pin').notNull().default(''),
  hourly_rate: real('hourly_rate').notNull().default(0),
  status:      text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
});

export const shifts = table('shifts', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  employee_id:  integer('employee_id').references(() => employees.id).notNull(),
  date:         text('date').notNull(),
  shift_type:   text('shift_type', { enum: ['morning', 'afternoon', 'evening', 'full'] }).notNull(),
  clock_in:     text('clock_in'),
  clock_out:    text('clock_out'),
  hours_worked: real('hours_worked').notNull().default(0),
  notes:        text('notes').notNull().default(''),
  status:       text('status', { enum: ['scheduled', 'active', 'completed', 'absent'] }).notNull().default('scheduled'),
});

export const menuItems = table('menu_items', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  name:         text('name').notNull(),
  category:     text('category').notNull(),
  price:        real('price').notNull(),
  cost:         real('cost').notNull().default(0),
  image_emoji:  text('image_emoji').notNull().default('☕'),
  is_available: integer('is_available', { mode: 'boolean' }).notNull().default(true),
  description:  text('description').notNull().default(''),
});

export const orders = table('orders', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  order_no:       text('order_no').unique().notNull(),
  cashier_id:     integer('cashier_id').references(() => employees.id),
  subtotal:       real('subtotal').notNull().default(0),
  discount:       real('discount').notNull().default(0),
  tax:            real('tax').notNull().default(0),
  total:          real('total').notNull().default(0),
  payment_method: text('payment_method', { enum: ['cash', 'card', 'qris'] }).notNull().default('cash'),
  amount_paid:    real('amount_paid').notNull().default(0),
  change_amount:  real('change_amount').notNull().default(0),
  status:         text('status').notNull().default('completed'),
  table_no:       text('table_no').notNull().default(''),
  source:         text('source', { enum: ['pos', 'qr'] }).notNull().default('pos'),
  notes:          text('notes').notNull().default(''),
  created_at:     text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const orderItems = table('order_items', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  order_id:     integer('order_id').references(() => orders.id).notNull(),
  menu_item_id: integer('menu_item_id').references(() => menuItems.id).notNull(),
  name:         text('name').notNull(),
  qty:          integer('qty').notNull(),
  price:        real('price').notNull(),
  subtotal:     real('subtotal').notNull(),
});

export const recipes = table('recipes', {
  id:                integer('id').primaryKey({ autoIncrement: true }),
  menu_item_id:      integer('menu_item_id').references(() => menuItems.id).notNull(),
  inventory_item_id: integer('inventory_item_id').references(() => inventory.id).notNull(),
  qty_used:          real('qty_used').notNull(),
  unit:              text('unit').notNull().default('unit'),
  notes:             text('notes').notNull().default(''),
});

export const purchaseOrders = table('purchase_orders', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  po_no:       text('po_no').unique().notNull(),
  supplier_id: integer('supplier_id').references(() => suppliers.id),
  status:      text('status', { enum: ['draft', 'sent', 'received', 'cancelled'] }).notNull().default('draft'),
  notes:       text('notes').notNull().default(''),
  created_at:  text('created_at').notNull().default(sql`(datetime('now'))`),
  sent_at:     text('sent_at'),
  received_at: text('received_at'),
  total_value: real('total_value').notNull().default(0),
});

export const purchaseOrderItems = table('purchase_order_items', {
  id:                integer('id').primaryKey({ autoIncrement: true }),
  po_id:             integer('po_id').references(() => purchaseOrders.id).notNull(),
  inventory_item_id: integer('inventory_item_id').references(() => inventory.id).notNull(),
  item_name:         text('item_name').notNull(),
  qty_ordered:       real('qty_ordered').notNull(),
  qty_received:      real('qty_received').notNull().default(0),
  unit:              text('unit').notNull(),
  unit_cost:         real('unit_cost').notNull().default(0),
  subtotal:          real('subtotal').notNull().default(0),
});

// ── Relations ────────────────────────────────────────────────────────────
export const inventoryRelations = relations(inventory, ({ one }) => ({
  category: one(categories, { fields: [inventory.category_id], references: [categories.id] }),
  supplier: one(suppliers,  { fields: [inventory.supplier_id], references: [suppliers.id] }),
}));
export const orderRelations = relations(orders, ({ one, many }) => ({
  cashier: one(employees, { fields: [orders.cashier_id], references: [employees.id] }),
  items:   many(orderItems),
}));
export const shiftRelations = relations(shifts, ({ one }) => ({
  employee: one(employees, { fields: [shifts.employee_id], references: [employees.id] }),
}));
export const recipeRelations = relations(recipes, ({ one }) => ({
  menuItem:      one(menuItems,  { fields: [recipes.menu_item_id],        references: [menuItems.id] }),
  inventoryItem: one(inventory,  { fields: [recipes.inventory_item_id],   references: [inventory.id] }),
}));
