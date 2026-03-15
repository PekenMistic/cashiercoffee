'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useStore } from '@/store';
import { InventoryItem } from '@/types';

interface ItemModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export function ItemModal({ item, onClose, onSaved }: ItemModalProps) {
  const categories = useStore((s) => s.categories);
  const suppliers = useStore((s) => s.suppliers);
  const addItem = useStore((s) => s.addItem);
  const updateItem = useStore((s) => s.updateItem);

  const [form, setForm] = useState({
    name: '', category: '', unit: 'kg', stock: '', minStock: '', maxStock: '', cost: '', supplier: '', expiry: '', notes: '',
  });

  useEffect(() => {
    if (item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: item.name, category: String(item.category), unit: item.unit,
        stock: String(item.stock), minStock: String(item.minStock), maxStock: String(item.maxStock),
        cost: String(item.cost), supplier: item.supplier ? String(item.supplier) : '',
        expiry: item.expiry, notes: item.notes,
      });
    }
  }, [item]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function save() {
    if (!form.name.trim() || !form.category) { alert('Please fill required fields'); return; }
    const data = {
      name: form.name.trim(), category: parseInt(form.category), unit: form.unit,
      stock: parseFloat(form.stock) || 0, minStock: parseFloat(form.minStock) || 0,
      maxStock: parseFloat(form.maxStock) || 100, cost: parseFloat(form.cost) || 0,
      supplier: form.supplier ? parseInt(form.supplier) : null,
      expiry: form.expiry, notes: form.notes,
    };
    if (item) { updateItem(item.id, data); onSaved('Item updated successfully'); }
    else { addItem(data); onSaved('Item added successfully'); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]">
          <h2 className="font-bold text-xl text-[#080C1A]">{item ? 'Edit Item' : 'Add Inventory Item'}</h2>
          <button onClick={onClose} className="size-9 flex items-center justify-center rounded-xl hover:bg-[#EFF2F7] transition-all cursor-pointer">
            <X className="w-5 h-5 text-[#6A7686]" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Item Name *</Label>
              <Input placeholder="e.g. Arabica Coffee Beans" value={form.name} onChange={(v) => set('name', v)} />
            </div>
            <div>
              <Label>Category *</Label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={selectCls}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Unit</Label>
              <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className={selectCls}>
                {['kg','g','liter','ml','pcs','box','pack','bottle','sachet'].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <Label>Current Stock *</Label>
              <Input type="number" placeholder="0" value={form.stock} onChange={(v) => set('stock', v)} />
            </div>
            <div>
              <Label>Min Stock (Reorder)</Label>
              <Input type="number" placeholder="10" value={form.minStock} onChange={(v) => set('minStock', v)} />
            </div>
            <div>
              <Label>Max Stock</Label>
              <Input type="number" placeholder="100" value={form.maxStock} onChange={(v) => set('maxStock', v)} />
            </div>
            <div>
              <Label>Unit Cost (Rp)</Label>
              <Input type="number" placeholder="0" value={form.cost} onChange={(v) => set('cost', v)} />
            </div>
            <div className="col-span-2">
              <Label>Supplier</Label>
              <select value={form.supplier} onChange={(e) => set('supplier', e.target.value)} className={selectCls}>
                <option value="">None</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Expiry Date</Label>
              <input type="date" value={form.expiry} onChange={(e) => set('expiry', e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)}
                placeholder="Optional notes..."
                className="w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] transition-all resize-none" />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-[#E8EAED] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm hover:ring-[#165DFF] transition-all cursor-pointer">Cancel</button>
          <button onClick={save} className="px-6 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] transition-all cursor-pointer">Save Item</button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] transition-all';
const selectCls = `${inputCls} bg-white cursor-pointer`;

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-[#080C1A] mb-1.5">{children}</label>;
}

function Input({ placeholder, value, onChange, type = 'text' }: { placeholder?: string; value: string; onChange: (v: string) => void; type?: string }) {
  return <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
}
