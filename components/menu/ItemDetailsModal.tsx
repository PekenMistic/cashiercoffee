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
        {/* Header with Close */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Detail Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-alt)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Item Info */}
          <div className="text-center">
            <div className="text-7xl mb-4">{item.image_emoji}</div>
            <h3 className="text-2xl font-bold text-[var(--foreground)]">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-[var(--text-secondary)] mt-2">{item.description}</p>
            )}
            {item.is_recommended && (
              <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-[var(--primary-light)] text-[var(--primary)] rounded-full text-xs font-bold">
                <Star className="w-3 h-3" />
                Favorit
              </div>
            )}
          </div>

          {/* Size Selection */}
          <div>
            <h4 className="font-semibold text-[var(--foreground)] mb-3">Ukuran</h4>
            <div className="grid grid-cols-3 gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 rounded-lg font-medium text-sm transition-all ${
                    selectedSize === size
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--foreground)]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature Selection */}
          <div>
            <h4 className="font-semibold text-[var(--foreground)] mb-3">Suhu</h4>
            <div className="grid grid-cols-4 gap-2">
              {TEMPERATURE_OPTIONS.map((temp) => (
                <button
                  key={temp}
                  onClick={() => setSelectedTemp(temp)}
                  className={`py-2 rounded-lg font-medium text-xs transition-all ${
                    selectedTemp === temp
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--foreground)]'
                  }`}
                >
                  {temp}
                </button>
              ))}
            </div>
          </div>

          {/* Toppings */}
          <div>
            <h4 className="font-semibold text-[var(--foreground)] mb-3">Topping Tambahan</h4>
            <div className="space-y-2">
              {TOPPINGS.map((topping) => (
                <label
                  key={topping.name}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-alt)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedToppings.includes(topping.name)}
                    onChange={() => handleToggleTopping(topping.name)}
                    className="w-4 h-4 rounded accent-[var(--primary)]"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-[var(--foreground)]">{topping.name}</p>
                  </div>
                  <p className="text-xs font-bold text-[var(--primary)]">+{fmt(topping.price)}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <h4 className="font-semibold text-[var(--foreground)] mb-3">Catatan Khusus</h4>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Misalnya: Kurangi gula, lebih banyak Es..."
              className="w-full p-3 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary-light)]"
              rows={3}
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
        <div className="border-t border-[var(--border)] p-4 sm:p-6 bg-white space-y-3">
          {/* Quantity Selector */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="p-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-secondary)]"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center font-bold text-lg text-[var(--foreground)]">
              {qty}
            </span>
            <button
              onClick={() => setQty(qty + 1)}
              className="p-2 rounded-lg bg-[var(--primary)] text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right mb-4">
            <p className="text-xs text-[var(--text-secondary)]">Total Harga</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
              {fmt(totalPrice)}
            </p>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--primary)' }}
          >
            Tambah ke Pesanan
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg font-semibold border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-alt)] transition-all"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
