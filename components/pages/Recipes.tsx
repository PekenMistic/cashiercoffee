'use client';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, X, RefreshCw, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { DBMenuItem, DBInventoryItem } from '@/types/db';
import { apiPost, apiDelete } from '@/lib/api';
import { useToast, Toast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { apiFetch } from '@/lib/api';

interface Recipe {
  id: number; menu_item_id: number; inventory_item_id: number;
  qty_used: number; unit: string; notes: string;
  inventory_name: string; inventory_unit: string; current_stock: number;
  menu_name: string; menu_category: string;
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-[#165DFF] border-t-transparent rounded-full"/></div>;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Coffee: '☕', 'Non-Coffee': '🍵', Food: '🍞',
};

export function Recipes() {
  const [recipes, setRecipes]     = useState<Recipe[]>([]);
  const [menuItems, setMenuItems] = useState<DBMenuItem[]>([]);
  const [inventory, setInventory] = useState<DBInventoryItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addModal, setAddModal]   = useState<{ open: boolean; menuItemId: number | null }>({ open: false, menuItemId: null });
  const [deleteItem, setDeleteItem] = useState<Recipe | null>(null);
  const [catFilter, setCatFilter] = useState('');
  const { toast, showToast, clearToast } = useToast();

  async function load() {
    setLoading(true);
    const [r, m, i] = await Promise.all([
      apiFetch<Recipe[]>('/api/recipes'),
      apiFetch<DBMenuItem[]>('/api/menu'),
      apiFetch<DBInventoryItem[]>('/api/inventory'),
    ]);
    setRecipes(r);
    setMenuItems(m);
    setInventory(i);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  // Group recipes by menu item
  const grouped = useMemo(() => {
    const map: Record<number, { menuItem: DBMenuItem | undefined; recipes: Recipe[] }> = {};
    for (const r of recipes) {
      if (!map[r.menu_item_id]) {
        map[r.menu_item_id] = {
          menuItem: menuItems.find(m => m.id === r.menu_item_id),
          recipes: [],
        };
      }
      map[r.menu_item_id].recipes.push(r);
    }
    return Object.entries(map).map(([id, data]) => ({ id: parseInt(id), ...data }));
  }, [recipes, menuItems]);

  // Menu items without any recipe
  const unmapped = useMemo(() =>
    menuItems.filter(m => !recipes.some(r => r.menu_item_id === m.id) && m.is_available),
    [menuItems, recipes]
  );

  const categories = [...new Set(menuItems.map(m => m.category))];

  const filteredGrouped = catFilter
    ? grouped.filter(g => g.menuItem?.category === catFilter)
    : grouped;

  if (loading) return <Spinner />;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#080C1A]">Resep & BOM</h1>
          <p className="text-[#6A7686] text-sm">{grouped.length} menu dengan resep · {unmapped.length} menu belum dipetakan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] cursor-pointer">
            <RefreshCw className="w-4 h-4 text-[#6A7686]"/>
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCatFilter('')}
          className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${!catFilter ? 'bg-[#165DFF] text-white' : 'ring-1 ring-[#E8EAED] hover:ring-[#165DFF] text-[#080C1A]'}`}>
          Semua
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${catFilter === cat ? 'bg-[#165DFF] text-white' : 'ring-1 ring-[#E8EAED] hover:ring-[#165DFF] text-[#080C1A]'}`}>
            {CATEGORY_EMOJI[cat] || '🍽'} {cat}
          </button>
        ))}
      </div>

      {/* Unmapped warning */}
      {unmapped.length > 0 && !catFilter && (
        <div className="bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-2xl p-4">
          <p className="text-sm font-semibold text-[#F59E0B] mb-2">⚠ {unmapped.length} menu belum memiliki resep — stok tidak akan otomatis terpotong saat POS checkout:</p>
          <div className="flex flex-wrap gap-2">
            {unmapped.map(m => (
              <button key={m.id} onClick={() => setAddModal({ open: true, menuItemId: m.id })}
                className="px-3 py-1 bg-white/80 border border-[#F59E0B]/30 rounded-lg text-xs font-semibold text-[#F59E0B] hover:bg-[#FDE68A] cursor-pointer transition-all">
                {m.image_emoji} {m.name} +
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recipe cards */}
      <div className="space-y-3">
        {filteredGrouped.length === 0 ? (
          <div className="bg-white border border-[#E8EAED] rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-[#E8EAED] mb-3"/>
            <p className="text-[#6A7686]">Belum ada resep</p>
          </div>
        ) : filteredGrouped.map(group => {
          const { id, menuItem, recipes: groupRecipes } = group;
          const isExpanded = expandedId === id;

          return (
            <div key={id} className="bg-white border border-[#E8EAED] rounded-2xl overflow-hidden hover:shadow-md transition-all">
              <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : id)}>
                <div className="size-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                  {menuItem?.image_emoji || '🍽'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#080C1A]">{menuItem?.name || `Menu #${id}`}</p>
                  <p className="text-xs text-[#6A7686]">
                    {menuItem?.category} · {groupRecipes.length} bahan · Harga {menuItem ? `Rp ${menuItem.price.toLocaleString('id-ID')}` : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setAddModal({ open: true, menuItemId: id }); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-[#165DFF] rounded-lg text-xs font-bold hover:bg-blue-100 cursor-pointer">
                    <Plus className="w-3 h-3"/>Bahan
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6A7686]"/> : <ChevronDown className="w-4 h-4 text-[#6A7686]"/>}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-[#E8EAED]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F8F9FB]">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A7686]">Bahan (Inventori)</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Qty per Sajian</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Stok Sekarang</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A7686]">Catatan</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupRecipes.map(r => (
                        <tr key={r.id} className="border-t border-[#F3F4F3] hover:bg-[#F8F9FB]">
                          <td className="px-5 py-3 font-semibold text-[#080C1A]">{r.inventory_name}</td>
                          <td className="px-5 py-3 text-right text-[#6A7686]">{r.qty_used} {r.unit}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`font-semibold ${r.current_stock <= 0 ? 'text-[#ED6B60]' : r.current_stock < 5 ? 'text-[#F59E0B]' : 'text-[#30B22D]'}`}>
                              {r.current_stock} {r.inventory_unit}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-[#6A7686]">{r.notes || '—'}</td>
                          <td className="px-5 py-3">
                            <button onClick={() => setDeleteItem(r)} className="size-7 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] hover:text-[#ED6B60] cursor-pointer text-[#6A7686]">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {addModal.open && (
        <AddIngredientModal
          menuItemId={addModal.menuItemId}
          menuItems={menuItems}
          inventory={inventory}
          onClose={() => setAddModal({ open: false, menuItemId: null })}
          onSaved={async msg => {
            showToast(msg);
            setAddModal({ open: false, menuItemId: null });
            await load();
          }}
        />
      )}

      {deleteItem && (
        <ConfirmModal
          message={`Hapus bahan "${deleteItem.inventory_name}" dari resep "${deleteItem.menu_name}"?`}
          onConfirm={async () => {
            await apiDelete('/api/recipes', { id: deleteItem.id });
            showToast('Bahan dihapus');
            setDeleteItem(null);
            await load();
          }}
          onCancel={() => setDeleteItem(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast}/>}
    </div>
  );
}

function AddIngredientModal({
  menuItemId, menuItems, inventory, onClose, onSaved
}: {
  menuItemId: number | null;
  menuItems: DBMenuItem[];
  inventory: DBInventoryItem[];
  onClose: () => void;
  onSaved: (m: string) => void;
}) {
  const [selMenuId, setSelMenuId]   = useState(menuItemId ? String(menuItemId) : '');
  const [invId, setInvId]           = useState('');
  const [qty, setQty]               = useState('');
  const [unit, setUnit]             = useState('');
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);

  function handleInvChange(id: string) {
    setInvId(id);
    const inv = inventory.find(i => i.id === parseInt(id));
    if (inv) setUnit(inv.unit);
  }

  async function save() {
    if (!selMenuId || !invId || !qty) { alert('Menu, bahan, dan qty wajib diisi'); return; }
    setSaving(true);
    await apiPost('/api/recipes', {
      menu_item_id: parseInt(selMenuId),
      inventory_item_id: parseInt(invId),
      qty_used: parseFloat(qty),
      unit: unit || 'unit',
      notes,
    });
    onSaved('Bahan resep ditambahkan');
  }

  const inp = 'w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] bg-white';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]">
          <h2 className="font-bold text-xl">Tambah Bahan Resep</h2>
          <button onClick={onClose} className="size-9 flex items-center justify-center rounded-xl hover:bg-[#EFF2F7] cursor-pointer">
            <X className="w-5 h-5 text-[#6A7686]"/>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Menu *</label>
            <select value={selMenuId} onChange={e => setSelMenuId(e.target.value)} className={inp}>
              <option value="">— Pilih menu —</option>
              {menuItems.map(m => <option key={m.id} value={m.id}>{m.image_emoji} {m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Bahan (Inventori) *</label>
            <select value={invId} onChange={e => handleInvChange(e.target.value)} className={inp}>
              <option value="">— Pilih bahan —</option>
              {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (stok: {i.stock} {i.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Qty per Sajian *</label>
              <input type="number" min="0.001" step="0.001" value={qty} onChange={e => setQty(e.target.value)} placeholder="0.018" className={inp}/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Satuan</label>
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="kg, liter, pcs…" className={inp}/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Catatan</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opsional" className={inp}/>
          </div>
        </div>
        <div className="p-6 border-t border-[#E8EAED] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm cursor-pointer">Batal</button>
          <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Tambah Bahan'}
          </button>
        </div>
      </div>
    </div>
  );
}
