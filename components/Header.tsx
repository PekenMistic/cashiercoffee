'use client';
import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, AlertTriangle, CalendarX } from 'lucide-react';
import { PageName, DBInventoryItem } from '@/types/db';
import { fmtDate } from '@/lib/utils';

const LABELS: Record<PageName, string> = {
  dashboard:      'Dashboard',
  inventory:      'Inventori',
  transactions:   'Transaksi',
  suppliers:      'Supplier',
  reports:        'Laporan',
  categories:     'Kategori',
  employees:      'Karyawan',
  shifts:         'Shift',
  payroll:        'Penggajian',
  purchase_orders:'Purchase Order',
  recipes:        'Resep & BOM',
  pos:            'Kasir / POS',
  orders:         'Semua Pesanan',
  tables:         'Meja & QR Order',
};

interface HeaderProps {
  currentPage: PageName;
  onToggleSidebar: () => void;
  onSearch: (q: string) => void;
  lowItems: DBInventoryItem[];
  expiringItems: DBInventoryItem[];
}

export function Header({
  currentPage, onToggleSidebar, onSearch, lowItems, expiringItems,
}: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef  = useRef<HTMLDivElement>(null);
  const alertCount = lowItems.length + expiringItems.length;

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <header className="flex items-center h-[64px] shrink-0 px-4 md:px-6 border-b border-[var(--border)] bg-white gap-3">

      {/* Hamburger — mobile only */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden size-9 flex items-center justify-center rounded-xl hover:bg-[var(--muted)] cursor-pointer shrink-0 transition-colors"
      >
        <Menu className="w-5 h-5 text-[var(--foreground)]"/>
      </button>

      {/* Breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-sm flex-1 min-w-0">
        <span className="text-[var(--text-tertiary)]">BrewStock</span>
        <span className="text-[var(--text-tertiary)]">/</span>
        <span className="font-semibold text-[var(--foreground)] truncate">
          {LABELS[currentPage]}
        </span>
      </div>
      <div className="md:hidden flex-1 min-w-0">
        <p className="font-bold text-[var(--foreground)] text-sm truncate">
          {LABELS[currentPage]}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">

        {/* Search — desktop only */}
        <div className="relative hidden lg:block">
          <input
            type="text"
            placeholder="Cari inventori…"
            onChange={e => onSearch(e.target.value)}
            className="bg-[var(--muted)] rounded-xl pl-9 pr-4 py-2 text-sm outline-none border border-transparent focus:border-[var(--primary)] focus:bg-white w-52 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
        </div>

        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="size-9 flex items-center justify-center rounded-xl hover:bg-[var(--muted)] cursor-pointer relative transition-colors"
          >
            <Bell style={{ width: 18, height: 18 }} className="text-[var(--text-secondary)]"/>
            {alertCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 bg-[var(--error)] text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                style={{ width: 18, height: 18, fontSize: 10 }}
              >
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {/* Notification dropdown — z-[20] stays above header content but well below modals */}
          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-[var(--border)] rounded-2xl shadow-xl z-[20] overflow-hidden fade-in">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="font-bold text-sm text-[var(--foreground)]">Notifikasi</p>
                {alertCount > 0 && (
                  <p className="text-xs text-[var(--text-tertiary)]">{alertCount} item perlu perhatian</p>
                )}
              </div>
              <div className="divide-y divide-[var(--border)] max-h-72 overflow-y-auto">
                {lowItems.slice(0, 6).map(item => (
                  <div key={`l-${item.id}`} className="flex items-start gap-3 p-3 hover:bg-[var(--muted)] transition-colors">
                    <div className="size-7 bg-[var(--error-light)] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[var(--error)]"/>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)]">{item.name}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        Stok {item.stock} {item.unit} (min: {item.min_stock})
                      </p>
                    </div>
                  </div>
                ))}
                {expiringItems.slice(0, 3).map(item => (
                  <div key={`e-${item.id}`} className="flex items-start gap-3 p-3 hover:bg-[var(--muted)] transition-colors">
                    <div className="size-7 bg-[var(--warning-light)] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarX className="w-3.5 h-3.5 text-[var(--warning)]"/>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)]">{item.name}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        Expired: {fmtDate(item.expiry)}
                      </p>
                    </div>
                  </div>
                ))}
                {alertCount === 0 && (
                  <div className="p-6 text-center text-sm text-[var(--text-tertiary)]">
                    Semua aman ✓
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar — desktop */}
        <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-[var(--border)]">
          <div>
            <p className="text-xs font-semibold text-[var(--foreground)] leading-none">Manager</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Admin</p>
          </div>
          <div className="size-8 rounded-xl bg-[var(--coffee)] flex items-center justify-center text-white font-bold text-xs">
            MG
          </div>
        </div>
      </div>
    </header>
  );
}
