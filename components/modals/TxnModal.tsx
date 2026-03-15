'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore, today } from '@/store';

interface TxnModalProps {
  itemId: number | null;
  type: 'in' | 'out';
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export function TxnModal({ itemId, type, onClose, onSaved }: TxnModalProps) {
  const inventory = useStore((s) => s.inventory);
  const addTransaction = useStore((s) => s.addTransaction);

  const [selectedItemId, setSelectedItemId] = useState<number | null>(itemId);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');

  const item = inventory.find((i) => i.id === selectedItemId);

  function save() {
    if (!selectedItemId || !qty || parseFloat(qty) <= 0) {
      alert('Please select an item and enter a valid quantity'); return;
    }
    if (type === 'out' && item && parseFloat(qty) > item.stock) {
      alert(`Cannot remove more than current stock (${item.stock})`); return;
    }
    addTransaction({
      type, itemId: selectedItemId,
      qty: parseFloat(qty),
      price: parseFloat(price) || 0,
      source, note, date: today(),
    });
    onSaved(`Stock ${type === 'in' ? 'added' : 'removed'}: ${qty} ${item?.unit || ''}`);
  }

  const title = type === 'in' ? '➕ Stock In' : '➖ Stock Out';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]">
          <h2 className="font-bold text-xl text-[#080C1A]">{title}</h2>
          <button onClick={onClose} className="size-9 flex items-center justify-center rounded-xl hover:bg-[#EFF2F7] transition-all cursor-pointer">
            <X className="w-5 h-5 text-[#6A7686]" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Item selector (if no pre-selected item) */}
          {itemId === null ? (
            <div>
              <label className="block text-sm font-semibold text-[#080C1A] mb-1.5">Select Item *</label>
              <select
                value={selectedItemId || ''}
                onChange={(e) => setSelectedItemId(parseInt(e.target.value) || null)}
                className="w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] bg-white cursor-pointer"
              >
                <option value="">— Select item —</option>
                {inventory.map((i) => <option key={i.id} value={i.id}>{i.name} (current: {i.stock} {i.unit})</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-[#080C1A] mb-1.5">Item</label>
              <div className="border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm bg-[#EFF2F7] text-[#080C1A] font-semibold">
                {item?.name} (current: {item?.stock} {item?.unit})
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#080C1A] mb-1.5">Quantity *</label>
              <input type="number" min="1" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)}
                className="w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#080C1A] mb-1.5">Unit Price (Rp)</label>
              <input type="number" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#080C1A] mb-1.5">Source / Destination</label>
            <input type="text" placeholder="e.g. Supplier A" value={source} onChange={(e) => setSource(e.target.value)}
              className="w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#080C1A] mb-1.5">Note</label>
            <input type="text" placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] transition-all" />
          </div>
        </div>
        <div className="p-6 border-t border-[#E8EAED] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm hover:ring-[#165DFF] transition-all cursor-pointer">Cancel</button>
          <button onClick={save} className={`px-6 py-2.5 text-white rounded-full font-bold text-sm transition-all cursor-pointer ${type === 'in' ? 'bg-[#30B22D] hover:opacity-90' : 'bg-[#ED6B60] hover:opacity-90'}`}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
