'use client';

import { MenuCard } from './MenuCard';

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

interface MenuGridProps {
  items: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onQtyChange: (itemId: number, delta: number) => void;
  onItemClick: (item: MenuItem) => void;
}

export function MenuGrid({
  items,
  cart,
  onAddToCart,
  onQtyChange,
  onItemClick,
}: MenuGridProps) {
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-lg text-[var(--text-secondary)] font-medium">
          Tidak ada menu yang ditemukan
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-2">
          Coba ubah filter atau pencarian Anda
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6">
        {items.map((item) => {
          const inCart = cart.find((c) => c.id === item.id);
          return (
            <MenuCard
              key={item.id}
              item={item}
              inCart={inCart}
              onAdd={() => onAddToCart(item)}
              onQtyChange={(delta) => onQtyChange(item.id, delta)}
              onClick={() => onItemClick(item)}
            />
          );
        })}
      </div>
    </div>
  );
}
