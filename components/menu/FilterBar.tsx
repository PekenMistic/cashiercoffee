'use client';

import { ChevronRight } from 'lucide-react';

interface FilterBarProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  All: '🍽️',
  Coffee: '☕',
  'Non-Coffee': '🍵',
  Food: '🥐',
};

export function FilterBar({ categories, activeCategory, onCategoryChange }: FilterBarProps) {
  return (
    <div className="sticky top-[120px] sm:top-[140px] z-20 bg-white border-b border-[var(--border)] shadow-sm">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl whitespace-nowrap transition-all font-bold text-sm flex-shrink-0 ${
                activeCategory === category
                  ? 'text-white shadow-md'
                  : 'bg-white border-2 border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
              }`}
              style={activeCategory === category ? { background: 'var(--primary)' } : {}}
            >
              <span className="text-lg">{CATEGORY_ICONS[category] || '🍽️'}</span>
              <span className="hidden sm:inline">{category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
