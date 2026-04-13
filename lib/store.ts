import { create } from 'zustand';

export interface CartItem {
  menu_item_id: number;
  name: string;
  category: string;
  price: number;
  qty: number;
  customizations?: Record<string, string>; // e.g., { size: 'Large', extra_shot: 'yes' }
  subtotal: number;
  image_emoji?: string;
}

export interface MenuFilter {
  searchQuery: string;
  selectedCategories: string[];
  dietaryFilters: string[];
  showRecommendedOnly: boolean;
  showAvailableOnly: boolean;
}

export interface CartStore {
  // Cart state
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (menu_item_id: number) => void;
  updateItemQty: (menu_item_id: number, qty: number) => void;
  updateItemCustomizations: (menu_item_id: number, customizations: Record<string, string>) => void;
  clearCart: () => void;
  
  // Cart calculations
  subtotal: number;
  updateSubtotal: () => void;
  
  // Filter state
  filters: MenuFilter;
  setSearchQuery: (query: string) => void;
  toggleCategory: (category: string) => void;
  toggleDietaryFilter: (tag: string) => void;
  toggleRecommendedOnly: () => void;
  toggleAvailableOnly: () => void;
  resetFilters: () => void;
  
  // Modal states
  selectedItemId: number | null;
  setSelectedItemId: (id: number | null) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
}

const initialFilters: MenuFilter = {
  searchQuery: '',
  selectedCategories: [],
  dietaryFilters: [],
  showRecommendedOnly: false,
  showAvailableOnly: true,
};

export const useCartStore = create<CartStore>((set, get) => ({
  // Cart state
  items: [],
  addItem: (item) => {
    set((state) => {
      const existing = state.items.find(i => i.menu_item_id === item.menu_item_id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.menu_item_id === item.menu_item_id
              ? { ...i, qty: i.qty + item.qty, subtotal: i.subtotal + item.subtotal }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
    get().updateSubtotal();
  },
  
  removeItem: (menu_item_id) => {
    set((state) => ({
      items: state.items.filter(i => i.menu_item_id !== menu_item_id),
    }));
    get().updateSubtotal();
  },
  
  updateItemQty: (menu_item_id, qty) => {
    set((state) => ({
      items: state.items
        .map(i =>
          i.menu_item_id === menu_item_id
            ? { ...i, qty: Math.max(0, qty), subtotal: i.price * Math.max(0, qty) }
            : i
        )
        .filter(i => i.qty > 0),
    }));
    get().updateSubtotal();
  },
  
  updateItemCustomizations: (menu_item_id, customizations) => {
    set((state) => ({
      items: state.items.map(i =>
        i.menu_item_id === menu_item_id
          ? { ...i, customizations }
          : i
      ),
    }));
  },
  
  clearCart: () => {
    set({ items: [], subtotal: 0 });
  },
  
  // Cart calculations
  subtotal: 0,
  updateSubtotal: () => {
    const subtotal = get().items.reduce((sum, item) => sum + item.subtotal, 0);
    set({ subtotal: parseFloat(subtotal.toFixed(2)) });
  },
  
  // Filter state
  filters: initialFilters,
  setSearchQuery: (query) => {
    set((state) => ({
      filters: { ...state.filters, searchQuery: query },
    }));
  },
  
  toggleCategory: (category) => {
    set((state) => {
      const selected = state.filters.selectedCategories;
      const updated = selected.includes(category)
        ? selected.filter(c => c !== category)
        : [...selected, category];
      return {
        filters: { ...state.filters, selectedCategories: updated },
      };
    });
  },
  
  toggleDietaryFilter: (tag) => {
    set((state) => {
      const filters = state.filters.dietaryFilters;
      const updated = filters.includes(tag)
        ? filters.filter(f => f !== tag)
        : [...filters, tag];
      return {
        filters: { ...state.filters, dietaryFilters: updated },
      };
    });
  },
  
  toggleRecommendedOnly: () => {
    set((state) => ({
      filters: {
        ...state.filters,
        showRecommendedOnly: !state.filters.showRecommendedOnly,
      },
    }));
  },
  
  toggleAvailableOnly: () => {
    set((state) => ({
      filters: {
        ...state.filters,
        showAvailableOnly: !state.filters.showAvailableOnly,
      },
    }));
  },
  
  resetFilters: () => {
    set({ filters: initialFilters });
  },
  
  // Modal states
  selectedItemId: null,
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  
  checkoutOpen: false,
  setCheckoutOpen: (open) => set({ checkoutOpen: open }),
}));
