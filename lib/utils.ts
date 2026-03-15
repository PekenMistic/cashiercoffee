import { DBInventoryItem } from '@/types/db';

export type StockStatus = 'ok' | 'low' | 'critical';

export function getStockStatus(item: DBInventoryItem): StockStatus {
  if (item.stock <= 0) return 'critical';
  if (item.stock < item.min_stock) return item.stock < item.min_stock * 0.5 ? 'critical' : 'low';
  return 'ok';
}

export function fmtRp(n: number): string {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

export function fmtDate(d: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(d: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function shiftLabel(type: string): string {
  return { morning: 'Pagi (07:00–15:00)', afternoon: 'Siang (15:00–23:00)', evening: 'Malam (23:00–07:00)', full: 'Full Day' }[type] || type;
}

export function shiftColor(type: string): string {
  return { morning: 'bg-yellow-100 text-yellow-800', afternoon: 'bg-blue-100 text-blue-700', evening: 'bg-purple-100 text-purple-700', full: 'bg-green-100 text-green-700' }[type] || 'bg-gray-100 text-gray-700';
}

export function statusColor(status: string): string {
  return {
    scheduled: 'bg-gray-100 text-gray-600',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    absent: 'bg-red-100 text-red-600',
  }[status] || 'bg-gray-100 text-gray-600';
}
