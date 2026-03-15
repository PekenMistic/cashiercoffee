'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { QrCode, Plus, Trash2, ExternalLink, Download, RefreshCw, Eye, ClipboardCheck, Table2, ShoppingBag, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { fmtRp, fmtDateTime } from '@/lib/utils';

interface TableConfig { id: string; name: string; seats: number; }
interface PendingOrder { id: number; order_no: string; table_no: string; total: number; status: string; created_at: string; item_count: number; }

const DEFAULT_TABLES: TableConfig[] = [
  { id: '1', name: 'Meja 1', seats: 2 },
  { id: '2', name: 'Meja 2', seats: 2 },
  { id: '3', name: 'Meja 3', seats: 4 },
  { id: '4', name: 'Meja 4', seats: 4 },
  { id: '5', name: 'Meja 5', seats: 6 },
];

const STORAGE_KEY = 'brewstock_tables_v1';

function QRDisplay({ url }: { url: string }) {
  const [QRCode, setQRCode] = useState<React.ComponentType<{value:string;size:number;level:string}> | null>(null);
  useEffect(() => {
    import('react-qr-code').then(m => setQRCode(() => m.default as React.ComponentType<{value:string;size:number;level:string}>));
  }, []);
  if (!QRCode) return <div className="size-36 bg-gray-100 animate-pulse rounded-xl"/>;
  return <QRCode value={url} size={144} level="M"/>;
}

