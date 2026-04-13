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
    <div className="sticky top-[120px] sm:top-[140px] z-20 bg-white border-b border-[var(--border)]">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium text-sm ${
                activeCategory === category
                  ? 'bg-[var(--primary)] text-white shadow-md'
                  : 'bg-[var(--surface-alt)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              <span className="text-lg">{CATEGORY_ICONS[category] || '🍽️'}</span>
              <span>{category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
