'use client';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, ArrowDown, ArrowUp, Trash2, RefreshCw, X } from 'lucide-react';
import { DBTransaction, DBInventoryItem } from '@/types/db';
import { fmtRp, fmtDate, todayStr } from '@/lib/utils';
import { apiPost, apiDelete } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast, Toast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';

export function Transactions() {
  const [transactions, setTransactions] = useState<DBTransaction[]>([]);
  const [inventory, setInventory] = useState<DBInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [txnModal, setTxnModal] = useState<{type:'in'|'out'}|null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number|null>(null);
  const {toast,showToast,clearToast} = useToast();

  async function load() { setLoading(true); const [t,i]=await Promise.all([apiFetch<DBTransaction[]>('/api/transactions'),apiFetch<DBInventoryItem[]>('/api/inventory')]); setTransactions(t); setInventory(i); setLoading(false); }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{load();},[]);

  const filtered = useMemo(()=>transactions.filter(t=>(!typeFilter||t.type===typeFilter)&&(!search||(t.item_name||'').toLowerCase().includes(search.toLowerCase())||(t.source||'').toLowerCase().includes(search.toLowerCase()))),[transactions,typeFilter,search]);
  const totalIn = transactions.filter(t=>t.type==='in').reduce((s,t)=>s+t.qty*t.price,0);

  if (loading) return <Spinner/>;
  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#080C1A]">Transaksi</h1><p className="text-[#6A7686] text-sm">{transactions.length} total record</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] cursor-pointer"><RefreshCw className="w-4 h-4 text-[#6A7686]"/></button>
          <button onClick={()=>setTxnModal({type:'in'})} className="flex items-center gap-2 px-4 py-2.5 bg-[#30B22D] text-white rounded-full font-bold text-sm hover:opacity-90 cursor-pointer"><Plus className="w-4 h-4"/>Stok Masuk</button>
          <button onClick={()=>setTxnModal({type:'out'})} className="flex items-center gap-2 px-4 py-2.5 bg-[#ED6B60] text-white rounded-full font-bold text-sm hover:opacity-90 cursor-pointer"><Minus className="w-4 h-4"/>Stok Keluar</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-5"><p className="text-xs text-[#6A7686] mb-1">Total Transaksi</p><p className="text-2xl font-bold text-[#080C1A]">{transactions.length}</p></div>
        <div className="bg-[#DCFCE7] rounded-2xl p-5"><p className="text-xs text-[#30B22D] mb-1">Nilai Masuk</p><p className="text-lg font-bold text-[#30B22D]">{fmtRp(totalIn)}</p></div>
        <div className="bg-[#FEE2E2] rounded-2xl p-5"><p className="text-xs text-[#ED6B60] mb-1">Total Keluar</p><p className="text-2xl font-bold text-[#ED6B60]">{transactions.filter(t=>t.type==='out').length}</p></div>
      </div>
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Cari..." value={search} onChange={e=>setSearch(e.target.value)} className="border border-[#E8EAED] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#165DFF]"/>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="border border-[#E8EAED] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#165DFF] bg-white cursor-pointer">
          <option value="">Semua Tipe</option><option value="in">Stok Masuk</option><option value="out">Stok Keluar</option>
        </select>
      </div>
      <div className="bg-white border border-[#E8EAED] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#E8EAED] bg-[#EFF2F7]/50">
              <th className="text-left px-5 py-3.5 font-semibold text-[#6A7686]">Item</th>
              <th className="text-center px-4 py-3.5 font-semibold text-[#6A7686]">Tipe</th>
              <th className="text-right px-4 py-3.5 font-semibold text-[#6A7686]">Qty</th>
              <th className="text-right px-4 py-3.5 font-semibold text-[#6A7686] hidden md:table-cell">Total</th>
              <th className="text-left px-4 py-3.5 font-semibold text-[#6A7686] hidden lg:table-cell">Sumber</th>
              <th className="text-right px-4 py-3.5 font-semibold text-[#6A7686]">Tanggal</th>
              <th className="px-4 py-3.5"></th>
            </tr></thead>
            <tbody className="divide-y divide-[#E8EAED]">
              {filtered.length===0?<tr><td colSpan={7} className="px-5 py-10 text-center text-[#6A7686]">Tidak ada data</td></tr>:filtered.map(t=>(
                <tr key={t.id} className="hover:bg-[#EFF2F7]/30 transition-all">
                  <td className="px-5 py-4 font-semibold text-[#080C1A]">{t.item_name||'Deleted'}</td>
                  <td className="px-4 py-4 text-center"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${t.type==='in'?'bg-[#DCFCE7] text-[#30B22D]':'bg-[#FEE2E2] text-[#ED6B60]'}`}>{t.type==='in'?<ArrowDown className="w-3 h-3"/>:<ArrowUp className="w-3 h-3"/>}{t.type.toUpperCase()}</span></td>
                  <td className={`px-4 py-4 text-right font-bold ${t.type==='in'?'text-[#30B22D]':'text-[#ED6B60]'}`}>{t.type==='in'?'+':'-'}{t.qty} {t.item_unit}</td>
                  <td className="px-4 py-4 text-right hidden md:table-cell text-[#6A7686]">{t.price?fmtRp(t.qty*t.price):'—'}</td>
                  <td className="px-4 py-4 hidden lg:table-cell text-[#6A7686]">{t.source||'—'}</td>
                  <td className="px-4 py-4 text-right text-xs text-[#6A7686]">{fmtDate(t.date)}</td>
                  <td className="px-4 py-4"><button onClick={()=>setDeleteConfirm(t.id)} className="size-7 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] hover:text-[#ED6B60] text-[#6A7686] cursor-pointer"><Trash2 className="w-3.5 h-3.5"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {txnModal&&<GenericTxnModal inventory={inventory} type={txnModal.type} onClose={()=>setTxnModal(null)} onSaved={async(msg)=>{showToast(msg);setTxnModal(null);await load();}}/>}
      {deleteConfirm!==null&&<ConfirmModal message="Hapus transaksi ini?" onConfirm={async()=>{await apiDelete('/api/transactions',{id:deleteConfirm});showToast('Transaksi dihapus');setDeleteConfirm(null);await load();}} onCancel={()=>setDeleteConfirm(null)}/>}
      {toast&&<Toast message={toast.message} type={toast.type} onClose={clearToast}/>}
    </div>
  );
}

function GenericTxnModal({inventory,type,onClose,onSaved}:{inventory:DBInventoryItem[];type:'in'|'out';onClose:()=>void;onSaved:(m:string)=>void}) {
  const [itemId,setItemId]=useState(''); const [qty,setQty]=useState(''); const [price,setPrice]=useState(''); const [source,setSource]=useState(''); const [note,setNote]=useState(''); const [saving,setSaving]=useState(false);
  const item = inventory.find(i=>i.id===parseInt(itemId));
  async function save() {
    if (!itemId||!qty||parseFloat(qty)<=0){alert('Pilih item dan masukkan qty');return;}
    setSaving(true);
    try { await apiPost('/api/transactions',{type,item_id:parseInt(itemId),qty:parseFloat(qty),price:parseFloat(price)||0,source,note,date:todayStr()}); onSaved(`Stok ${type==='in'?'ditambahkan':'dikurangi'}: ${qty} ${item?.unit||''}`); }
    catch(e: unknown){alert((e as Error).message);setSaving(false);}
  }
  const inp='w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] transition-all';
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]"><h2 className="font-bold text-xl">{type==='in'?'➕ Stok Masuk':'➖ Stok Keluar'}</h2><button onClick={onClose} className="size-9 flex items-center justify-center rounded-xl hover:bg-[#EFF2F7] cursor-pointer"><X className="w-5 h-5 text-[#6A7686]"/></button></div>
        <div className="p-6 space-y-4">
          <div><label className="block text-sm font-semibold mb-1.5">Item *</label><select value={itemId} onChange={e=>setItemId(e.target.value)} className={inp+' bg-white cursor-pointer'}><option value="">— Pilih item —</option>{inventory.map(i=><option key={i.id} value={i.id}>{i.name} (stok: {i.stock} {i.unit})</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold mb-1.5">Qty *</label><input type="number" min="1" className={inp} value={qty} onChange={e=>setQty(e.target.value)}/></div><div><label className="block text-sm font-semibold mb-1.5">Harga Satuan</label><input type="number" className={inp} value={price} onChange={e=>setPrice(e.target.value)}/></div></div>
          <div><label className="block text-sm font-semibold mb-1.5">Sumber</label><input className={inp} value={source} onChange={e=>setSource(e.target.value)} placeholder="e.g. Supplier A"/></div>
          <div><label className="block text-sm font-semibold mb-1.5">Catatan</label><input className={inp} value={note} onChange={e=>setNote(e.target.value)}/></div>
        </div>
        <div className="p-6 border-t border-[#E8EAED] flex justify-end gap-3"><button onClick={onClose} className="px-6 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm cursor-pointer">Batal</button><button onClick={save} disabled={saving} className={`px-6 py-2.5 text-white rounded-full font-bold text-sm cursor-pointer ${type==='in'?'bg-[#30B22D]':'bg-[#ED6B60]'} hover:opacity-90 disabled:opacity-50`}>{saving?'Menyimpan...':'Konfirmasi'}</button></div>
      </div>
    </div>
  );
}
function Spinner(){return <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-[#165DFF] border-t-transparent rounded-full"/></div>;}
