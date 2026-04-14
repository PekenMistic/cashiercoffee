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
      <div className="flex items-center justify-center min-h-64 px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-5 opacity-30">🔍</div>
          <p className="text-lg font-bold text-[var(--foreground)] mb-2">
            Tidak ada menu yang ditemukan
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Coba ubah filter, kategori, atau kata kunci pencarian Anda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
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
