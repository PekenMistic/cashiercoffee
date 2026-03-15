'use client';
/* eslint-disable react-hooks/preserve-manual-memoization */
import { useState, useMemo } from 'react';
import useSWR, { mutate as swrMutate } from 'swr';
import {
  ShoppingCart, Plus, Minus, Trash2, CheckCircle, RefreshCw, Search,
  CreditCard, Banknote, Smartphone, Receipt, Clock, ChevronDown, X,
  Settings, PackagePlus, AlertCircle,
} from 'lucide-react';
import { DBMenuItem, DBOrder, DBEmployee } from '@/types/db';
import { fmtRp, fmtDateTime } from '@/lib/utils';
import { apiPost, apiPut, apiDelete } from '@/lib/api';
import { useToast, Toast } from '@/components/Toast';

interface CartItem { menu_item_id:number; name:string; price:number; qty:number; subtotal:number; emoji:string; }
interface MenuForm  { id?:number; name:string; category:string; price:string; cost:string; image_emoji:string; description:string; is_available:number; }

const BLANK: MenuForm = { name:'', category:'Coffee', price:'', cost:'', image_emoji:'☕', description:'', is_available:1 };
const CATS   = ['Semua','Coffee','Non-Coffee','Food'];
const EMOJIS = ['☕','🥛','🍵','🧊','🍋','🍫','🥤','🧃','🍰','🥐','🍞','🍟','🍕','🧁'];
const TAX    = 0.10;

function ConfirmDialog({ msg, onOk, onCancel }:{ msg:string; onOk:()=>void; onCancel:()=>void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 scale-in">
        <div className="flex items-start gap-3 mb-5">
          <div className="size-10 bg-[var(--error-light)] rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-[var(--error)]"/>
          </div>
          <p className="text-sm text-[var(--foreground)] mt-1.5 leading-relaxed">{msg}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--muted)] cursor-pointer">Batal</button>
          <button onClick={onOk}     className="flex-1 py-2.5 rounded-xl bg-[var(--error)] text-white text-sm font-semibold hover:opacity-90 cursor-pointer">Hapus</button>
        </div>
      </div>
    </div>
  );
}

