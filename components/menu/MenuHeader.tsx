'use client';

import { Search, X } from 'lucide-react';

interface MenuHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  tableName: string;
}

export function MenuHeader({ searchQuery, onSearchChange, tableName }: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[var(--border)] shadow-sm">
      <div className="w-full px-4 sm:px-6 py-5 sm:py-7">
        {/* Top Row: Title & Table Badge */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] leading-tight">
              Menu Restoran
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2">
              Pilih item menu yang Anda inginkan
            </p>
          </div>
          {/* Table Badge */}
          <div className="flex flex-col items-center justify-center bg-[var(--primary-light)] px-4 py-3 rounded-xl border-2 border-[var(--primary)]">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">Meja</p>
            <p className="text-2xl font-bold text-[var(--primary)]">#{tableName}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
            className="w-full pl-12 pr-12 py-3.5 border-2 border-[var(--border)] rounded-xl bg-white text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-alt)] rounded-lg transition-all"
              title="Bersihkan pencarian"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
