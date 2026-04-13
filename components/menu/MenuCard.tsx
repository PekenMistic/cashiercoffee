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
      className={`flex flex-col rounded-xl overflow-hidden transition-all duration-200 cursor-pointer group ${
        isOutOfStock
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-md hover:-translate-y-1'
      }`}
      style={{
        background: 'var(--surface)',
        border: `1px solid var(--border)`,
        boxShadow: inCart ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {/* Image Area */}
      <div className="relative flex items-center justify-center py-6 px-4 bg-[var(--surface-alt)]">
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          {item.is_recommended && (
            <div className="badge badge-primary flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>Favorit</span>
            </div>
          )}
          {isOutOfStock && (
            <div className="badge badge-red flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Habis</span>
            </div>
          )}
        </div>

        {/* Emoji/Image */}
        <div className="text-center">
          <div className="text-6xl mb-2 group-hover:scale-110 transition-transform duration-300 inline-block">
            {item.image_emoji}
          </div>
        </div>

        {/* Quantity Badge */}
        {inCart && (
          <div
            className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--primary)' }}
          >
            {inCart.qty}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-4 flex flex-col gap-3 flex-1">
        {/* Name */}
        <div>
          <h3 className="font-bold text-sm text-[var(--foreground)] leading-tight line-clamp-2">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--border)]">
          <div>
            <p className="font-bold text-base" style={{ color: 'var(--primary)' }}>
              {fmt(item.price)}
            </p>
          </div>

          {inCart ? (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQtyChange(-1);
                }}
                className="p-1.5 rounded-lg transition-colors"
                style={{
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)',
                }}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold w-5 text-center text-[var(--foreground)]">
                {inCart.qty}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQtyChange(1);
                }}
                className="p-1.5 rounded-lg transition-colors text-white"
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
              className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{ background: 'var(--primary)' }}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
