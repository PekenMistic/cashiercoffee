'use client';

import { X, Plus, Minus, AlertCircle, Star } from 'lucide-react';
import { useState } from 'react';

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image_emoji: string;
  is_recommended?: boolean;
  stock?: number;
  is_available?: boolean;
}

interface ItemDetailsModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, customizations: Record<string, any>) => void;
}

const fmt = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

const SIZES = ['Small', 'Regular', 'Large'];
const TEMPERATURE_OPTIONS = ['Hot', 'Warm', 'Cold', 'Ice'];
const TOPPINGS = [
  { name: 'Whipped Cream', price: 5000 },
  { name: 'Chocolate Syrup', price: 3000 },
  { name: 'Vanilla Syrup', price: 3000 },
  { name: 'Caramel Syrup', price: 3000 },
];

export function ItemDetailsModal({ item, onClose, onAddToCart }: ItemDetailsModalProps) {
  const [selectedSize, setSelectedSize] = useState('Regular');
  const [selectedTemp, setSelectedTemp] = useState('Hot');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!item) return null;

  const isOutOfStock = item.is_available === false || item.stock === 0;

  const toppingPrice = selectedToppings.reduce(
    (sum, topping) => sum + (TOPPINGS.find((t) => t.name === topping)?.price || 0),
    0
  );
  const sizeMultiplier = selectedSize === 'Small' ? 0.9 : selectedSize === 'Large' ? 1.1 : 1;
  const itemPrice = Math.round(item.price * sizeMultiplier);
  const totalPrice = (itemPrice + toppingPrice) * qty;

  const handleToggleTopping = (topping: string) => {
    setSelectedToppings((prev) =>
      prev.includes(topping) ? prev.filter((t) => t !== topping) : [...prev, topping]
    );
  };

  const handleAddToCart = () => {
    onAddToCart(item, {
      size: selectedSize,
      temperature: selectedTemp,
      toppings: selectedToppings,
      instructions: specialInstructions,
      qty,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[var(--border)] bg-[var(--surface-alt)]">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Detail Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Item Showcase */}
          <div className="text-center bg-[var(--surface-alt)] p-8 rounded-2xl">
            <div className="text-8xl mb-5 inline-block">{item.image_emoji}</div>
            <h3 className="text-3xl font-bold text-[var(--foreground)] mb-3">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.description}</p>
            )}
            {item.is_recommended && (
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-full text-xs font-bold shadow-md">
                <Star className="w-4 h-4" />
                Pilihan Populer
              </div>
            )}
          </div>

          {/* Size Selection */}
          <div className="bg-white p-5 rounded-xl border-2 border-[var(--border)]">
            <h4 className="font-bold text-[var(--foreground)] mb-4 text-sm uppercase tracking-wider">Pilih Ukuran</h4>
            <div className="grid grid-cols-3 gap-3">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                    selectedSize === size
                      ? 'text-white shadow-md'
                      : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]'
                  }`}
                  style={selectedSize === size ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature Selection */}
          <div className="bg-white p-5 rounded-xl border-2 border-[var(--border)]">
            <h4 className="font-bold text-[var(--foreground)] mb-4 text-sm uppercase tracking-wider">Pilih Suhu</h4>
            <div className="grid grid-cols-2 gap-3">
              {TEMPERATURE_OPTIONS.map((temp) => (
                <button
                  key={temp}
                  onClick={() => setSelectedTemp(temp)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                    selectedTemp === temp
                      ? 'text-white shadow-md'
                      : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]'
                  }`}
                  style={selectedTemp === temp ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}
                >
                  {temp}
                </button>
              ))}
            </div>
          </div>

          {/* Toppings */}
          <div className="bg-white p-5 rounded-xl border-2 border-[var(--border)]">
            <h4 className="font-bold text-[var(--foreground)] mb-4 text-sm uppercase tracking-wider">Topping Tambahan</h4>
            <div className="space-y-2.5">
              {TOPPINGS.map((topping) => (
                <label
                  key={topping.name}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    selectedToppings.includes(topping.name)
                      ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-alt)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedToppings.includes(topping.name)}
                    onChange={() => handleToggleTopping(topping.name)}
                    className="w-5 h-5 rounded accent-[var(--primary)] cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[var(--foreground)]">{topping.name}</p>
                  </div>
                  <p className="text-sm font-bold text-[var(--primary)] flex-shrink-0">+{fmt(topping.price)}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white p-5 rounded-xl border-2 border-[var(--border)]">
            <h4 className="font-bold text-[var(--foreground)] mb-3 text-sm uppercase tracking-wider">Catatan Khusus</h4>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Contoh: Kurangi gula, lebih banyak es, tanpa sirup..."
              className="w-full p-4 border-2 border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all resize-none"
              rows={2}
            />
          </div>

          {/* Availability Notice */}
          {isOutOfStock && (
            <div className="flex gap-2 p-3 bg-[var(--error-light)] rounded-lg">
              <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0" />
              <p className="text-sm text-[var(--error-text)]">Item ini sedang tidak tersedia</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] p-5 sm:p-6 bg-[var(--surface-alt)] space-y-4">
          {/* Quantity & Price Section */}
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border-2 border-[var(--border)]">
            {/* Quantity */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-2.5 rounded-lg bg-white border-2 border-[var(--border)] text-[var(--primary)] hover:bg-[var(--surface-alt)] transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg text-[var(--foreground)] w-8 text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="p-2.5 rounded-lg text-white transition-all hover:opacity-95"
                style={{ background: 'var(--primary)' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Total Price */}
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">Total</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                {fmt(totalPrice)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--primary)' }}
            >
              {isOutOfStock ? 'Stok Habis' : 'Tambah ke Pesanan'}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl font-bold border-2 border-[var(--border)] text-[var(--foreground)] hover:bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
