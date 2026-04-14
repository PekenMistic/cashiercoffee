'use client';

import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  emoji: string;
}

interface CartPanelProps {
  items: CartItem[];
  onQtyChange: (itemId: number, delta: number) => void;
  onRemove: (itemId: number) => void;
  onCheckout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const fmt = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const TAX_RATE = 0.1;

export function CartPanel({
  items,
  onQtyChange,
  onRemove,
  onCheckout,
  isOpen,
  onClose,
}: CartPanelProps) {
  const prev = useRef(items.length);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (items.length > prev.current) {
      setPop(true);
      setTimeout(() => setPop(false), 300);
    }
    prev.current = items.length;
  }, [items.length]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  if (!isOpen) {
    if (itemCount === 0) return null;

    return (
      <button
        onClick={onCheckout}
        className={`fixed bottom-6 left-4 right-4 max-w-md mx-auto z-40 px-5 py-4 rounded-xl font-semibold text-white transition-all cursor-pointer ${
          pop ? 'scale-105' : 'scale-100'
        }`}
        style={{ background: 'var(--primary)', boxShadow: '0 4px 12px rgba(139,115,85,0.3)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {itemCount}
            </div>
            <div className="text-left">
              <p className="text-xs opacity-90">Pesan Sekarang</p>
              <p className="text-sm font-bold">{fmt(total)}</p>
            </div>
          </div>
          <div className="text-xs">→</div>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            <ShoppingBag className="w-5 h-5 inline mr-2" />
            Pesanan Anda
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-alt)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 bg-[var(--surface-alt)] rounded-lg"
            >
              <div className="text-3xl">{item.emoji}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-[var(--foreground)] text-sm line-clamp-1">
                  {item.name}
                </h4>
                <p className="text-primary font-bold text-sm mt-1">{fmt(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onQtyChange(item.id, -1)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold w-5 text-center text-[var(--foreground)]">
                  {item.qty}
                </span>
                <button
                  onClick={() => onQtyChange(item.id, 1)}
                  className="p-1.5 rounded-lg transition-colors text-white"
                  style={{ background: 'var(--primary)' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 ml-1 hover:bg-[var(--error-light)] rounded-lg transition-colors text-[var(--error)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="border-t border-[var(--border)] bg-white">
          <div className="p-4 sm:p-6 space-y-4">
            {/* Breakdown */}
            <div className="space-y-3 pb-4 border-b border-[var(--border)]">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Subtotal</span>
                <span className="font-medium text-[var(--foreground)]">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Pajak (10%)</span>
                <span className="font-medium text-[var(--foreground)]">{fmt(tax)}</span>
              </div>
            </div>

            {/* Total - Prominent */}
            <div className="flex justify-between items-center py-2">
              <span className="text-lg font-bold text-[var(--foreground)]">Total</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                {fmt(total)}
              </span>
            </div>
          </div>

          {/* Action Buttons - Full Width */}
          <div className="p-4 sm:p-6 space-y-2 border-t border-[var(--border)] bg-[var(--surface-alt)]">
            <button
              onClick={onCheckout}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-95 active:scale-95"
              style={{ background: 'var(--primary)' }}
            >
              Lanjut Bayar
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold border-2 border-[var(--border)] text-[var(--foreground)] hover:bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
            >
              Lanjut Belanja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
