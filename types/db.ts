// DB-backed types (snake_case from SQLite)
export interface DBCategory {
  id: number; name: string; icon: string; color: string;
}

export interface DBSupplier {
  id: number; name: string; contact: string; phone: string; email: string; category: string;
}

export interface DBInventoryItem {
  id: number; name: string; category_id: number; unit: string; stock: number;
  min_stock: number; max_stock: number; cost: number; supplier_id: number | null;
  expiry: string; notes: string;
  category_name?: string; category_icon?: string; category_color?: string; supplier_name?: string;
}

export interface DBTransaction {
  id: number; type: 'in' | 'out'; item_id: number; qty: number; price: number;
  source: string; note: string; date: string; item_name?: string; item_unit?: string;
}

export interface DBEmployee {
  id: number; name: string; role: string; phone: string; email: string;
  pin: string; hourly_rate: number; status: 'active' | 'inactive';
}

export interface DBShift {
  id: number; employee_id: number; date: string;
  shift_type: 'morning' | 'afternoon' | 'evening' | 'full';
  clock_in: string | null; clock_out: string | null; hours_worked: number;
  notes: string; status: 'scheduled' | 'active' | 'completed' | 'absent';
  employee_name?: string; employee_role?: string; hourly_rate?: number;
}

export interface DBMenuItem {
  id: number; name: string; category: string; price: number; cost: number;
  image_emoji: string; is_available: number; description: string;
}

export interface DBOrderItem {
  id: number; order_id: number; menu_item_id: number;
  name: string; qty: number; price: number; subtotal: number;
}

export interface DBOrder {
  id: number; order_no: string; cashier_id: number | null;
  subtotal: number; discount: number; tax: number; total: number;
  payment_method: string; amount_paid: number; change_amount: number;
  status: string; table_no?: string; source?: string;
  notes: string; created_at: string;
  cashier_name?: string; item_count?: number; items?: DBOrderItem[];
}

export type PageName =
  | 'dashboard' | 'inventory' | 'transactions' | 'suppliers'
  | 'reports'   | 'categories'| 'employees'    | 'shifts'
  | 'payroll'   | 'purchase_orders' | 'recipes' | 'pos' | 'tables' | 'orders';
