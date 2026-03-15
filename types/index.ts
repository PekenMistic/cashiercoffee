export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  category: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: number;
  unit: string;
  stock: number;
  minStock: number;
  maxStock: number;
  cost: number;
  supplier: number | null;
  expiry: string;
  notes: string;
}

export interface Transaction {
  id: number;
  type: 'in' | 'out';
  itemId: number;
  qty: number;
  price: number;
  source: string;
  note: string;
  date: string;
}

export type StockStatus = 'ok' | 'low' | 'critical';
export type PageName = 'dashboard' | 'inventory' | 'transactions' | 'suppliers' | 'reports' | 'categories';
