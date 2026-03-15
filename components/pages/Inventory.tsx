'use client';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, ArrowDownToLine, ArrowUpFromLine, CheckCircle, AlertTriangle, AlertOctagon, X, RefreshCw } from 'lucide-react';
import { DBInventoryItem, DBCategory, DBSupplier } from '@/types/db';
import { getStockStatus, fmtRp, fmtDate, todayStr } from '@/lib/utils';
import { apiPost, apiPut, apiDelete } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast, Toast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';

// Module-level constant — evaluated once when module loads, not during render
const MODULE_NOW_MS = Date.now();

function StockBadge({ item }: { item: DBInventoryItem }) {
  const s = getStockStatus(item);
  if (s === 'critical') return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#ED6B60]">Critical</span>;
  if (s === 'low') return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#F59E0B]">Low Stock</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#30B22D]">In Stock</span>;
}

export function Inventory() {
  const [inventory, setInventory] = useState<DBInventoryItem[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [suppliers, setSuppliers] = useState<DBSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [itemModal, setItemModal] = useState<{ open: boolean; item: DBInventoryItem | null }>({ open: false, item: null });
  const [txnModal, setTxnModal] = useState<{ open: boolean; item: DBInventoryItem | null; type: 'in' | 'out' }>({ open: false, item: null, type: 'in' });
  const [deleteConfirm, setDeleteConfirm] = useState<DBInventoryItem | null>(null);
  const { toast, showToast, clearToast } = useToast();

  async function load() {
    setLoading(true);
    const [inv, cats, sups] = await Promise.all([
      apiFetch<DBInventoryItem[]>('/api/inventory'),
      apiFetch<DBCategory[]>('/api/categories'),
      apiFetch<DBSupplier[]>('/api/suppliers'),
    ]);
    setInventory(inv); setCategories(cats); setSuppliers(sups);
    setLoading(false);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const filtered = useMemo(() => inventory.filter(i => {
    const status = getStockStatus(i);
    return (!catFilter || i.category_id === parseInt(catFilter)) &&
      (!statusFilter || status === statusFilter) &&
      (!search || i.name.toLowerCase().includes(search.toLowerCase()));
  }), [inventory, catFilter, statusFilter, search]);

  const counts = { ok: inventory.filter(i => getStockStatus(i) === 'ok').length, low: inventory.filter(i => getStockStatus(i) === 'low').length, critical: inventory.filter(i => getStockStatus(i) === 'critical').length };
  const nowMs = MODULE_NOW_MS;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#080C1A]">Inventory</h1><p className="text-[#6A7686] text-sm">{inventory.length} total items</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] transition-all cursor-pointer"><RefreshCw className="w-4 h-4 text-[#6A7686]" /></button>
          <button onClick={() => setItemModal({ open: true, item: null })} className="flex items-center gap-2 px-5 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] transition-all cursor-pointer"><Plus className="w-4 h-4" /> Add Item</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="border border-[#E8EAED] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#165DFF]" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border border-[#E8EAED] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#165DFF] bg-white cursor-pointer">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-[#E8EAED] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#165DFF] bg-white cursor-pointer">
          <option value="">All Status</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="critical">Critical</option>
        </select>
        {(catFilter || statusFilter || search) && <button onClick={() => { setCatFilter(''); setStatusFilter(''); setSearch(''); }} className="text-xs text-[#ED6B60] font-semibold px-3 py-2 rounded-xl ring-1 ring-[#ED6B60] hover:bg-[#FEE2E2] transition-all cursor-pointer">Clear</button>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {([['ok','In Stock',<CheckCircle key="ok" className="w-5 h-5 text-[#30B22D]"/>],['low','Low Stock',<AlertTriangle key="low" className="w-5 h-5 text-[#F59E0B]"/>],['critical','Critical',<AlertOctagon key="crit" className="w-5 h-5 text-[#ED6B60]"/>]] as const).map(([k,l,icon]) => (
          <button key={k} onClick={() => setStatusFilter(statusFilter===k?'':k)} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer text-left ${statusFilter===k?'border-[#165DFF] bg-blue-50':'border-[#E8EAED] bg-white hover:border-gray-300'}`}>
            {icon}<div><p className="font-bold text-[#080C1A]">{counts[k]}</p><p className="text-xs text-[#6A7686]">{l}</p></div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#E8EAED] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#E8EAED] bg-[#EFF2F7]/50">
              <th className="text-left px-5 py-3.5 font-semibold text-[#6A7686]">Item</th>
              <th className="text-left px-4 py-3.5 font-semibold text-[#6A7686] hidden md:table-cell">Category</th>
              <th className="text-right px-4 py-3.5 font-semibold text-[#6A7686]">Stock</th>
              <th className="text-right px-4 py-3.5 font-semibold text-[#6A7686] hidden lg:table-cell">Cost</th>
              <th className="text-right px-4 py-3.5 font-semibold text-[#6A7686] hidden lg:table-cell">Value</th>
              <th className="text-center px-4 py-3.5 font-semibold text-[#6A7686]">Status</th>
              <th className="text-center px-4 py-3.5 font-semibold text-[#6A7686] hidden md:table-cell">Expiry</th>
              <th className="px-4 py-3.5"></th>
            </tr></thead>
            <tbody className="divide-y divide-[#E8EAED]">
              {filtered.length === 0 ? <tr><td colSpan={8} className="px-5 py-10 text-center text-[#6A7686]">No items found</td></tr>
                : filtered.map(item => {
                  const status = getStockStatus(item);
                  const borderCls = status === 'critical' ? 'stock-critical' : status === 'low' ? 'stock-low' : 'stock-ok';
                  const pct = Math.min(100, Math.round((item.stock / item.max_stock) * 100));
                  const barColor = status === 'ok' ? 'bg-[#30B22D]' : status === 'low' ? 'bg-[#F59E0B]' : 'bg-[#ED6B60]';
                  const isExpiringSoon = item.expiry && (new Date(item.expiry).getTime() - nowMs) < 7 * 86400000 && new Date(item.expiry).getTime() > nowMs;
                  const isExpired = item.expiry && new Date(item.expiry).getTime() < nowMs;
                  return (
                    <tr key={item.id} className={`hover:bg-[#EFF2F7]/30 transition-all ${borderCls}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-9 ${item.category_color||''} rounded-xl flex items-center justify-center text-base shrink-0`}>{item.category_icon}</div>
                          <div><p className="font-semibold text-[#080C1A]">{item.name}</p><p className="text-xs text-[#6A7686]">{item.notes?.substring(0,30)||item.category_name}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.category_color||''}`}>{item.category_name}</span></td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-[#080C1A]">{item.stock}</span><span className="text-xs text-[#6A7686] ml-1">{item.unit}</span>
                        <div className="text-xs text-[#6A7686]">max {item.max_stock}</div>
                        <div className="mt-1 w-full bg-[#EFF2F7] rounded-full h-1.5 min-w-[60px]"><div className={`h-1.5 rounded-full ${barColor}`} style={{width:`${pct}%`}}/></div>
                      </td>
                      <td className="px-4 py-4 text-right hidden lg:table-cell text-[#6A7686]">{fmtRp(item.cost)}</td>
                      <td className="px-4 py-4 text-right hidden lg:table-cell font-semibold text-[#080C1A]">{fmtRp(item.stock*item.cost)}</td>
                      <td className="px-4 py-4 text-center"><StockBadge item={item}/></td>
                      <td className={`px-4 py-4 text-center hidden md:table-cell text-xs ${isExpired?'text-[#ED6B60] font-bold':isExpiringSoon?'text-[#F59E0B] font-semibold':'text-[#6A7686]'}`}>{fmtDate(item.expiry)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setTxnModal({open:true,item,type:'in'})} className="size-8 flex items-center justify-center rounded-lg bg-[#DCFCE7] text-[#30B22D] hover:opacity-80 cursor-pointer"><ArrowDownToLine className="w-4 h-4"/></button>
                          <button onClick={() => setTxnModal({open:true,item,type:'out'})} className="size-8 flex items-center justify-center rounded-lg bg-[#FEE2E2] text-[#ED6B60] hover:opacity-80 cursor-pointer"><ArrowUpFromLine className="w-4 h-4"/></button>
                          <button onClick={() => setItemModal({open:true,item})} className="size-8 flex items-center justify-center rounded-lg hover:bg-[#EFF2F7] cursor-pointer text-[#6A7686]"><Pencil className="w-4 h-4"/></button>
                          <button onClick={() => setDeleteConfirm(item)} className="size-8 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] hover:text-[#ED6B60] cursor-pointer text-[#6A7686]"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-[#E8EAED] bg-[#EFF2F7]/30 text-xs text-[#6A7686]">Showing {filtered.length} of {inventory.length} items</div>
      </div>

      {itemModal.open && <ItemModal item={itemModal.item} categories={categories} suppliers={suppliers} onClose={() => setItemModal({open:false,item:null})} onSaved={async(msg)=>{showToast(msg);setItemModal({open:false,item:null});await load();}}/>}
      {txnModal.open && txnModal.item && <TxnModal item={txnModal.item} type={txnModal.type} onClose={() => setTxnModal({open:false,item:null,type:'in'})} onSaved={async(msg)=>{showToast(msg);setTxnModal({open:false,item:null,type:'in'});await load();}}/>}
      {deleteConfirm && <ConfirmModal message={`Delete "${deleteConfirm.name}"?`} onConfirm={async()=>{await apiDelete('/api/inventory',{id:deleteConfirm.id});showToast('Item deleted');setDeleteConfirm(null);await load();}} onCancel={()=>setDeleteConfirm(null)}/>}
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast}/>}
    </div>
  );
}

// --- ItemModal ---
function ItemModal({ item, categories, suppliers, onClose, onSaved }: { item: DBInventoryItem|null; categories: DBCategory[]; suppliers: DBSupplier[]; onClose:()=>void; onSaved:(m:string)=>void }) {
  const [f, setF] = useState({ name:item?.name||'', category_id:item?.category_id?.toString()||'', unit:item?.unit||'kg', stock:item?.stock?.toString()||'0', min_stock:item?.min_stock?.toString()||'0', max_stock:item?.max_stock?.toString()||'100', cost:item?.cost?.toString()||'0', supplier_id:item?.supplier_id?.toString()||'', expiry:item?.expiry||'', notes:item?.notes||'' });
  const set = (k:string,v:string)=>setF(p=>({...p,[k]:v}));
  async function save() {
    if (!f.name.trim()||!f.category_id){alert('Fill required fields');return;}
    const body = { name:f.name, category_id:parseInt(f.category_id), unit:f.unit, stock:parseFloat(f.stock)||0, min_stock:parseFloat(f.min_stock)||0, max_stock:parseFloat(f.max_stock)||100, cost:parseFloat(f.cost)||0, supplier_id:f.supplier_id?parseInt(f.supplier_id):null, expiry:f.expiry, notes:f.notes };
    if (item) { await apiPut('/api/inventory',{...body,id:item.id}); onSaved('Item updated'); }
    else { await apiPost('/api/inventory',body); onSaved('Item added'); }
  }
  const inp = 'w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] transition-all';
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]"><h2 className="font-bold text-xl">{item?'Edit Item':'Add Item'}</h2><button onClick={onClose} className="size-9 flex items-center justify-center rounded-xl hover:bg-[#EFF2F7] cursor-pointer"><X className="w-5 h-5 text-[#6A7686]"/></button></div>
        <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto max-h-[65vh]">
          <div className="col-span-2"><label className="block text-sm font-semibold mb-1.5">Item Name *</label><input className={inp} value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Arabica Coffee Beans"/></div>
          <div><label className="block text-sm font-semibold mb-1.5">Category *</label><select className={inp+' bg-white'} value={f.category_id} onChange={e=>set('category_id',e.target.value)}><option value="">Select</option>{categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
          <div><label className="block text-sm font-semibold mb-1.5">Unit</label><select className={inp+' bg-white'} value={f.unit} onChange={e=>set('unit',e.target.value)}>{['kg','g','liter','ml','pcs','box','pack','bottle','sachet'].map(u=><option key={u}>{u}</option>)}</select></div>
          <div><label className="block text-sm font-semibold mb-1.5">Current Stock</label><input type="number" className={inp} value={f.stock} onChange={e=>set('stock',e.target.value)}/></div>
          <div><label className="block text-sm font-semibold mb-1.5">Min Stock</label><input type="number" className={inp} value={f.min_stock} onChange={e=>set('min_stock',e.target.value)}/></div>
          <div><label className="block text-sm font-semibold mb-1.5">Max Stock</label><input type="number" className={inp} value={f.max_stock} onChange={e=>set('max_stock',e.target.value)}/></div>
          <div><label className="block text-sm font-semibold mb-1.5">Unit Cost (Rp)</label><input type="number" className={inp} value={f.cost} onChange={e=>set('cost',e.target.value)}/></div>
          <div className="col-span-2"><label className="block text-sm font-semibold mb-1.5">Supplier</label><select className={inp+' bg-white'} value={f.supplier_id} onChange={e=>set('supplier_id',e.target.value)}><option value="">None</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="col-span-2"><label className="block text-sm font-semibold mb-1.5">Expiry Date</label><input type="date" className={inp} value={f.expiry} onChange={e=>set('expiry',e.target.value)}/></div>
          <div className="col-span-2"><label className="block text-sm font-semibold mb-1.5">Notes</label><textarea rows={2} className={inp+' resize-none'} value={f.notes} onChange={e=>set('notes',e.target.value)}/></div>
        </div>
        <div className="p-6 border-t border-[#E8EAED] flex justify-end gap-3"><button onClick={onClose} className="px-6 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm hover:ring-[#165DFF] cursor-pointer">Cancel</button><button onClick={save} className="px-6 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer">Save</button></div>
      </div>
    </div>
  );
}

// --- TxnModal ---
function TxnModal({ item, type, onClose, onSaved }: { item: DBInventoryItem; type:'in'|'out'; onClose:()=>void; onSaved:(m:string)=>void }) {
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState(item.cost.toString());
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!qty || parseFloat(qty) <= 0) { alert('Enter valid quantity'); return; }
    setSaving(true);
    try {
      await apiPost('/api/transactions', { type, item_id: item.id, qty: parseFloat(qty), price: parseFloat(price)||0, source, note, date: todayStr() });
      onSaved(`${type==='in'?'Added':'Removed'} ${qty} ${item.unit} of ${item.name}`);
    } catch(e: unknown) { alert((e as Error).message); setSaving(false); }
  }
  const inp = 'w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] transition-all';
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]"><h2 className="font-bold text-xl">{type==='in'?'➕ Stock In':'➖ Stock Out'}</h2><button onClick={onClose} className="size-9 flex items-center justify-center rounded-xl hover:bg-[#EFF2F7] cursor-pointer"><X className="w-5 h-5 text-[#6A7686]"/></button></div>
        <div className="p-6 space-y-4">
          <div className="border border-[#E8EAED] rounded-xl px-4 py-3 bg-[#EFF2F7]"><p className="font-semibold text-[#080C1A]">{item.name}</p><p className="text-xs text-[#6A7686]">Current stock: {item.stock} {item.unit}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold mb-1.5">Qty *</label><input type="number" min="1" className={inp} value={qty} onChange={e=>setQty(e.target.value)}/></div>
            <div><label className="block text-sm font-semibold mb-1.5">Unit Price (Rp)</label><input type="number" className={inp} value={price} onChange={e=>setPrice(e.target.value)}/></div>
          </div>
          <div><label className="block text-sm font-semibold mb-1.5">Source</label><input className={inp} value={source} onChange={e=>setSource(e.target.value)} placeholder="e.g. Supplier A"/></div>
          <div><label className="block text-sm font-semibold mb-1.5">Note</label><input className={inp} value={note} onChange={e=>setNote(e.target.value)}/></div>
        </div>
        <div className="p-6 border-t border-[#E8EAED] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm cursor-pointer">Cancel</button>
          <button onClick={save} disabled={saving} className={`px-6 py-2.5 text-white rounded-full font-bold text-sm cursor-pointer ${type==='in'?'bg-[#30B22D]':'bg-[#ED6B60]'} hover:opacity-90 disabled:opacity-50`}>{saving?'Saving...':'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-[#165DFF] border-t-transparent rounded-full"/></div>;
}
