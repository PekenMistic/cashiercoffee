'use client';

import { Plus, Minus, Star, AlertCircle } from 'lucide-react';

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

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  emoji: string;
}

interface MenuCardProps {
  item: MenuItem;
  inCart?: CartItem;
  onAdd: () => void;
  onQtyChange: (delta: number) => void;
  onClick: () => void;
}

const fmt = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

export function MenuCard({
  item,
  inCart,
  onAdd,
  onQtyChange,
  onClick,
}: MenuCardProps) {
  const isOutOfStock = item.is_available === false || item.stock === 0;

  return (
    <div
      onClick={!inCart && !isOutOfStock ? onClick : undefined}
      className={`flex flex-col rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer group ${
        isOutOfStock
          ? 'opacity-55 cursor-not-allowed'
          : 'hover:shadow-lg hover:-translate-y-1.5 hover:border-[var(--primary)]'
      }`}
      style={{
        background: 'var(--surface)',
        border: `2px solid var(--border)`,
        boxShadow: inCart ? '0 4px 16px rgba(139,115,85,0.12)' : 'none',
      }}
    >
      {/* Image/Emoji Area */}
      <div className="relative flex items-center justify-center py-8 px-4 bg-[var(--surface-alt)] min-h-28">
        {/* Recommendation Badge */}
        {item.is_recommended && (
          <div className="absolute top-3 left-3 badge badge-primary flex items-center gap-1.5 px-3 py-2 shadow-sm">
            <Star className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Pilihan</span>
          </div>
        )}

        {/* Emoji - Larger & Animated */}
        <div className="text-7xl group-hover:scale-125 transition-transform duration-300 inline-block">
          {item.image_emoji}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute top-3 right-3 badge badge-red flex items-center gap-1.5 px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Habis</span>
          </div>
        )}

        {/* Quantity Badge In Cart */}
        {inCart && (
          <div
            className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border-4 border-white"
            style={{ background: 'var(--primary)' }}
          >
            {inCart.qty}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="px-5 py-5 flex flex-col gap-3 flex-1">
        {/* Name */}
        <div>
          <h3 className="font-bold text-sm text-[var(--foreground)] leading-snug line-clamp-2">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-1">
              {item.description}
            </p>
          )}
        </div>

        {/* Price & Action Footer */}
        <div className="flex items-end justify-between mt-auto pt-4 border-t-2 border-[var(--border)] gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
              {isOutOfStock ? 'Stok Habis' : 'Harga'}
            </span>
            <p className="font-bold text-lg" style={{ color: 'var(--primary)' }}>
              {fmt(item.price)}
            </p>
          </div>

          {inCart ? (
            <div className="flex items-center gap-1.5 bg-[var(--surface-alt)] rounded-xl p-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQtyChange(-1);
                }}
                className="p-2 rounded-lg transition-all hover:bg-white active:scale-90"
                style={{
                  color: 'var(--primary)',
                }}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold w-6 text-center text-[var(--foreground)]">
                {inCart.qty}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQtyChange(1);
                }}
                className="p-2 rounded-lg transition-all text-white hover:opacity-95 active:scale-90"
                style={{ background: 'var(--primary)' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              disabled={isOutOfStock}
              className="p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg"
              style={{ background: 'var(--primary)' }}
              title={isOutOfStock ? 'Stok habis' : 'Tambah ke pesanan'}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
