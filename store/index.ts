import { create } from 'zustand';
import { Category, Supplier, InventoryItem, Transaction, StockStatus } from '@/types';

interface DBState {
  categories: Category[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  transactions: Transaction[];
  nextItemId: number;
  nextTxnId: number;
  nextSupplierId: number;
  nextCatId: number;

  // Actions
  addCategory: (cat: Omit<Category, 'id'>) => void;
  deleteCategory: (id: number) => void;

  addSupplier: (s: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: number, s: Partial<Supplier>) => void;
  deleteSupplier: (id: number) => void;

  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateItem: (id: number, item: Partial<InventoryItem>) => void;
  deleteItem: (id: number) => void;

  addTransaction: (txn: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: number) => void;
}

const initialCategories: Category[] = [
  { id: 1, name: 'Coffee Beans', icon: '☕', color: 'bg-amber-100 text-amber-800' },
  { id: 2, name: 'Dairy & Milk', icon: '🥛', color: 'bg-blue-100 text-blue-700' },
  { id: 3, name: 'Syrups & Sauces', icon: '🧴', color: 'bg-green-100 text-green-700' },
  { id: 4, name: 'Cups & Packaging', icon: '📦', color: 'bg-yellow-100 text-yellow-700' },
  { id: 5, name: 'Tea & Beverages', icon: '🍵', color: 'bg-purple-100 text-purple-700' },
  { id: 6, name: 'Equipment', icon: '⚙️', color: 'bg-red-100 text-red-700' },
];

const initialSuppliers: Supplier[] = [
  { id: 1, name: 'Java Highland Beans Co.', contact: 'Budi Santoso', phone: '+62 812-3456-7890', email: 'budi@javabeans.id', category: 'Coffee Beans' },
  { id: 2, name: 'Fresh Dairy Indo', contact: 'Sari Dewi', phone: '+62 813-2345-6789', email: 'sari@freshdairy.id', category: 'Dairy & Milk' },
  { id: 3, name: 'Monin Distributor', contact: 'Ahmad', phone: '+62 811-9876-5432', email: 'ahmad@monin.id', category: 'Syrups' },
  { id: 4, name: 'PackagingPlus', contact: 'Linda', phone: '+62 877-4455-6677', email: 'linda@packplus.id', category: 'Packaging' },
];

const initialInventory: InventoryItem[] = [
  { id: 1, name: 'Arabica Gayo Beans', category: 1, unit: 'kg', stock: 8, minStock: 10, maxStock: 50, cost: 120000, supplier: 1, expiry: '2025-06-30', notes: 'Single origin Aceh Gayo' },
  { id: 2, name: 'Robusta Toraja Beans', category: 1, unit: 'kg', stock: 22, minStock: 10, maxStock: 50, cost: 85000, supplier: 1, expiry: '2025-07-15', notes: '' },
  { id: 3, name: 'Espresso Blend', category: 1, unit: 'kg', stock: 3, minStock: 10, maxStock: 30, cost: 110000, supplier: 1, expiry: '2025-05-30', notes: 'Urgent reorder needed' },
  { id: 4, name: 'Full Cream Milk', category: 2, unit: 'liter', stock: 45, minStock: 20, maxStock: 100, cost: 14000, supplier: 2, expiry: '2025-04-20', notes: '' },
  { id: 5, name: 'Oat Milk', category: 2, unit: 'liter', stock: 12, minStock: 15, maxStock: 60, cost: 32000, supplier: 2, expiry: '2025-05-01', notes: '' },
  { id: 6, name: 'Vanilla Syrup', category: 3, unit: 'bottle', stock: 6, minStock: 5, maxStock: 20, cost: 95000, supplier: 3, expiry: '2026-01-01', notes: '' },
  { id: 7, name: 'Caramel Syrup', category: 3, unit: 'bottle', stock: 4, minStock: 5, maxStock: 20, cost: 95000, supplier: 3, expiry: '2026-01-01', notes: '' },
  { id: 8, name: 'Hazelnut Syrup', category: 3, unit: 'bottle', stock: 9, minStock: 5, maxStock: 20, cost: 95000, supplier: 3, expiry: '2026-01-01', notes: '' },
  { id: 9, name: 'Hot Paper Cup 12oz', category: 4, unit: 'pcs', stock: 320, minStock: 200, maxStock: 1000, cost: 1200, supplier: 4, expiry: '', notes: '' },
  { id: 10, name: 'Cold Cup 16oz', category: 4, unit: 'pcs', stock: 180, minStock: 150, maxStock: 800, cost: 1500, supplier: 4, expiry: '', notes: '' },
  { id: 11, name: 'Chamomile Tea Bags', category: 5, unit: 'box', stock: 8, minStock: 5, maxStock: 30, cost: 45000, supplier: 2, expiry: '2025-12-31', notes: '' },
  { id: 12, name: 'Green Tea Powder', category: 5, unit: 'kg', stock: 1.5, minStock: 2, maxStock: 10, cost: 180000, supplier: 2, expiry: '2025-09-01', notes: '' },
];

const initialTransactions: Transaction[] = [
  { id: 1, type: 'in', itemId: 1, qty: 20, price: 120000, source: 'Java Highland Beans Co.', note: 'Monthly restock', date: '2025-04-01' },
  { id: 2, type: 'out', itemId: 4, qty: 10, price: 14000, source: 'Daily usage', note: 'Morning shift', date: '2025-04-10' },
  { id: 3, type: 'in', itemId: 9, qty: 500, price: 1200, source: 'PackagingPlus', note: '', date: '2025-04-08' },
  { id: 4, type: 'out', itemId: 1, qty: 5, price: 0, source: 'Kitchen', note: 'Week use', date: '2025-04-09' },
  { id: 5, type: 'out', itemId: 3, qty: 4, price: 0, source: 'Kitchen', note: '', date: '2025-04-10' },
  { id: 6, type: 'in', itemId: 6, qty: 6, price: 95000, source: 'Monin Distributor', note: '', date: '2025-04-05' },
];

export const useStore = create<DBState>((set) => ({
  categories: initialCategories,
  suppliers: initialSuppliers,
  inventory: initialInventory,
  transactions: initialTransactions,
  nextItemId: 13,
  nextTxnId: 7,
  nextSupplierId: 5,
  nextCatId: 7,

  addCategory: (cat) => set((s) => ({
    categories: [...s.categories, { ...cat, id: s.nextCatId }],
    nextCatId: s.nextCatId + 1,
  })),
  deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

  addSupplier: (sup) => set((s) => ({
    suppliers: [...s.suppliers, { ...sup, id: s.nextSupplierId }],
    nextSupplierId: s.nextSupplierId + 1,
  })),
  updateSupplier: (id, data) => set((s) => ({
    suppliers: s.suppliers.map((sup) => sup.id === id ? { ...sup, ...data } : sup),
  })),
  deleteSupplier: (id) => set((s) => ({ suppliers: s.suppliers.filter((sup) => sup.id !== id) })),

  addItem: (item) => set((s) => ({
    inventory: [...s.inventory, { ...item, id: s.nextItemId }],
    nextItemId: s.nextItemId + 1,
  })),
  updateItem: (id, data) => set((s) => ({
    inventory: s.inventory.map((i) => i.id === id ? { ...i, ...data } : i),
  })),
  deleteItem: (id) => set((s) => ({ inventory: s.inventory.filter((i) => i.id !== id) })),

  addTransaction: (txn) => set((s) => {
    const item = s.inventory.find((i) => i.id === txn.itemId);
    if (!item) return s;
    const newStock = txn.type === 'in'
      ? parseFloat((item.stock + txn.qty).toFixed(2))
      : parseFloat((item.stock - txn.qty).toFixed(2));
    return {
      transactions: [...s.transactions, { ...txn, id: s.nextTxnId }],
      nextTxnId: s.nextTxnId + 1,
      inventory: s.inventory.map((i) => i.id === txn.itemId ? { ...i, stock: newStock } : i),
    };
  }),
  deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
}));

// Selectors
export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.stock <= 0) return 'critical';
  if (item.stock < item.minStock) return item.stock < item.minStock * 0.5 ? 'critical' : 'low';
  return 'ok';
}

export function getLowStockItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter((i) => i.stock < i.minStock);
}

export function getExpiringItems(inventory: InventoryItem[]): InventoryItem[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 7);
  return inventory.filter((i) => {
    if (!i.expiry) return false;
    const exp = new Date(i.expiry);
    return exp <= cutoff && exp >= new Date();
  });
}

export function fmtRp(n: number): string {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

export function fmtDate(d: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}