function QRModal({ table, onClose }: { table: TableConfig; onClose: () => void }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const url     = `${baseUrl}/menu/${encodeURIComponent(table.name)}`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const download = () => {
    const svg = document.querySelector('#qr-svg-' + table.id + ' svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob    = new Blob([svgData], { type: 'image/svg+xml' });
    const link    = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = `qr-${table.name.replace(/\s+/g, '-')}.svg`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <h3 className="font-bold text-[var(--foreground)]">QR Code — {table.name}</h3>
            <p className="text-xs text-[var(--text-tertiary)]">{table.seats} kursi</p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-xl hover:bg-[var(--muted)] cursor-pointer">✕</button>
        </div>

        {/* QR Code */}
        <div id={`qr-svg-${table.id}`} className="flex justify-center mb-4 p-4 bg-white border-2 border-[var(--border)] rounded-2xl">
          <QRDisplay url={url}/>
        </div>

        {/* URL */}
        <div className="bg-[var(--muted)] rounded-xl px-3 py-2 mb-4 text-left">
          <p className="text-xs text-[var(--text-tertiary)] mb-0.5">URL Pemesanan</p>
          <p className="text-xs font-mono text-[var(--foreground)] break-all">{url}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={copy}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${copied ? 'border-[var(--success)] bg-[var(--success-light)] text-[var(--success)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'}`}>
            <ClipboardCheck className="w-4 h-4"/>
            {copied ? 'Disalin!' : 'Salin URL'}
          </button>
          <button onClick={download}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer transition-all text-xs font-semibold">
            <Download className="w-4 h-4"/>Download
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer transition-all text-xs font-semibold">
            <ExternalLink className="w-4 h-4"/>Preview
          </a>
        </div>

        {/* Print tip */}
        <p className="text-[11px] text-[var(--text-tertiary)] mt-4">
          💡 Cetak QR code ini dan tempelkan di meja. Pelanggan scan → langsung pesan!
        </p>
      </div>
    </div>
  );
}

// Pending orders from QR — fetched from admin
const fetcher = (url: string) => fetch(url).then(r => r.json());

export function Tables() {
  const [tables, setTables]       = useState<TableConfig[]>(DEFAULT_TABLES);
  const [showQR, setShowQR]       = useState<TableConfig | null>(null);
  const [newName, setNewName]     = useState('');
  const [newSeats, setNewSeats]   = useState('4');
  const [addingTable, setAddingTable] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'orders'>('tables');
  const [processing, setProcessing] = useState<number | null>(null);

  // Load/save tables from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setTables(JSON.parse(saved)); } catch { /* ignore */ } }
  }, []);

  const saveTables = (t: TableConfig[]) => {
    setTables(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  };

  const addTable = () => {
    if (!newName.trim()) return;
    const t = [...tables, { id: Date.now().toString(), name: newName.trim(), seats: parseInt(newSeats) || 4 }];
    saveTables(t);
    setNewName(''); setNewSeats('4'); setAddingTable(false);
  };

  const removeTable = (id: string) => saveTables(tables.filter(t => t.id !== id));

  // QR orders (pending) — poll every 10s
  const { data: pendingOrders = [], mutate: refreshOrders } = useSWR<PendingOrder[]>(
    '/api/orders?source=qr&status=pending',
    fetcher,
    { refreshInterval: 10_000 }
  );

  async function completeOrder(orderId: number) {
    setProcessing(orderId);
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, action: 'complete' }),
      });
      await refreshOrders();
    } catch { /* ignore */ }
    setProcessing(null);
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Meja & QR Order</h1>
          <p className="text-xs text-[var(--text-secondary)]">QR code untuk pemesanan mandiri pelanggan</p>
        </div>
        {pendingOrders.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="size-2 bg-amber-500 rounded-full animate-pulse"/>
            <span className="text-xs font-bold text-amber-700">{pendingOrders.length} pesanan masuk</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--muted)] p-1 rounded-xl w-fit">
        {(['tables', 'orders'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${activeTab === t ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'}`}>
            {t === 'tables' ? <><Table2 className="w-3.5 h-3.5"/>Daftar Meja</> : <><ShoppingBag className="w-3.5 h-3.5"/>Pesanan QR {pendingOrders.length > 0 && <span className="size-5 bg-[var(--error)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{pendingOrders.length}</span>}</>}
          </button>
        ))}
      </div>

      {/* ── TABLES TAB ── */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          {/* Tables grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tables.map(table => (
              <div key={table.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="size-10 bg-[var(--primary-light)] rounded-xl flex items-center justify-center mb-2">
                      <QrCode className="w-5 h-5 text-[var(--primary)]"/>
                    </div>
                    <h3 className="font-bold text-[var(--foreground)]">{table.name}</h3>
                    <p className="text-xs text-[var(--text-tertiary)]">{table.seats} kursi</p>
                  </div>
                  <button onClick={() => removeTable(table.id)} className="size-7 flex items-center justify-center rounded-lg hover:bg-[var(--error-light)] hover:text-[var(--error)] cursor-pointer transition-colors text-[var(--text-tertiary)]">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>

                <div className="flex items-center justify-center p-3 bg-[var(--muted)] rounded-xl mb-3" style={{height:100,overflow:'hidden'}}>
                  <QRDisplay url={`${baseUrl}/menu/${encodeURIComponent(table.name)}`}/>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowQR(table)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold cursor-pointer hover:bg-[var(--primary-hover)] transition-colors">
                    <Eye className="w-3.5 h-3.5"/> Lihat QR
                  </button>
                  <a href={`/menu/${encodeURIComponent(table.name)}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer transition-colors">
                    <ExternalLink className="w-3.5 h-3.5"/>
                  </a>
                </div>
              </div>
            ))}

            {/* Add table card */}
            {!addingTable ? (
              <button onClick={() => setAddingTable(true)}
                className="card p-5 flex flex-col items-center justify-center gap-2 border-2 border-dashed cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all group min-h-[200px]">
                <div className="size-10 bg-[var(--muted)] group-hover:bg-[var(--primary-light)] rounded-xl flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--primary)]"/>
                </div>
                <p className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--primary)]">Tambah Meja</p>
              </button>
            ) : (
              <div className="card p-5 space-y-3">
                <h4 className="font-bold text-sm text-[var(--foreground)]">Meja Baru</h4>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Nama Meja</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTable()}
                    placeholder="contoh: Meja 6, VIP 1, Teras"
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" autoFocus/>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Jumlah Kursi</label>
                  <select value={newSeats} onChange={e => setNewSeats(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--primary)] cursor-pointer">
                    {[1,2,3,4,6,8,10,12].map(n => <option key={n} value={n}>{n} kursi</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAddingTable(false)} className="flex-1 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--muted)] cursor-pointer">Batal</button>
                  <button onClick={addTable} className="flex-1 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold cursor-pointer hover:bg-[var(--primary-hover)] transition-colors">Simpan</button>
                </div>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 space-y-1.5">
            <p className="font-bold flex items-center gap-2"><QrCode className="w-4 h-4"/>Cara Kerja QR Order</p>
            <p>1. Klik <strong>Lihat QR</strong> → cetak / tampilkan di meja</p>
            <p>2. Pelanggan scan QR → buka menu di HP → pilih menu → pesan</p>
            <p>3. Pesanan muncul di tab <strong>Pesanan QR</strong> dengan status pending</p>
            <p>4. Staf konfirmasi pesanan → proses pembayaran di kasir</p>
          </div>
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              {pendingOrders.length === 0 ? 'Tidak ada pesanan pending' : `${pendingOrders.length} pesanan menunggu konfirmasi`}
            </p>
            <button onClick={() => refreshOrders()} className="size-9 flex items-center justify-center rounded-xl border border-[var(--border)] hover:border-[var(--primary)] cursor-pointer transition-colors">
              <RefreshCw className="w-3.5 h-3.5 text-[var(--text-secondary)]"/>
            </button>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-3xl mb-3">📋</p>
              <p className="font-semibold text-[var(--text-secondary)]">Belum ada pesanan QR</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Pesanan baru akan muncul di sini secara otomatis</p>
            </div>
          ) : (
            pendingOrders.map(order => (
              <div key={order.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="size-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <Table2 className="w-5 h-5 text-amber-700"/>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[var(--foreground)]">{order.table_no}</p>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">PENDING</span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        <span className="font-mono text-[var(--primary)]">{order.order_no}</span>
                        {' · '}{fmtDateTime(order.created_at)}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{order.item_count} item · <strong className="text-[var(--foreground)]">{fmtRp(order.total)}</strong></p>
                    </div>
                  </div>

                  <button onClick={() => completeOrder(order.id)} disabled={processing === order.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--success)] text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0">
                    {processing === order.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                      : <CheckCircle2 className="w-3.5 h-3.5"/>
                    }
                    Selesai
                  </button>
                </div>
              </div>
            ))
          )}

          {pendingOrders.length > 0 && (
            <div className="flex items-center gap-2 bg-[var(--muted)] rounded-xl p-3">
              <Clock className="w-4 h-4 text-[var(--text-tertiary)] shrink-0"/>
              <p className="text-xs text-[var(--text-secondary)]">Halaman ini refresh otomatis setiap 10 detik. Klik <strong>Selesai</strong> setelah pelanggan membayar.</p>
            </div>
          )}
        </div>
      )}

      {/* QR Modal */}
      {showQR && <QRModal table={showQR} onClose={() => setShowQR(null)}/>}
    </div>
  );
}
