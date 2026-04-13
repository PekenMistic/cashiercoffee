'use client';

import { useState, useMemo, use } from 'react';
import useSWR from 'swr';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { FilterBar } from '@/components/menu/FilterBar';
import { MenuGrid } from '@/components/menu/MenuGrid';
import { CartPanel } from '@/components/menu/CartPanel';
import { ItemDetailsModal } from '@/components/menu/ItemDetailsModal';
import { CheckoutModal } from '@/components/menu/CheckoutModal';
import { AlertCircle, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────
interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image_emoji: string;
  cost: number;
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
  customizations?: Record<string, any>;
}

// ── Constants ─────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Coffee', 'Non-Coffee', 'Food'];
const TAX_RATE = 0.1;

// ── Formatters ────────────────────────────────────────────────────────────
const fmt = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

async function fetcher(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Failed to fetch');
  return r.json();
}

// ── Main Component ────────────────────────────────────────────────────────
export default function MenuPage({ params }: { params: Promise<{ table: string }> }) {
  const { table: tableId } = use(params);
  const { data: menuItems = [], isLoading, error } = useSWR('/api/public/menu', fetcher);

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return menuItems.filter((item: MenuItem) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, activeCategory]);

  // Cart Operations
  const handleAddToCart = (item: MenuItem, customizations?: Record<string, any>) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, qty: c.qty + (customizations?.qty || 1) } : c
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          qty: customizations?.qty || 1,
          emoji: item.image_emoji,
          customizations,
        },
      ];
    });
  };

  const handleQtyChange = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const handleRemoveFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleConfirmOrder = async (paymentMethod: string, notes: string) => {
    setIsSubmitting(true);
    try {
      const orderData = {
        table_id: tableId,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.qty,
          customizations: item.customizations || {},
        })),
        payment_method: paymentMethod,
        notes: notes,
        total: calculateTotal(),
      };

      const response = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error('Failed to create order');

      const { order_id } = await response.json();

      // Reset state after successful order
      setCart([]);
      setIsCheckoutOpen(false);

      // Show success message (you could enhance this with a proper success screen)
      alert(`Pesanan #${order_id} berhasil dibuat! Silakan tunggu...`);
    } catch (err) {
      console.error('Order error:', err);
      alert('Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  const calculateTotal = () => subtotal + tax;

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Memuat menu...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !menuItems) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-[var(--error)] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">
            Gagal memuat menu
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            Silakan coba refresh halaman atau hubungi staff.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <MenuHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        tableName={tableId}
      />

      {/* Filter Bar */}
      <FilterBar
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Menu Grid */}
      <MenuGrid
        items={filteredItems}
        cart={cart}
        onAddToCart={handleAddToCart}
        onQtyChange={handleQtyChange}
        onItemClick={setSelectedItem}
      />

      {/* Padding for floating cart */}
      {cartItemCount > 0 && <div className="h-24" />}

      {/* Modals */}
      <ItemDetailsModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
      />

      <CartPanel
        items={cart}
        onQtyChange={handleQtyChange}
        onRemove={handleRemoveFromCart}
        onCheckout={() => setIsCheckoutOpen(true)}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <CheckoutModal
        items={cart}
        total={total}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirmOrder={handleConfirmOrder}
        isLoading={isSubmitting}
      />
    </div>
  );
}
