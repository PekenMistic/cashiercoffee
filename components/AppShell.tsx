'use client';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { SyncStatusBar } from '@/components/SyncStatusBar';
import { PageName, DBInventoryItem } from '@/types/db';
import { useOnlineStatus } from '@/lib/sync';
import useSWR from 'swr';

// ── Code-split page components (lazy load) ─────────────────────────────────
const Dashboard     = lazy(() => import('@/components/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const POS           = lazy(() => import('@/components/pages/POS').then(m => ({ default: m.POS })));
const Inventory     = lazy(() => import('@/components/pages/Inventory').then(m => ({ default: m.Inventory })));
const Transactions  = lazy(() => import('@/components/pages/Transactions').then(m => ({ default: m.Transactions })));
const PurchaseOrders= lazy(() => import('@/components/pages/PurchaseOrders').then(m => ({ default: m.PurchaseOrders })));
const Suppliers     = lazy(() => import('@/components/pages/Suppliers').then(m => ({ default: m.Suppliers })));
const Reports       = lazy(() => import('@/components/pages/Reports').then(m => ({ default: m.Reports })));
const Recipes       = lazy(() => import('@/components/pages/Recipes').then(m => ({ default: m.Recipes })));
const Employees     = lazy(() => import('@/components/pages/Employees').then(m => ({ default: m.Employees })));
const Shifts        = lazy(() => import('@/components/pages/Shifts').then(m => ({ default: m.Shifts })));
const Payroll       = lazy(() => import('@/components/pages/Payroll').then(m => ({ default: m.Payroll })));
const Categories    = lazy(() => import('@/components/pages/Categories').then(m => ({ default: m.Categories })));
const Tables        = lazy(() => import('@/components/pages/Tables').then(m => ({ default: m.Tables })));
const Orders        = lazy(() => import('@/components/pages/Orders').then(m => ({ default: m.Orders })));

// ── Page loading skeleton ──────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-[var(--border)] rounded-xl w-48"/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-[var(--border)] rounded-2xl"/>)}
      </div>
      <div className="h-64 bg-[var(--border)] rounded-2xl"/>
    </div>
  );
}

const MODULE_NOW = Date.now();

export default function AppShell() {
  const [page, setPage]       = useState<PageName>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const online = useOnlineStatus();

  // SWR-managed inventory for header alerts
  const { data: inventory = [] } = useSWR<DBInventoryItem[]>('/api/inventory');

  const in7d = MODULE_NOW + 7 * 86400000;
  const lowItems      = inventory.filter(i => i.stock < i.min_stock);
  const expiringItems = inventory.filter(i => {
    if (!i.expiry) return false;
    const t = new Date(i.expiry).getTime();
    return t >= MODULE_NOW && t <= in7d;
  });

  const navigate = useCallback((p: string) => {
    setPage(p as PageName);
    setSidebarOpen(false);
  }, []);

  // Sync indicator nudge - shift page content down when bar is visible
  const [barVisible, setBarVisible] = useState(false);
  useEffect(() => { setBarVisible(!online); }, [online]);

  return (
    <div className={`flex h-screen max-h-screen overflow-hidden bg-[var(--muted)] ${barVisible ? 'pt-8' : ''} transition-all`}>

      {/* Sync status bar — top of screen */}
      <SyncStatusBar onDataSynced={() => {
        // Trigger SWR revalidation of all cached keys after sync
        import('swr').then(({ mutate }) => mutate(() => true));
      }}/>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400]" onClick={() => setSidebarOpen(false)}/>
      )}

      <Sidebar
        currentPage={page}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        lowStockCount={lowItems.length}
      />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-w-0 bg-white min-h-0">
        <div className="relative z-[10] shrink-0">
          <Header
            currentPage={page}
            onToggleSidebar={() => setSidebarOpen(true)}
            onSearch={q => { if (q) navigate('inventory'); }}
            lowItems={lowItems}
            expiringItems={expiringItems}
          />
        </div>

        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6">
          <Suspense fallback={<PageSkeleton/>}>
            {page === 'dashboard'       && <Dashboard onNavigate={navigate}/>}
            {page === 'pos'             && <POS/>}
            {page === 'inventory'       && <Inventory/>}
            {page === 'transactions'    && <Transactions/>}
            {page === 'purchase_orders' && <PurchaseOrders/>}
            {page === 'suppliers'       && <Suppliers/>}
            {page === 'reports'         && <Reports/>}
            {page === 'recipes'         && <Recipes/>}
            {page === 'employees'       && <Employees/>}
            {page === 'shifts'          && <Shifts/>}
            {page === 'payroll'         && <Payroll/>}
            {page === 'categories'      && <Categories/>}
            {page === 'tables'          && <Tables/>}
            {page === 'orders'          && <Orders/>}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
