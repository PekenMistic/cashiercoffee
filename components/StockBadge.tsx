import { InventoryItem } from '@/types';
import { getStockStatus } from '@/store';

export function StockBadge({ item }: { item: InventoryItem }) {
  const status = getStockStatus(item);
  if (status === 'critical') return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#ED6B60]">Critical</span>
  );
  if (status === 'low') return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#F59E0B]">Low Stock</span>
  );
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#30B22D]">In Stock</span>
  );
}
