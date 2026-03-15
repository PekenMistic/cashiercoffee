'use client';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Truck, Package, AlertTriangle, CheckCircle, XCircle, Send, RefreshCw, ChevronDown, ChevronUp, Trash2, X, Lightbulb } from 'lucide-react';
import { DBSupplier, DBInventoryItem } from '@/types/db';
import { fmtRp, fmtDateTime } from '@/lib/utils';
import { apiPost, apiPut, apiDelete } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast, Toast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';

interface PO {
  id: number; po_no: string; supplier_id: number | null; supplier_name: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  notes: string; created_at: string; total_value: number; item_count: number;
  items?: POItem[];
}
interface POItem {
  id: number; po_id: number; inventory_item_id: number; item_name: string;
  qty_ordered: number; qty_received: number; unit: string; unit_cost: number; subtotal: number;
}
interface ReorderItem {
  id: number; name: string; stock: number; min_stock: number; max_stock: number;
  unit: string; cost: number; supplier_id: number | null; supplier_name: string | null;
  category_name: string; qty_to_order: number;
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-[#165DFF] border-t-transparent rounded-full"/></div>;
}

const STATUS_CONFIG = {
  draft:     { label: 'Draft',    color: 'bg-gray-100 text-gray-600'      },
  sent:      { label: 'Terkirim', color: 'bg-blue-100 text-blue-700'      },
  received:  { label: 'Diterima', color: 'bg-[#DCFCE7] text-[#30B22D]'   },
  cancelled: { label: 'Dibatal', color: 'bg-[#FEE2E2] text-[#ED6B60]'    },
};

export function PurchaseOrders() {
  const [orders, setOrders]       = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<DBSupplier[]>([]);
  const [inventory, setInventory] = useState<DBInventoryItem[]>([]);
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailCache, setDetailCache] = useState<Record<number, POItem[]>>({});
  const [modal, setModal]         = useState(false);
  const [deletePO, setDeletePO]   = useState<PO | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const { toast, showToast, clearToast } = useToast();

  async function load() {
    setLoading(true);
    const [pos, sups, inv, reorder] = await Promise.all([
      apiFetch<PO[]>('/api/purchase-orders'),
      apiFetch<DBSupplier[]>('/api/suppliers'),
      apiFetch<DBInventoryItem[]>('/api/inventory'),
      apiFetch<{ lowItems: ReorderItem[] }>('/api/reorder-suggestions'),
    ]);
    setOrders(pos);
    setSuppliers(sups);
    setInventory(inv);
    setReorderItems(reorder.lowItems);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  async function loadDetail(id: number) {
    if (detailCache[id]) return;
    const po = await apiFetch<PO & { items: POItem[] }>(`/api/purchase-orders?id=${id}`);
    setDetailCache(prev => ({ ...prev, [id]: po.items || [] }));
  }

  async function toggleExpand(id: number) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    await loadDetail(id);
  }

  async function handleAction(po: PO, action: 'send' | 'receive' | 'cancel') {
    await apiPut('/api/purchase-orders', { id: po.id, action });
    const msg = action === 'send' ? 'PO dikirim ke supplier' : action === 'receive' ? 'PO diterima, stok diperbarui' : 'PO dibatalkan';
    showToast(msg);
    setDetailCache({});
    await load();
  }

  const filtered = useMemo(() =>
    orders.filter(o => !statusFilter || o.status === statusFilter),
    [orders, statusFilter]
  );

  const counts = {
    draft: orders.filter(o => o.status === 'draft').length,
    sent: orders.filter(o => o.status === 'sent').length,
    received: orders.filter(o => o.status === 'received').length,
  };