function MenuFormModal({ form, onChange, onSave, onClose, saving }:{
  form:MenuForm; onChange:(f:MenuForm)=>void; onSave:()=>void; onClose:()=>void; saving:boolean;
}) {
  const isEdit = !!form.id;
  const margin = form.price && form.cost
    ? Math.round(((parseFloat(form.price) - parseFloat(form.cost)) / parseFloat(form.price)) * 100)
    : null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl flex flex-col max-h-[92vh] scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h3 className="font-bold text-[var(--foreground)]">{isEdit ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-xl hover:bg-[var(--muted)] cursor-pointer"><X className="w-4 h-4 text-[var(--text-secondary)]"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Ikon Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => onChange({...form, image_emoji:e})}
                  className={`size-10 text-xl rounded-xl border-2 cursor-pointer transition-all ${form.image_emoji===e?'border-[var(--primary)] bg-[var(--primary-light)]':'border-[var(--border)] hover:border-[var(--primary)]/50'}`}>{e}</button>
              ))}
              <input value={form.image_emoji} onChange={e => onChange({...form, image_emoji:e.target.value})}
                className="w-20 text-center border border-[var(--border)] rounded-xl text-sm outline-none focus:border-[var(--primary)] py-2" placeholder="custom"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Nama Menu *</label>
            <input value={form.name} onChange={e => onChange({...form, name:e.target.value})}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" placeholder="contoh: Cappuccino"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Kategori *</label>
            <div className="grid grid-cols-3 gap-2">
              {['Coffee','Non-Coffee','Food'].map(c => (
                <button key={c} onClick={() => onChange({...form, category:c})}
                  className={`py-2 rounded-xl text-xs font-semibold border-2 cursor-pointer transition-all ${form.category===c?'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]':'border-[var(--border)] text-[var(--text-secondary)]'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Harga Jual (Rp) *</label>
              <input type="number" value={form.price} onChange={e => onChange({...form, price:e.target.value})}
                className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" placeholder="25000"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Harga Pokok (Rp)</label>
              <input type="number" value={form.cost} onChange={e => onChange({...form, cost:e.target.value})}
                className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" placeholder="8000"/>
            </div>
          </div>
          {margin !== null && (
            <div className="p-3 bg-[var(--muted)] rounded-xl flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Margin kotor</span>
              <span className="font-bold text-[var(--success)]">{margin}% · {fmtRp(parseFloat(form.price)-parseFloat(form.cost))}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Deskripsi</label>
            <textarea value={form.description} onChange={e => onChange({...form, description:e.target.value})}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)] resize-none" rows={2} placeholder="Deskripsi singkat…"/>
          </div>
          <div className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-xl">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Tersedia di POS</p>
              <p className="text-xs text-[var(--text-tertiary)]">Tampilkan di halaman kasir</p>
            </div>
            <button onClick={() => onChange({...form, is_available:form.is_available?0:1})}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.is_available?'bg-[var(--primary)]':'bg-[var(--border)]'}`}>
              <span className={`absolute top-1 size-4 bg-white rounded-full shadow transition-transform ${form.is_available?'translate-x-5':'translate-x-1'}`}/>
            </button>
          </div>
        </div>
        <div className="px-5 pb-5 pt-3 border-t border-[var(--border)] shrink-0 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--muted)] cursor-pointer">Batal</button>
          <button onClick={onSave} disabled={saving||!form.name.trim()||!form.price}
            className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white text-sm font-bold hover:bg-[var(--primary-hover)] cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>Menyimpan…</> : <><PackagePlus className="w-4 h-4"/>{isEdit?'Simpan':'Tambah Menu'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export function POS() {
  const { data: menuItemsRaw = [], mutate: reloadMenu } = useSWR<DBMenuItem[]>('/api/menu');
  const { data: employeesRaw = [] } = useSWR<DBEmployee[]>('/api/employees');
  const { data: recentOrdersRaw = [] } = useSWR<DBOrder[]>('/api/orders?limit=8');

  const menuItems    = (menuItemsRaw as DBMenuItem[]).filter(m => m.is_available);
  const allMenuItems = menuItemsRaw as DBMenuItem[];
  const employees    = (employeesRaw as DBEmployee[]).filter(e => e.status === 'active');
  const recentOrders = recentOrdersRaw as DBOrder[];

  const [cart, setCart]           = useState<CartItem[]>([]);
  const [catFilter, setCatFilter] = useState('Semua');
  const [search, setSearch]       = useState('');
  const [cashierId, setCashierId] = useState<number|null>(null);
  const [discount, setDiscount]   = useState('0');
  const [payMethod, setPayMethod] = useState<'cash'|'card'|'qris'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showCart, setShowCart]   = useState(false);
  const [successModal, setSuccessModal] = useState<{orderNo:string;change:number}|null>(null);
  const [showManage, setShowManage] = useState(false);
  const [menuForm, setMenuForm]   = useState<MenuForm|null>(null);
  const [savingMenu, setSavingMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<DBMenuItem|null>(null);
  const [manageSearch, setManageSearch] = useState('');
  const { toast, showToast, clearToast } = useToast();

   
  const filtered = useMemo(() => menuItems.filter(m =>
    (catFilter==='Semua'||m.category===catFilter) && (!search||m.name.toLowerCase().includes(search.toLowerCase()))
  ), [menuItems, catFilter, search]);

  const addToCart = (item: DBMenuItem) => {
    setCart(c => {
      const ex = c.find(i => i.menu_item_id===item.id);
      if (ex) return c.map(i => i.menu_item_id===item.id ? {...i,qty:i.qty+1,subtotal:(i.qty+1)*i.price} : i);
      return [...c, {menu_item_id:item.id, name:item.name, price:item.price, qty:1, subtotal:item.price, emoji:item.image_emoji}];
    });
  };

  const updateQty = (id:number, delta:number) => {
    setCart(c => c.map(i => i.menu_item_id===id ? {...i,qty:Math.max(0,i.qty+delta),subtotal:Math.max(0,i.qty+delta)*i.price} : i).filter(i=>i.qty>0));
  };

  const subtotal    = cart.reduce((s,i)=>s+i.subtotal, 0);
  const discountAmt = Math.min(parseFloat(discount)||0, subtotal);
  const taxAmt      = Math.round((subtotal-discountAmt)*TAX);
  const total       = subtotal - discountAmt + taxAmt;
  const change      = payMethod==='cash' ? Math.max(0,(parseFloat(amountPaid)||0)-total) : 0;
  const cartQty     = cart.reduce((s,i)=>s+i.qty, 0);

  const quickAmounts = useMemo(() => {
    const s = new Set([total, Math.ceil(total/5000)*5000, Math.ceil(total/10000)*10000, Math.ceil(total/50000)*50000, Math.ceil(total/100000)*100000]);
    return [...s].filter(v=>v>=total).slice(0,4);
  }, [total]);

  async function processPayment() {
    if (!cashierId) { showToast('Pilih kasir terlebih dahulu','error'); return; }
    if (!cart.length) { showToast('Keranjang kosong','error'); return; }
    if (payMethod==='cash' && (parseFloat(amountPaid)||0)<total) { showToast('Uang tidak cukup','error'); return; }
    setProcessing(true);
    try {
      const res = await apiPost<{order_no:string}>('/api/orders', {
        cashier_id:cashierId, items:cart.map(i=>({menu_item_id:i.menu_item_id,name:i.name,qty:i.qty,price:i.price,subtotal:i.subtotal})),
        subtotal, discount:discountAmt, tax:taxAmt, total, payment_method:payMethod, amount_paid:parseFloat(amountPaid)||total, change_amount:change,
      });
      setSuccessModal({orderNo:res.order_no, change});
      setCart([]); setDiscount('0'); setAmountPaid(''); setShowCart(false);
      swrMutate('/api/orders?limit=8'); swrMutate('/api/inventory');
    } catch (e:unknown) { showToast((e as Error).message,'error'); }
    setProcessing(false);
  }

  async function saveMenuItem() {
    if (!menuForm||!menuForm.name.trim()||!menuForm.price) return;
    setSavingMenu(true);
    try {
      const payload = { name:menuForm.name.trim(), category:menuForm.category, price:parseFloat(menuForm.price), cost:parseFloat(menuForm.cost)||0, image_emoji:menuForm.image_emoji||'☕', description:menuForm.description, is_available:menuForm.is_available };
      if (menuForm.id) { await apiPut('/api/menu',{id:menuForm.id,...payload}); showToast('Menu diperbarui','success'); }
      else { await apiPost('/api/menu',payload); showToast('Menu ditambahkan','success'); }
      await reloadMenu(); setMenuForm(null);
    } catch (e:unknown) { showToast((e as Error).message,'error'); }
    setSavingMenu(false);
  }

  async function deleteMenuItem() {
    if (!confirmDelete) return;
    try { await apiDelete('/api/menu',{id:confirmDelete.id}); showToast('Menu dihapus','success'); await reloadMenu(); }
    catch (e:unknown) { showToast((e as Error).message,'error'); }
    setConfirmDelete(null);
  }

  async function toggleAvail(item: DBMenuItem) {
    try { await apiPut('/api/menu',{...item, is_available:item.is_available?0:1}); await reloadMenu(); }
    catch (e:unknown) { showToast((e as Error).message,'error'); }
  }

  const filteredManage = allMenuItems.filter(m => !manageSearch || m.name.toLowerCase().includes(manageSearch.toLowerCase()));

  return (
    <div className="fade-in flex flex-col h-full">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Kasir / POS</h1>
          <p className="text-xs text-[var(--text-secondary)]">{menuItems.length} menu tersedia</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <select value={cashierId?.toString()||''} onChange={e=>setCashierId(e.target.value?parseInt(e.target.value):null)}
              className={`w-full sm:w-44 pl-3 pr-8 py-2.5 rounded-xl text-sm font-semibold border-2 outline-none cursor-pointer appearance-none transition-colors ${cashierId?'border-[var(--success)] bg-[var(--success-light)] text-[var(--success-text)]':'border-[var(--error)] bg-[var(--error-light)] text-[var(--error-text)]'}`}>
              <option value="">⚠ Pilih Kasir</option>
              {employees.map(e=><option key={e.id} value={e.id}>👤 {e.name}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-70"/>
          </div>
          <button onClick={()=>setShowManage(true)} title="Kelola Menu"
            className="size-10 flex items-center justify-center rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer transition-colors">
            <Settings className="w-4 h-4 text-[var(--text-secondary)]"/>
          </button>
          <button onClick={()=>{swrMutate('/api/menu');swrMutate('/api/employees');swrMutate('/api/orders?limit=8');}}
            className="size-10 flex items-center justify-center rounded-xl border border-[var(--border)] hover:border-[var(--primary)] cursor-pointer transition-colors">
            <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]"/>
          </button>
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 min-h-0">

        {/* LEFT: menu + history — 4-row grid for stable layout */}
        <div className="grid min-h-0" style={{gridTemplateRows:'auto auto 1fr auto'}}>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari menu…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] bg-white"/>
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {CATS.map(cat=>(
                <button key={cat} onClick={()=>setCatFilter(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all shrink-0 ${catFilter===cat?'bg-[var(--primary)] text-white':'bg-[var(--muted)] text-[var(--text-secondary)] hover:bg-[var(--border)]'}`}>{cat}</button>
              ))}
            </div>
          </div>

          {/* Empty state with add button */}
          {menuItems.length===0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
              <p className="text-3xl">🍽️</p>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Belum ada menu</p>
              <button onClick={()=>setMenuForm(BLANK)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold cursor-pointer hover:bg-[var(--primary-hover)] transition-colors">
                <Plus className="w-4 h-4"/> Tambah Menu Pertama
              </button>
            </div>
          )}

          {/* Menu grid — scrollable, takes remaining space */}
          <div className="overflow-y-auto scrollbar-hide min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 pb-1">
              {filtered.map(item=>{
                const inCart=cart.find(c=>c.menu_item_id===item.id);
                return (
                  <button key={item.id} onClick={()=>addToCart(item)}
                    className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all cursor-pointer text-center hover:shadow-md active:scale-95 ${inCart?'border-[var(--primary)] bg-[var(--primary-light)]':'border-[var(--border)] bg-white hover:border-[var(--primary)]/40'}`}>
                    {inCart&&<span className="absolute -top-2 -right-2 size-6 bg-[var(--primary)] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow">{inCart.qty}</span>}
                    <span className="text-3xl mb-1.5">{item.image_emoji}</span>
                    <p className="text-xs font-semibold text-[var(--foreground)] leading-snug mb-0.5 line-clamp-2">{item.name}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">{item.category}</p>
                    <p className="text-sm font-bold text-[var(--primary)] mt-1">{fmtRp(item.price)}</p>
                  </button>
                );
              })}
              {filtered.length===0&&menuItems.length>0&&(
                <div className="col-span-full py-10 text-center text-[var(--text-tertiary)]"><p className="text-2xl mb-2">🔍</p><p className="text-sm">Tidak ada menu cocok</p></div>
              )}
            </div>
          </div>

          {/* Recent orders — ALWAYS pinned at bottom, max-h for scroll */}
          <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white mt-2">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-alt)]">
              <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]"/>
              <span className="text-xs font-bold text-[var(--foreground)]">Transaksi Terakhir</span>
              <span className="ml-auto text-[11px] text-[var(--text-tertiary)]">{recentOrders.length} order</span>
            </div>
            <div className="overflow-y-auto scrollbar-hide" style={{maxHeight:'176px'}}>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[var(--border)]">
                  {recentOrders.length===0
                    ? <tr><td colSpan={4} className="py-5 text-center text-[var(--text-tertiary)]">Belum ada transaksi</td></tr>
                    : recentOrders.map(o=>(
                      <tr key={o.id} className="hover:bg-[var(--muted)] transition-colors">
                        <td className="px-4 py-2.5 font-mono font-bold text-[var(--primary)] whitespace-nowrap">{o.order_no}</td>
                        <td className="px-3 py-2.5 text-[var(--text-secondary)] hidden sm:table-cell">{o.cashier_name||'—'}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-[var(--foreground)] whitespace-nowrap">{fmtRp(o.total)}</td>
                        <td className="px-3 py-2.5 text-right text-[var(--text-tertiary)] hidden md:table-cell whitespace-nowrap">{fmtDateTime(typeof o.created_at==='string'?o.created_at:new Date(o.created_at).toISOString())}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: cart */}
        <div className={`flex flex-col border border-[var(--border)] rounded-2xl bg-white overflow-hidden shadow-sm ${showCart?'fixed inset-x-3 z-[450] shadow-2xl flex':'hidden xl:flex'}`}
          style={showCart?{top:'72px',bottom:'16px'}:undefined}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-alt)] shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[var(--primary)]"/>
              <span className="font-bold text-sm text-[var(--foreground)]">Keranjang</span>
              {cartQty>0&&<span className="size-5 bg-[var(--primary)] text-white text-[11px] font-bold rounded-full flex items-center justify-center">{cartQty}</span>}
            </div>
            <div className="flex items-center gap-2">
              {cart.length>0&&<button onClick={()=>setCart([])} className="text-xs text-[var(--error)] font-semibold hover:opacity-70 cursor-pointer">Hapus semua</button>}
              <button onClick={()=>setShowCart(false)} className="xl:hidden size-7 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] cursor-pointer"><X className="w-4 h-4"/></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
            {cart.length===0
              ? <div className="flex flex-col items-center justify-center h-full py-8 gap-2"><ShoppingCart className="w-10 h-10 text-[var(--border)]"/><p className="text-sm font-semibold text-[var(--text-secondary)]">Keranjang kosong</p><p className="text-xs text-[var(--text-tertiary)]">Tap menu untuk menambah</p></div>
              : cart.map(item=>(
                <div key={item.menu_item_id} className="flex items-center gap-2.5 p-2.5 bg-[var(--muted)] rounded-xl">
                  <span className="text-xl shrink-0">{item.emoji}</span>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-[var(--foreground)] truncate">{item.name}</p><p className="text-[11px] text-[var(--text-tertiary)]">{fmtRp(item.price)}</p></div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={()=>updateQty(item.menu_item_id,-1)} className="size-6 flex items-center justify-center rounded-lg bg-white border border-[var(--border)] hover:border-[var(--error)] hover:text-[var(--error)] cursor-pointer transition-colors"><Minus className="w-3 h-3"/></button>
                    <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                    <button onClick={()=>updateQty(item.menu_item_id,1)} className="size-6 flex items-center justify-center rounded-lg bg-white border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer transition-colors"><Plus className="w-3 h-3"/></button>
                  </div>
                  <div className="text-right shrink-0 min-w-[60px]">
                    <p className="text-xs font-bold text-[var(--foreground)]">{fmtRp(item.subtotal)}</p>
                    <button onClick={()=>setCart(c=>c.filter(i=>i.menu_item_id!==item.menu_item_id))} className="text-[var(--error)] hover:opacity-70 cursor-pointer mt-0.5"><Trash2 className="w-3 h-3"/></button>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="border-t border-[var(--border)] p-3 space-y-3 shrink-0">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-secondary)] shrink-0 font-medium">Diskon (Rp)</label>
              <input type="number" min="0" value={discount} onChange={e=>setDiscount(e.target.value)} className="flex-1 border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs text-right outline-none focus:border-[var(--primary)]"/>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]"><span>Subtotal</span><span>{fmtRp(subtotal)}</span></div>
              {discountAmt>0&&<div className="flex justify-between text-[var(--success)]"><span>Diskon</span><span>-{fmtRp(discountAmt)}</span></div>}
              <div className="flex justify-between text-[var(--text-secondary)]"><span>Pajak 10%</span><span>{fmtRp(taxAmt)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-[var(--border)]"><span>Total</span><span className="text-[var(--primary)]">{fmtRp(total)}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {([['cash','Tunai',<Banknote key="c" className="w-3.5 h-3.5"/>],['card','Kartu',<CreditCard key="d" className="w-3.5 h-3.5"/>],['qris','QRIS',<Smartphone key="q" className="w-3.5 h-3.5"/>]] as const).map(([m,l,icon])=>(
                <button key={m} onClick={()=>setPayMethod(m)} className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${payMethod===m?'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]':'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'}`}>{icon}{l}</button>
              ))}
            </div>
            {payMethod==='cash'&&(
              <div className="space-y-2">
                <input type="number" value={amountPaid} onChange={e=>setAmountPaid(e.target.value)} placeholder={`Min. ${fmtRp(total)}`} className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-bold text-right outline-none focus:border-[var(--primary)]"/>
                <div className="grid grid-cols-4 gap-1">
                  {quickAmounts.map(amt=><button key={amt} onClick={()=>setAmountPaid(amt.toString())} className="py-1.5 bg-[var(--muted)] rounded-lg text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--border)] cursor-pointer transition-colors">{amt>=100000?`${amt/1000}rb`:fmtRp(amt)}</button>)}
                </div>
                {(parseFloat(amountPaid)||0)>=total&&total>0&&(
                  <div className="flex justify-between items-center p-2.5 bg-[var(--success-light)] rounded-xl">
                    <span className="text-xs font-semibold text-[var(--success-text)]">Kembalian</span>
                    <span className="font-bold text-lg text-[var(--success)]">{fmtRp(change)}</span>
                  </div>
                )}
              </div>
            )}
            <button onClick={processPayment} disabled={cart.length===0||processing||!cashierId}
              className="w-full py-3.5 bg-[var(--primary)] text-white rounded-2xl font-bold text-sm hover:bg-[var(--primary-hover)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {processing?<><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>Memproses…</>:<><Receipt className="w-4 h-4"/>Bayar {fmtRp(total)}</>}
            </button>
            {!cashierId&&<p className="text-[11px] text-center text-[var(--error)] font-medium">⚠ Pilih kasir sebelum bayar</p>}
          </div>
        </div>
      </div>

      {/* Mobile floating cart */}
      <button onClick={()=>setShowCart(true)} className="xl:hidden fixed bottom-5 right-4 z-30 bg-[var(--primary)] text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5 font-bold text-sm cursor-pointer">
        <ShoppingCart className="w-4 h-4"/>
        {cartQty>0&&<span className="size-5 bg-white text-[var(--primary)] text-xs font-bold rounded-full flex items-center justify-center">{cartQty}</span>}
        <span>{cartQty>0?fmtRp(total):'Keranjang'}</span>
      </button>

      {/* Kelola Menu modal */}
      {showManage&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl flex flex-col max-h-[92vh] scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
              <div><h3 className="font-bold text-[var(--foreground)]">Kelola Menu</h3><p className="text-xs text-[var(--text-tertiary)]">{allMenuItems.length} item</p></div>
              <div className="flex items-center gap-2">
                <button onClick={()=>{setMenuForm(BLANK);setShowManage(false);}} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold cursor-pointer hover:bg-[var(--primary-hover)] transition-colors"><Plus className="w-3.5 h-3.5"/>Tambah Menu</button>
                <button onClick={()=>setShowManage(false)} className="size-8 flex items-center justify-center rounded-xl hover:bg-[var(--muted)] cursor-pointer"><X className="w-4 h-4 text-[var(--text-secondary)]"/></button>
              </div>
            </div>
            <div className="px-5 py-3 border-b border-[var(--border)] shrink-0">
              <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"/><input value={manageSearch} onChange={e=>setManageSearch(e.target.value)} placeholder="Cari menu…" className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)]"/></div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-[var(--border)]">
              {filteredManage.map(item=>(
                <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--muted)] transition-colors">
                  <span className="text-2xl shrink-0">{item.image_emoji}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[var(--foreground)] truncate">{item.name}</p><p className="text-xs text-[var(--text-tertiary)]">{item.category} · {fmtRp(item.price)}</p></div>
                  <button onClick={()=>toggleAvail(item)} className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${item.is_available?'bg-[var(--primary)]':'bg-[var(--border)]'}`}>
                    <span className={`absolute top-0.5 size-4 bg-white rounded-full shadow transition-transform ${item.is_available?'translate-x-5':'translate-x-0.5'}`}/>
                  </button>
                  <button onClick={()=>{setMenuForm({id:item.id,name:item.name,category:item.category,price:String(item.price),cost:String(item.cost||0),image_emoji:item.image_emoji,description:item.description||'',is_available:item.is_available?1:0});setShowManage(false);}} className="size-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] cursor-pointer transition-colors shrink-0"><Settings className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>{setConfirmDelete(item);setShowManage(false);}} className="size-8 flex items-center justify-center rounded-lg hover:bg-[var(--error-light)] hover:text-[var(--error)] cursor-pointer transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              ))}
              {filteredManage.length===0&&<div className="py-10 text-center text-[var(--text-tertiary)] text-sm">Tidak ada menu ditemukan</div>}
            </div>
          </div>
        </div>
      )}

      {menuForm&&<MenuFormModal form={menuForm} onChange={setMenuForm} onSave={saveMenuItem} onClose={()=>setMenuForm(null)} saving={savingMenu}/>}
      {confirmDelete&&<ConfirmDialog msg={`Hapus menu "${confirmDelete.name}"?`} onOk={deleteMenuItem} onCancel={()=>setConfirmDelete(null)}/>}

      {successModal&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-8 text-center scale-in">
            <div className="size-20 bg-[var(--success-light)] rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-[var(--success)]"/></div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">Pembayaran Berhasil!</h2>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">Order #{successModal.orderNo}</p>
            {successModal.change>0&&<div className="bg-[var(--success-light)] rounded-2xl p-4 mb-5"><p className="text-xs text-[var(--success-text)]">Kembalian</p><p className="text-3xl font-bold text-[var(--success)]">{fmtRp(successModal.change)}</p></div>}
            <button onClick={()=>setSuccessModal(null)} className="w-full py-3 bg-[var(--primary)] text-white rounded-2xl font-bold hover:bg-[var(--primary-hover)] cursor-pointer transition-colors">Transaksi Baru</button>
          </div>
        </div>
      )}

      {toast&&<Toast message={toast.message} type={toast.type} onClose={clearToast}/>}
    </div>
  );
}
