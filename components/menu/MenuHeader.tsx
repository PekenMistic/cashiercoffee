'use client';

import { Search, X } from 'lucide-react';

interface MenuHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  tableName: string;
}

export function MenuHeader({ searchQuery, onSearchChange, tableName }: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[var(--border)]">
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
        {/* Title */}
        <div className="mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
            Menu
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Meja {tableName}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-lg bg-white text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary-light)]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