  if (loading) return <Spinner />;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#080C1A]">Purchase Order</h1>
          <p className="text-[#6A7686] text-sm">{orders.length} total PO · {reorderItems.length} item perlu restock</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] cursor-pointer">
            <RefreshCw className="w-4 h-4 text-[#6A7686]"/>
          </button>
          <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer">
            <Plus className="w-4 h-4"/>Buat PO
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-5">
          <div className="size-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3"><Package className="w-5 h-5 text-gray-500"/></div>
          <p className="text-xs text-[#6A7686] mb-0.5">Draft</p>
          <p className="font-bold text-[#080C1A] text-2xl">{counts.draft}</p>
        </div>
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-5">
          <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3"><Send className="w-5 h-5 text-[#165DFF]"/></div>
          <p className="text-xs text-[#6A7686] mb-0.5">Terkirim</p>
          <p className="font-bold text-[#080C1A] text-2xl">{counts.sent}</p>
        </div>
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-5">
          <div className="size-10 bg-[#DCFCE7] rounded-xl flex items-center justify-center mb-3"><CheckCircle className="w-5 h-5 text-[#30B22D]"/></div>
          <p className="text-xs text-[#6A7686] mb-0.5">Diterima</p>
          <p className="font-bold text-[#080C1A] text-2xl">{counts.received}</p>
        </div>
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-5">
          <div className="size-10 bg-[#FEE2E2] rounded-xl flex items-center justify-center mb-3"><AlertTriangle className="w-5 h-5 text-[#ED6B60]"/></div>
          <p className="text-xs text-[#6A7686] mb-0.5">Perlu Restock</p>
          <p className="font-bold text-[#ED6B60] text-2xl">{reorderItems.length}</p>
        </div>
      </div>

      {/* Reorder suggestions banner */}
      {reorderItems.length > 0 && (
        <div className="bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="size-10 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5 text-[#F59E0B]"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#080C1A] mb-1">{reorderItems.length} item di bawah stok minimum</p>
              <div className="flex flex-wrap gap-2">
                {reorderItems.slice(0, 6).map(item => (
                  <span key={item.id} className="px-2.5 py-1 bg-white/70 rounded-lg text-xs font-semibold text-[#F59E0B] border border-[#F59E0B]/20">
                    {item.name} ({item.stock}/{item.min_stock} {item.unit})
                  </span>
                ))}
                {reorderItems.length > 6 && (
                  <span className="px-2.5 py-1 bg-white/70 rounded-lg text-xs font-semibold text-[#F59E0B]">
                    +{reorderItems.length - 6} lainnya
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setModal(true)} className="shrink-0 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-xs font-bold hover:opacity-90 cursor-pointer">
              Buat PO
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['', 'Semua'], ['draft', 'Draft'], ['sent', 'Terkirim'], ['received', 'Diterima'], ['cancelled', 'Dibatalkan']].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${statusFilter === val ? 'bg-[#165DFF] text-white' : 'ring-1 ring-[#E8EAED] hover:ring-[#165DFF] text-[#080C1A]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* PO list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E8EAED] rounded-2xl p-12 text-center">
            <Truck className="w-12 h-12 mx-auto text-[#E8EAED] mb-3"/>
            <p className="text-[#6A7686]">Belum ada purchase order</p>
          </div>
        ) : filtered.map(po => {
          const cfg = STATUS_CONFIG[po.status];
          const isExpanded = expandedId === po.id;
          const items = detailCache[po.id] || [];

          return (
            <div key={po.id} className="bg-white border border-[#E8EAED] rounded-2xl overflow-hidden hover:shadow-md transition-all">
              {/* PO header row */}
              <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => toggleExpand(po.id)}>
                <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-[#165DFF]"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[#080C1A]">{po.po_no}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-[#6A7686]">{po.supplier_name} · {po.item_count} item · {fmtDateTime(po.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#080C1A]">{fmtRp(po.total_value)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Action buttons */}
                  {po.status === 'draft' && (
                    <button onClick={e => { e.stopPropagation(); handleAction(po, 'send'); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#165DFF] text-white rounded-lg text-xs font-bold hover:opacity-90 cursor-pointer">
                      <Send className="w-3 h-3"/>Kirim
                    </button>
                  )}
                  {po.status === 'sent' && (
                    <button onClick={e => { e.stopPropagation(); handleAction(po, 'receive'); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#30B22D] text-white rounded-lg text-xs font-bold hover:opacity-90 cursor-pointer">
                      <CheckCircle className="w-3 h-3"/>Terima
                    </button>
                  )}
                  {(po.status === 'draft' || po.status === 'sent') && (
                    <button onClick={e => { e.stopPropagation(); handleAction(po, 'cancel'); }}
                      className="size-8 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] hover:text-[#ED6B60] cursor-pointer text-[#6A7686]">
                      <XCircle className="w-4 h-4"/>
                    </button>
                  )}
                  {po.status === 'draft' && (
                    <button onClick={e => { e.stopPropagation(); setDeletePO(po); }}
                      className="size-8 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] hover:text-[#ED6B60] cursor-pointer text-[#6A7686]">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6A7686]"/> : <ChevronDown className="w-4 h-4 text-[#6A7686]"/>}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-[#E8EAED]">
                  {items.length === 0 ? (
                    <div className="p-5 text-center text-sm text-[#6A7686]">Memuat detail...</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#F8F9FB]">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A7686]">Item</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Qty Pesan</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Qty Terima</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Harga Satuan</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr key={item.id} className="border-t border-[#F3F4F3]">
                            <td className="px-5 py-3 font-semibold text-[#080C1A]">{item.item_name}</td>
                            <td className="px-5 py-3 text-right text-[#6A7686]">{item.qty_ordered} {item.unit}</td>
                            <td className="px-5 py-3 text-right">
                              {po.status === 'received'
                                ? <span className="font-semibold text-[#30B22D]">{item.qty_received} {item.unit}</span>
                                : <span className="text-[#6A7686]">—</span>}
                            </td>
                            <td className="px-5 py-3 text-right text-[#6A7686]">{fmtRp(item.unit_cost)}</td>
                            <td className="px-5 py-3 text-right font-bold text-[#165DFF]">{fmtRp(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[#E8EAED] bg-[#F8F9FB]">
                          <td className="px-5 py-3 font-bold text-[#080C1A]" colSpan={4}>Total</td>
                          <td className="px-5 py-3 text-right font-bold text-[#165DFF]">{fmtRp(po.total_value)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                  {po.notes && (
                    <div className="px-5 py-3 bg-[#F8F9FB] border-t border-[#E8EAED]">
                      <p className="text-xs text-[#6A7686]">Catatan: {po.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create PO modal */}
      {modal && (
        <CreatePOModal
          suppliers={suppliers}
          inventory={inventory}
          reorderItems={reorderItems}
          onClose={() => setModal(false)}
          onSaved={async msg => {
            showToast(msg);
            setModal(false);
            await load();
          }}
        />
      )}

      {deletePO && (
        <ConfirmModal
          message={`Hapus PO "${deletePO.po_no}"?`}
          onConfirm={async () => {
            await apiDelete('/api/purchase-orders', { id: deletePO.id });
            showToast('PO dihapus');
            setDeletePO(null);
            await load();
          }}
          onCancel={() => setDeletePO(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast}/>}
    </div>
  );
}

// ── Create PO Modal ─────────────────────────────────────────────────────────
function CreatePOModal({
  suppliers, inventory, reorderItems, onClose, onSaved
}: {
  suppliers: DBSupplier[];
  inventory: DBInventoryItem[];
  reorderItems: ReorderItem[];
  onClose: () => void;
  onSaved: (m: string) => void;
}) {
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [items, setItems]           = useState<{
    inventory_item_id: number; item_name: string; qty_ordered: number;
    unit: string; unit_cost: number; subtotal: number;
  }[]>([]);

  // Pre-fill from reorder suggestions
  function preloadSuggestions() {
    const suggested = reorderItems.slice(0, 10).map(r => ({
      inventory_item_id: r.id,
      item_name: r.name,
      qty_ordered: Math.max(1, r.qty_to_order),
      unit: r.unit,
      unit_cost: r.cost,
      subtotal: Math.max(1, r.qty_to_order) * r.cost,
    }));
    setItems(suggested);
    if (reorderItems[0]?.supplier_id) setSupplierId(String(reorderItems[0].supplier_id));
  }

  function addItem() {
    setItems(prev => [...prev, { inventory_item_id: 0, item_name: '', qty_ordered: 1, unit: 'pcs', unit_cost: 0, subtotal: 0 }]);
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === 'inventory_item_id') {
        const inv = inventory.find(v => v.id === Number(value));
        if (inv) {
          updated.item_name = inv.name;
          updated.unit = inv.unit;
          updated.unit_cost = inv.cost;
          updated.subtotal = updated.qty_ordered * inv.cost;
        }
      }
      if (field === 'qty_ordered' || field === 'unit_cost') {
        updated.subtotal = updated.qty_ordered * updated.unit_cost;
      }
      return updated;
    }));
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  const totalValue = items.reduce((s, i) => s + i.subtotal, 0);

  async function save() {
    if (items.length === 0) { alert('Tambahkan minimal satu item'); return; }
    if (items.some(i => !i.inventory_item_id)) { alert('Pilih item inventori untuk setiap baris'); return; }
    setSaving(true);
    await apiPost('/api/purchase-orders', {
      supplier_id: supplierId ? parseInt(supplierId) : null,
      notes,
      items,
    });
    onSaved('Purchase Order berhasil dibuat');
  }

  const inp = 'w-full border border-[#E8EAED] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#165DFF] bg-white';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[#E8EAED] shrink-0">
          <h2 className="font-bold text-xl">Buat Purchase Order</h2>
          <button onClick={onClose} className="size-9 flex items-center justify-center rounded-xl hover:bg-[#EFF2F7] cursor-pointer">
            <X className="w-5 h-5 text-[#6A7686]"/>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Supplier + notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Supplier</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={inp}>
                <option value="">— Pilih supplier (opsional) —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Catatan</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opsional" className={inp}/>
            </div>
          </div>

          {/* Suggestion preload button */}
          {reorderItems.length > 0 && (
            <button onClick={preloadSuggestions} className="flex items-center gap-2 w-full px-4 py-3 bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-xl text-sm font-semibold text-[#F59E0B] hover:bg-[#FDE68A] cursor-pointer transition-all">
              <Lightbulb className="w-4 h-4"/>
              Muat {reorderItems.length} item reorder suggestion otomatis
            </button>
          )}

          {/* Items table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">Item Pesanan *</label>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-[#165DFF] font-semibold hover:underline cursor-pointer">
                <Plus className="w-3 h-3"/>Tambah Baris
              </button>
            </div>

            {items.length === 0 ? (
              <div className="border-2 border-dashed border-[#E8EAED] rounded-xl p-6 text-center text-sm text-[#6A7686]">
                Belum ada item. Klik &quot;Tambah Baris&quot; atau muat suggestion.
              </div>
            ) : (
              <div className="border border-[#E8EAED] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FB]">
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#6A7686]">Item Inventori</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-[#6A7686] w-24">Qty</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-[#6A7686] w-28">Harga/Unit</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-[#6A7686] w-28">Subtotal</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-t border-[#F3F4F3]">
                        <td className="px-3 py-2">
                          <select
                            value={item.inventory_item_id || ''}
                            onChange={e => updateItem(idx, 'inventory_item_id', parseInt(e.target.value))}
                            className="w-full border border-[#E8EAED] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#165DFF] bg-white"
                          >
                            <option value="">— Pilih item —</option>
                            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (stok: {i.stock} {i.unit})</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <input type="number" min="0.01" step="0.01"
                              value={item.qty_ordered}
                              onChange={e => updateItem(idx, 'qty_ordered', parseFloat(e.target.value) || 0)}
                              className="w-16 border border-[#E8EAED] rounded-lg px-2 py-1.5 text-xs text-right outline-none focus:border-[#165DFF]"
                            />
                            <span className="text-xs text-[#6A7686] shrink-0">{item.unit}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0"
                            value={item.unit_cost}
                            onChange={e => updateItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                            className="w-full border border-[#E8EAED] rounded-lg px-2 py-1.5 text-xs text-right outline-none focus:border-[#165DFF]"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-bold text-[#165DFF]">
                          {fmtRp(item.subtotal)}
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeItem(idx)} className="size-6 flex items-center justify-center rounded hover:bg-[#FEE2E2] hover:text-[#ED6B60] cursor-pointer text-[#6A7686]">
                            <X className="w-3.5 h-3.5"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#E8EAED] bg-[#F8F9FB]">
                      <td className="px-3 py-3 font-bold text-[#080C1A] text-xs" colSpan={3}>Total Nilai PO</td>
                      <td className="px-3 py-3 text-right font-bold text-[#165DFF]">{fmtRp(totalValue)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-[#E8EAED] flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm cursor-pointer">Batal</button>
          <button onClick={save} disabled={saving || items.length === 0}
            className="px-6 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Buat Purchase Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
