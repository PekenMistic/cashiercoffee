'use client';
import {
  LayoutDashboard, Package, ArrowLeftRight, Truck, BarChart3, Tag,
  X, Users, Calendar, ShoppingBag, Wallet, ClipboardList, BookOpen, AlertTriangle, QrCode, Receipt
} from 'lucide-react';
import { PageName } from '@/types/db';

interface SidebarProps {
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
  isOpen: boolean;
  onClose: () => void;
  lowStockCount: number;
}

const NAV = [
  {
    title: 'Penjualan',
    items: [{ p: 'pos' as PageName, icon: ShoppingBag, label: 'Kasir / POS' }],
  },
  {
    title: 'Operasional',
    items: [
      { p: 'dashboard'       as PageName, icon: LayoutDashboard, label: 'Dashboard' },
      { p: 'orders'          as PageName, icon: Receipt,         label: 'Semua Pesanan' },
      { p: 'inventory'       as PageName, icon: Package,          label: 'Inventori' },
      { p: 'transactions'    as PageName, icon: ArrowLeftRight,   label: 'Transaksi' },
      { p: 'purchase_orders' as PageName, icon: ClipboardList,    label: 'Purchase Order' },
      { p: 'suppliers'       as PageName, icon: Truck,            label: 'Supplier' },
      { p: 'reports'         as PageName, icon: BarChart3,        label: 'Laporan' },
    ],
  },
  {
    title: 'Produksi',
    items: [{ p: 'recipes' as PageName, icon: BookOpen, label: 'Resep & BOM' }],
  },
  {
    title: 'SDM',
    items: [
      { p: 'employees' as PageName, icon: Users,    label: 'Karyawan' },
      { p: 'shifts'    as PageName, icon: Calendar, label: 'Shift' },
      { p: 'payroll'   as PageName, icon: Wallet,   label: 'Penggajian' },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      { p: 'categories' as PageName, icon: Tag,    label: 'Kategori' },
      { p: 'tables'     as PageName, icon: QrCode, label: 'Meja & QR Order' },
    ],
  },
];

export function Sidebar({
  currentPage, onNavigate, isOpen, onClose, lowStockCount,
}: SidebarProps) {
  return (
    /*
      z-[410]: above the overlay (z-[400]) but below modals (z-[500])
      On desktop: always visible (translate-x-0 via lg:translate-x-0)
      On mobile: slides in/out based on isOpen
    */
    <aside
      className={`
        fixed inset-y-0 left-0 z-[410] w-[260px]
        bg-white border-r border-[var(--border)]
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      {/* Logo row */}
      <div className="flex items-center justify-between px-5 h-[64px] border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="size-8 bg-[var(--coffee)] rounded-xl flex items-center justify-center text-lg leading-none">
            ☕
          </div>
          <div>
            <p className="font-bold text-[var(--foreground)] text-sm leading-none">BrewStock</p>
            <p className="text-[10px] text-[var(--text-tertiary)] font-medium mt-0.5">Coffee Management</p>
          </div>
        </div>

        {/* Close button — only visible on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden size-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
        >
          <X className="w-4 h-4 text-[var(--text-secondary)]"/>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-3 px-3">
        {NAV.map(group => (
          <div key={group.title} className="mb-1">
            <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
              {group.title}
            </p>
            {group.items.map(item => {
              const active    = currentPage === item.p;
              const Icon      = item.icon;
              const showBadge = item.p === 'inventory' && lowStockCount > 0;
              return (
                <button
                  key={item.p}
                  onClick={() => onNavigate(item.p)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                    text-sm font-medium transition-all cursor-pointer mb-0.5
                    ${active
                      ? 'bg-[var(--primary-light)] text-[var(--primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${active ? 'text-[var(--primary)]' : ''}`}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {showBadge && (
                    <span className="min-w-[20px] h-5 px-1 bg-[var(--error)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {lowStockCount > 9 ? '9+' : lowStockCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Low stock warning strip */}
      {lowStockCount > 0 && (
        <div className="mx-3 mb-3 p-3 bg-[var(--warning-light)] rounded-xl flex items-center gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0"/>
          <p className="text-xs font-semibold text-[var(--warning-text)]">
            {lowStockCount} item stok rendah
          </p>
        </div>
      )}
    </aside>
  );
}
