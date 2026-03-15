'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X, RefreshCw } from 'lucide-react';
import { DBCategory, DBInventoryItem } from '@/types/db';
import { apiPost, apiPut, apiDelete } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast, Toast } from '@/components/Toast';
import { fmtRp, getStockStatus } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

const COLORS = [
  { cls: 'bg-blue-100 text-blue-700',   sw: 'bg-blue-400'   },
  { cls: 'bg-green-100 text-green-700',  sw: 'bg-green-400'  },
  { cls: 'bg-yellow-100 text-yellow-700',sw: 'bg-yellow-400' },
  { cls: 'bg-red-100 text-red-700',      sw: 'bg-red-400'    },
  { cls: 'bg-amber-100 text-amber-800',  sw: 'bg-amber-500'  },
  { cls: 'bg-purple-100 text-purple-700',sw: 'bg-purple-400' },
];

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-[#165DFF] border-t-transparent rounded-full"/></div>;
}

type ModalMode = { open: false } | { open: true; cat: DBCategory | null };

export function Categories() {
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [inventory,  setInventory]  = useState<DBInventoryItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState<ModalMode>({ open: false });
  const [del,        setDel]        = useState<DBCategory | null>(null);
  const [name,  setName]  = useState('');
  const [icon,  setIcon]  = useState('📦');
  const [color, setColor] = useState(COLORS[0].cls);
  const { toast, showToast, clearToast } = useToast();

  async function load() {
    setLoading(true);
    const [c, i] = await Promise.all([
      apiFetch<DBCategory[]>('/api/categories'),
      apiFetch<DBInventoryItem[]>('/api/inventory'),
    ]);
    setCategories(c);
    setInventory(i);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  function openAdd() {
    setName(''); setIcon('📦'); setColor(COLORS[0].cls);
    setModal({ open: true, cat: null });
  }

  function openEdit(cat: DBCategory) {
    setName(cat.name); setIcon(cat.icon); setColor(cat.color);
    setModal({ open: true, cat });
  }

  async function save() {
    if (!name.trim()) { showToast('Nama wajib diisi', 'error'); return; }
    const editing = modal.open && modal.cat;
    if (editing) {
      await apiPut('/api/categories', { id: editing.id, name, icon: icon || '📦', color });
      showToast('Kategori diperbarui');
    } else {
      await apiPost('/api/categories', { name, icon: icon || '📦', color });
      showToast('Kategori ditambahkan');
    }
    setModal({ open: false });
    await load();
  }

  async function confirmDelete(cat: DBCategory) {
    const used = inventory.some(i => i.category_id === cat.id);
    if (used) {
      showToast(`Tidak bisa hapus: ada item menggunakan "${cat.name}"`, 'error');
      return;
    }
    setDel(cat);
  }

  if (loading) return <Spinner />;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#080C1A]">Kategori</h1>
          <p className="text-[#6A7686] text-sm">{categories.length} kategori</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] cursor-pointer">
            <RefreshCw className="w-4 h-4 text-[#6A7686]"/>
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer">
            <Plus className="w-4 h-4"/>Tambah Kategori
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const items = inventory.filter(i => i.category_id === cat.id);
          const value = items.reduce((s, i) => s + i.stock * i.cost, 0);
          return (
            <div key={cat.id} className="bg-white border border-[#E8EAED] rounded-2xl p-5 hover:shadow-md transition-all">
              {/* Title row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`size-12 ${cat.color} rounded-2xl flex items-center justify-center text-2xl`}>{cat.icon}</div>
                  <div>
                    <h4 className="font-bold text-[#080C1A]">{cat.name}</h4>
                    <p className="text-xs text-[#6A7686]">{items.length} item</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cat)} className="size-8 flex items-center justify-center rounded-lg hover:bg-[#EFF2F7] cursor-pointer text-[#6A7686]">
                    <Pencil className="w-4 h-4"/>
                  </button>
                  <button onClick={() => confirmDelete(cat)} className="size-8 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] hover:text-[#ED6B60] cursor-pointer text-[#6A7686]">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-[#EFF2F7] rounded-xl p-3">
                  <p className="text-xs text-[#6A7686] mb-0.5">Item</p>
                  <p className="font-bold text-[#080C1A]">{items.length}</p>
                </div>
                <div className="bg-[#EFF2F7] rounded-xl p-3">
                  <p className="text-xs text-[#6A7686] mb-0.5">Nilai Stok</p>
                  <p className="font-bold text-[#080C1A] text-xs">{fmtRp(value)}</p>
                </div>
              </div>

              {/* Item list preview */}
              <div className="space-y-1.5">
                {items.slice(0, 3).map(item => {
                  const s = getStockStatus(item);
                  const c = s === 'ok' ? 'text-[#30B22D]' : s === 'low' ? 'text-[#F59E0B]' : 'text-[#ED6B60]';
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="text-[#6A7686] truncate">{item.name}</span>
                      <span className={`font-semibold ${c} ml-2 shrink-0`}>{item.stock} {item.unit}</span>
                    </div>
                  );
                })}
                {items.length > 3 && <p className="text-xs text-[#165DFF]">+{items.length - 3} lainnya...</p>}
                {items.length === 0 && <p className="text-xs text-[#6A7686] italic">Belum ada item</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden fade-in">
            <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]">
              <h2 className="font-bold text-xl">{modal.cat ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
              <button onClick={() => setModal({ open: false })} className="size-9 flex items-center justify-center rounded-xl hover:bg-[#EFF2F7] cursor-pointer">
                <X className="w-5 h-5 text-[#6A7686]"/>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Nama *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Biji Kopi"
                  className="w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF]"/>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Icon (emoji)</label>
                <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="☕"
                  className="w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF]"/>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Warna</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c.cls} type="button" onClick={() => setColor(c.cls)}
                      className={`w-8 h-8 rounded-lg ${c.sw} cursor-pointer transition-all ${color === c.cls ? 'ring-2 ring-offset-2 ring-[#165DFF] scale-110' : 'hover:scale-105'}`}/>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className={`size-10 ${color} rounded-xl flex items-center justify-center text-xl`}>{icon || '📦'}</div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>{name || 'Preview'}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#E8EAED] flex justify-end gap-3">
              <button onClick={() => setModal({ open: false })} className="px-6 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm cursor-pointer">Batal</button>
              <button onClick={save} className="px-6 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer">
                {modal.cat ? 'Simpan Perubahan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {del && (
        <ConfirmModal
          message={`Hapus kategori "${del.name}"?`}
          onConfirm={async () => {
            await apiDelete('/api/categories', { id: del.id });
            showToast('Kategori dihapus');
            setDel(null);
            await load();
          }}
          onCancel={() => setDel(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast}/>}
    </div>
  );
}
