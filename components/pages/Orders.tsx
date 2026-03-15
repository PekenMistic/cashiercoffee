'use client';
import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Search, RefreshCw, Eye, CheckCircle2, Clock, ShoppingBag, QrCode, CreditCard, Banknote, Smartphone, X, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { DBOrder, DBOrderItem } from '@/types/db';
import { fmtRp, fmtDateTime } from '@/lib/utils';
import { apiPut } from '@/lib/api';
import { useToast, Toast } from '@/components/Toast';

// ── Types ────────────────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'completed' | 'pending' | 'cancelled';
type SourceFilter = 'all' | 'pos' | 'qr';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  completed: { label: 'Selesai',  bg: 'bg-[var(--success-light)]',  text: 'text-[var(--success-text)]',  dot: 'bg-[var(--success)]'  },
  pending:   { label: 'Pending',  bg: 'bg-amber-50',                  text: 'text-amber-700',               dot: 'bg-amber-500'          },
  cancelled: { label: 'Batal',    bg: 'bg-[var(--error-light)]',    text: 'text-[var(--error-text)]',    dot: 'bg-[var(--error)]'    },
};
const PAY_ICON = { cash: <Banknote className="w-3 h-3"/>, card: <CreditCard className="w-3 h-3"/>, qris: <Smartphone className="w-3 h-3"/> };
const PAY_LABEL = { cash: 'Tunai', card: 'Kartu', qris: 'QRIS' };

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`size-1.5 rounded-full shrink-0 ${cfg.dot}`}/>
      {cfg.label}
    </span>
  );
}

// ── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onComplete, onCancel }: {
  order: DBOrder; onClose: () => void;
  onComplete: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl flex flex-col max-h-[92vh] scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[var(--foreground)]">{order.order_no}</h3>
              <StatusBadge status={order.status}/>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{fmtDateTime(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-xl hover:bg-[var(--muted)] cursor-pointer">
            <X className="w-4 h-4 text-[var(--text-secondary)]"/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Sumber', value: order.source === 'qr' ? '📱 QR Order' : '🛒 Kasir' },
              { label: 'Kasir',  value: order.cashier_name || (order.source === 'qr' ? '—' : 'Unknown') },
              { label: 'Meja',   value: order.table_no || '—' },
              { label: 'Bayar',  value: PAY_LABEL[order.payment_method as keyof typeof PAY_LABEL] || order.payment_method },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-[var(--muted)] rounded-xl">
                <p className="text-[11px] text-[var(--text-tertiary)] mb-0.5 font-medium">{label}</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">{value}</p>
              </div>
            ))}
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Item Pesanan</p>
            <div className="border border-[var(--border)] rounded-xl overflow-hidden">
              {(order.items || []).map((item: DBOrderItem, i: number) => (
                <div key={item.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{fmtRp(item.price)} × {item.qty}</p>
                  </div>
                  <p className="font-bold text-[var(--foreground)] text-sm">{fmtRp(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border border-[var(--border)] rounded-xl overflow-hidden">
            {[
              { label: 'Subtotal',  value: fmtRp(order.subtotal), dim: true },
              order.discount > 0 ? { label: 'Diskon', value: `-${fmtRp(order.discount)}`, dim: true, green: true } : null,
              { label: 'Pajak 10%', value: fmtRp(order.tax), dim: true },
            ].filter(Boolean).map((row, i) => (
              <div key={i} className={`flex justify-between px-4 py-2.5 text-sm border-t border-[var(--border)] first:border-t-0 ${row!.dim ? 'text-[var(--text-secondary)]' : ''} ${row!.green ? 'text-[var(--success)]' : ''}`}>
                <span>{row!.label}</span><span>{row!.value}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 border-t-2 border-[var(--border)] font-bold">
              <span className="text-[var(--foreground)]">Total</span>
              <span className="text-[var(--primary)] text-base">{fmtRp(order.total)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="p-3 bg-[var(--muted)] rounded-xl">
              <p className="text-[11px] text-[var(--text-tertiary)] mb-0.5 font-medium">Catatan</p>
              <p className="text-sm text-[var(--foreground)]">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {order.status === 'pending' && (
          <div className="px-5 pb-5 pt-3 border-t border-[var(--border)] shrink-0 flex gap-2">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--error)] hover:bg-[var(--error-light)] cursor-pointer transition-colors">
              Batalkan
            </button>
            <button onClick={onComplete}
              className="flex-2 flex-[2] py-2.5 rounded-xl bg-[var(--success)] text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4"/> Tandai Selesai
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPI({ icon, label, value, sub, iconBg }: { icon: React.ReactNode; label: string; value: string; sub?: string; iconBg: string; }) {
  return (
    <div className="card p-4">
      <div className={`size-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xs text-[var(--text-secondary)] mb-0.5">{label}</p>
      <p className="font-bold text-[var(--foreground)] text-lg leading-tight">{value}</p>
      {sub && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function Orders() {
  const { data: allOrders = [], mutate } = useSWR<DBOrder[]>('/api/orders', { refreshInterval: 15_000 });

  const [search, setSearch]       = useState('');
  const [statusF, setStatusF]     = useState<StatusFilter>('all');
  const [sourceF, setSourceF]     = useState<SourceFilter>('all');
  const [dateF, setDateF]         = useState('');
  const [selectedOrder, setSelectedOrder] = useState<DBOrder | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);
  const { toast, showToast, clearToast } = useToast();

  // ── Filtered rows ──
  const orders = useMemo(() => {
    let rows = allOrders as DBOrder[];
    if (statusF !== 'all') rows = rows.filter(o => o.status === statusF);
    if (sourceF !== 'all') rows = rows.filter(o => o.source === sourceF);
    if (dateF)             rows = rows.filter(o => (o.created_at || '').startsWith(dateF));
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(o =>
        o.order_no.toLowerCase().includes(q) ||
        (o.cashier_name || '').toLowerCase().includes(q) ||
        (o.table_no || '').toLowerCase().includes(q) ||
        (o.notes || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }, [allOrders, statusF, sourceF, dateF, search]);

  // ── KPIs ──
  const kpis = useMemo(() => {
    const all   = allOrders as DBOrder[];
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = all.filter(o => (o.created_at || '').startsWith(today));
    return {
      totalOrders:   all.length,
      todayOrders:   todayOrders.length,
      totalRevenue:  all.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0),
      todayRevenue:  todayOrders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0),
      pendingCount:  all.filter(o => o.status === 'pending').length,
      qrCount:       all.filter(o => o.source === 'qr').length,
    };
  }, [allOrders]);

  async function handleAction(orderId: number, action: 'complete' | 'cancel_qr') {
    setProcessing(orderId);
    try {
      await apiPut('/api/orders', { id: orderId, action });
      showToast(action === 'complete' ? 'Order diselesaikan' : 'Order dibatalkan', 'success');
      await mutate();
      setSelectedOrder(null);
    } catch { showToast('Gagal memperbarui order', 'error'); }
    setProcessing(null);
  }

  const pendingQr = (allOrders as DBOrder[]).filter(o => o.status === 'pending' && o.source === 'qr').length;

  return (
    <div className="fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Semua Pesanan</h1>
          <p className="text-xs text-[var(--text-secondary)]">{(allOrders as DBOrder[]).length} total transaksi</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingQr > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="size-2 bg-amber-500 rounded-full animate-pulse"/>
              <span className="text-xs font-bold text-amber-700">{pendingQr} QR pending</span>
            </div>
          )}
          <button onClick={() => mutate()}
            className="size-9 flex items-center justify-center rounded-xl border border-[var(--border)] hover:border-[var(--primary)] cursor-pointer transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-[var(--text-secondary)]"/>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={<DollarSign className="w-5 h-5 text-[var(--primary)]"/>} label="Revenue Hari Ini" value={fmtRp(kpis.todayRevenue)} sub={`${kpis.todayOrders} pesanan`} iconBg="bg-[var(--primary-light)]"/>
        <KPI icon={<TrendingUp className="w-5 h-5 text-[var(--success)]"/>} label="Total Revenue" value={fmtRp(kpis.totalRevenue)} sub={`${kpis.totalOrders} transaksi`} iconBg="bg-[var(--success-light)]"/>
        <KPI icon={<Clock className="w-5 h-5 text-amber-600"/>} label="Pending" value={`${kpis.pendingCount} order`} sub="menunggu konfirmasi" iconBg="bg-amber-50"/>
        <KPI icon={<QrCode className="w-5 h-5 text-purple-600"/>} label="Via QR Order" value={`${kpis.qrCount} order`} sub={`${Math.round(kpis.qrCount / Math.max(kpis.totalOrders, 1) * 100)}% dari total`} iconBg="bg-purple-50"/>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari no. order, kasir, meja…"
              className="w-full pl-9 pr-4 py-2.5 border border-[var(--border)] rounded-xl text-sm outline-none focus:border-[var(--primary)] bg-white"/>
          </div>

          {/* Date */}
          <input type="date" value={dateF} onChange={e => setDateF(e.target.value)}
            className="border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)] cursor-pointer"/>

          {/* Status filter */}
          <div className="flex gap-1.5">
            {(['all','completed','pending','cancelled'] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setStatusF(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  statusF === s ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                }`}>
                {s === 'all' ? 'Semua' : s === 'completed' ? 'Selesai' : s === 'pending' ? 'Pending' : 'Batal'}
              </button>
            ))}
          </div>

          {/* Source filter */}
          <div className="flex gap-1.5">
            {(['all','pos','qr'] as SourceFilter[]).map(s => (
              <button key={s} onClick={() => setSourceF(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  sourceF === s ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                }`}>
                {s === 'all' ? 'Semua' : s === 'pos' ? '🛒 POS' : '📱 QR'}
              </button>
            ))}
          </div>

          {/* Clear filters */}
          {(search || dateF || statusF !== 'all' || sourceF !== 'all') && (
            <button onClick={() => { setSearch(''); setDateF(''); setStatusF('all'); setSourceF('all'); }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--error)] hover:bg-[var(--error-light)] cursor-pointer transition-colors flex items-center gap-1.5">
              <X className="w-3 h-3"/> Reset
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-[var(--text-tertiary)] mt-3">
          Menampilkan <strong className="text-[var(--foreground)]">{orders.length}</strong> dari {(allOrders as DBOrder[]).length} pesanan
        </p>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">No. Order</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider hidden md:table-cell">Waktu</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider hidden lg:table-cell">Kasir / Meja</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider hidden sm:table-cell">Sumber</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider hidden sm:table-cell">Bayar</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[var(--text-tertiary)]">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                    <p className="text-sm">Tidak ada pesanan ditemukan</p>
                  </td>
                </tr>
              ) : orders.map(order => (
                <tr key={order.id} className="table-row hover:bg-[var(--surface-alt)] transition-colors">
                  {/* Order no */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-mono font-bold text-[var(--primary)] text-xs">{order.order_no}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{order.item_count || 0} item</p>
                      </div>
                    </div>
                  </td>

                  {/* Time */}
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)] hidden md:table-cell whitespace-nowrap">
                    {fmtDateTime(order.created_at)}
                  </td>

                  {/* Cashier / table */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {order.source === 'qr' ? (
                      <div className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-purple-500 shrink-0"/>
                        <span className="text-sm text-[var(--foreground)] font-medium">{order.table_no || '—'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0"/>
                        <span className="text-sm text-[var(--text-secondary)]">{order.cashier_name || '—'}</span>
                      </div>
                    )}
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      order.source === 'qr' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {order.source === 'qr' ? <><QrCode className="w-3 h-3"/>QR</> : <><ShoppingBag className="w-3 h-3"/>POS</>}
                    </span>
                  </td>

                  {/* Payment */}
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--muted)] text-[var(--text-secondary)]">
                      {PAY_ICON[order.payment_method as keyof typeof PAY_ICON] || null}
                      {PAY_LABEL[order.payment_method as keyof typeof PAY_LABEL] || order.payment_method}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={order.status}/>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 text-right">
                    <p className="font-bold text-[var(--foreground)] text-sm">{fmtRp(order.total)}</p>
                    {order.discount > 0 && <p className="text-[11px] text-[var(--success)]">-{fmtRp(order.discount)}</p>}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View */}
                      <button onClick={() => setSelectedOrder(order)}
                        className="size-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] cursor-pointer transition-colors text-[var(--text-tertiary)]"
                        title="Lihat detail">
                        <Eye className="w-3.5 h-3.5"/>
                      </button>

                      {/* Quick complete (pending only) */}
                      {order.status === 'pending' && (
                        <button onClick={() => handleAction(order.id, 'complete')}
                          disabled={processing === order.id}
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-[var(--success-light)] hover:text-[var(--success)] cursor-pointer transition-colors text-[var(--text-tertiary)] disabled:opacity-40"
                          title="Tandai selesai">
                          {processing === order.id
                            ? <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                            : <CheckCircle2 className="w-3.5 h-3.5"/>
                          }
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onComplete={() => handleAction(selectedOrder.id, 'complete')}
          onCancel={() => handleAction(selectedOrder.id, 'cancel_qr')}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast}/>}
    </div>
  );
}
