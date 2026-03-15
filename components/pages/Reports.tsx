'use client';
import { useEffect, useRef, useState } from 'react';
import { Package, DollarSign, TrendingUp, AlertTriangle, Printer, RefreshCw, ShoppingCart, CreditCard } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { fmtRp, fmtDate } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

Chart.register(...registerables);

type Period = 'today' | 'week' | 'month';

interface ReportsData {
  period: string;
  orderSummary: { total_orders: number; total_revenue: number; total_discount: number; avg_order_value: number };
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  revenueByCategory: { category: string; revenue: number; qty: number }[];
  paymentBreakdown: { payment_method: string; count: number; total: number }[];
  cashierPerformance: { cashier_name: string; total_orders: number; total_revenue: number }[];
  inventoryStats: { total_items: number; total_value: number; low_stock: number; critical_stock: number; out_of_stock: number };
  expiringItems: { id: number; name: string; stock: number; unit: string; expiry: string }[];
  stockMovement: { date: string; in_qty: number; out_qty: number; in_value: number }[];
  shiftSummary: { total_shifts: number; total_hours: number; total_wage: number };
  todayStats: { today_orders: number; today_revenue: number };
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-[#165DFF] border-t-transparent rounded-full"/></div>;
}

function KPI({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white border border-[#E8EAED] rounded-2xl p-5">
      <div className={`size-10 ${color} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xs text-[#6A7686] mb-0.5">{label}</p>
      <p className="font-bold text-[#080C1A] text-lg leading-tight">{value}</p>
      {sub && <p className="text-xs text-[#6A7686]">{sub}</p>}
    </div>
  );
}

const PERIOD_LABELS: Record<Period, string> = { today: 'Hari Ini', week: '7 Hari', month: '30 Hari' };
const PAY_LABELS: Record<string, string> = { cash: 'Tunai', card: 'Kartu', qris: 'QRIS' };

export function Reports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');

  // Chart refs
  const revRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLCanvasElement>(null);
  const catRef = useRef<HTMLCanvasElement>(null);
  const stkRef = useRef<HTMLCanvasElement>(null);
  const revInst = useRef<Chart|null>(null);
  const topInst = useRef<Chart|null>(null);
  const catInst = useRef<Chart|null>(null);
  const stkInst = useRef<Chart|null>(null);

  async function load(p: Period) {
    setLoading(true);
    const d = await apiFetch<ReportsData>(`/api/reports?period=${p}`);
    setData(d);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(period); }, [period]);

  useEffect(() => {
    if (!data) return;

    // Revenue trend chart
    if (revRef.current && data.revenueByDay.length > 0) {
      revInst.current?.destroy();
      revInst.current = new Chart(revRef.current, {
        type: 'line',
        data: {
          labels: data.revenueByDay.map(r => fmtDate(r.date).slice(0,6)),
          datasets: [{
            label: 'Revenue', data: data.revenueByDay.map(r => r.revenue),
            borderColor: '#165DFF', backgroundColor: 'rgba(22,93,255,0.1)',
            borderWidth: 2, fill: true, tension: 0.4, pointRadius: 3,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 10 } },
            y: { beginAtZero: true, grid: { color: '#F3F4F3' }, border: { display: false },
              ticks: { font: { size: 10 }, callback: (v) => 'Rp '+(Number(v)/1000).toFixed(0)+'K' }}
          }
        }
      });
    }

    // Top products chart
    if (topRef.current && data.topProducts.length > 0) {
      topInst.current?.destroy();
      topInst.current = new Chart(topRef.current, {
        type: 'bar',
        data: {
          labels: data.topProducts.slice(0,8).map(p => p.name.length>12?p.name.slice(0,12)+'…':p.name),
          datasets: [{ label: 'Qty', data: data.topProducts.slice(0,8).map(p => p.qty),
            backgroundColor: '#165DFF', borderRadius: 6, borderSkipped: false }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: '#F3F4F3' }, border: { display: false }, ticks: { font: { size: 10 } } },
            y: { grid: { display: false }, ticks: { font: { size: 11 } } }
          }
        }
      });
    }

    // Category revenue chart
    if (catRef.current && data.revenueByCategory.length > 0) {
      catInst.current?.destroy();
      catInst.current = new Chart(catRef.current, {
        type: 'doughnut',
        data: {
          labels: data.revenueByCategory.map(c => c.category),
          datasets: [{ data: data.revenueByCategory.map(c => c.revenue),
            backgroundColor: ['#165DFF','#30B22D','#F59E0B','#ED6B60','#9333EA'],
            borderWidth: 0, hoverOffset: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, borderRadius: 4, padding: 8 } } }
        }
      });
    }

    // Stock status chart
    if (stkRef.current) {
      stkInst.current?.destroy();
      const { low_stock, critical_stock, total_items } = data.inventoryStats;
      const ok = total_items - low_stock;
      stkInst.current = new Chart(stkRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Aman','Menipis','Kritis'],
          datasets: [{ data: [ok, low_stock, critical_stock],
            backgroundColor: ['#30B22D','#F59E0B','#ED6B60'], borderWidth: 0, hoverOffset: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, borderRadius: 4, padding: 8 } } }
        }
      });
    }

    return () => { revInst.current?.destroy(); topInst.current?.destroy(); catInst.current?.destroy(); stkInst.current?.destroy(); };
  }, [data]);

  if (loading || !data) return <Spinner />;

  const { orderSummary, inventoryStats, paymentBreakdown, shiftSummary, expiringItems, cashierPerformance, topProducts } = data;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#080C1A]">Laporan & Analitik</h1>
          <p className="text-[#6A7686] text-sm">Periode: {PERIOD_LABELS[period]}</p>
        </div>
        <div className="flex gap-2">
          {(['today','week','month'] as Period[]).map(p=>(
            <button key={p} onClick={()=>setPeriod(p)}
              className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${period===p?'bg-[#165DFF] text-white':'ring-1 ring-[#E8EAED] hover:ring-[#165DFF] text-[#080C1A]'}`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
          <button onClick={()=>load(period)} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] cursor-pointer">
            <RefreshCw className="w-4 h-4 text-[#6A7686]"/>
          </button>
          <button onClick={()=>window.print()} className="flex items-center gap-2 px-5 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm hover:ring-[#165DFF] cursor-pointer">
            <Printer className="w-4 h-4"/>Print
          </button>
        </div>
      </div>

      {/* Sales KPIs */}
      <div>
        <h2 className="text-sm font-bold text-[#6A7686] uppercase tracking-wider mb-3">Penjualan</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI icon={<ShoppingCart className="w-5 h-5 text-[#165DFF]"/>} color="bg-blue-50" label="Total Pesanan" value={String(orderSummary.total_orders)} sub={`avg ${fmtRp(orderSummary.avg_order_value)}`}/>
          <KPI icon={<DollarSign className="w-5 h-5 text-[#30B22D]"/>} color="bg-[#DCFCE7]" label="Total Revenue" value={fmtRp(orderSummary.total_revenue)}/>
          <KPI icon={<TrendingUp className="w-5 h-5 text-[#F59E0B]"/>} color="bg-[#FEF3C7]" label="Total Diskon" value={fmtRp(orderSummary.total_discount)}/>
          <KPI icon={<CreditCard className="w-5 h-5 text-[#9333EA]"/>} color="bg-[#F3E8FF]" label="Upah Karyawan" value={fmtRp(shiftSummary.total_wage)} sub={`${shiftSummary.total_hours.toFixed(1)} jam kerja`}/>
        </div>
      </div>

      {/* Revenue trend + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-6">
          <h3 className="font-bold text-[#080C1A] mb-4">Tren Revenue</h3>
          <div className="h-[220px]">
            {data.revenueByDay.length===0
              ?<div className="h-full flex items-center justify-center text-sm text-[#6A7686]">Belum ada data penjualan</div>
              :<canvas ref={revRef}/>}
          </div>
        </div>

        <div className="bg-white border border-[#E8EAED] rounded-2xl p-6">
          <h3 className="font-bold text-[#080C1A] mb-4">Produk Terlaris</h3>
          <div className="h-[220px]">
            {topProducts.length===0
              ?<div className="h-full flex items-center justify-center text-sm text-[#6A7686]">Belum ada data</div>
              :<canvas ref={topRef}/>}
          </div>
        </div>
      </div>

      {/* Category breakdown + payment + stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-6">
          <h3 className="font-bold text-[#080C1A] mb-4">Revenue per Kategori Menu</h3>
          <div className="h-[200px]">
            {data.revenueByCategory.length===0
              ?<div className="h-full flex items-center justify-center text-sm text-[#6A7686]">Belum ada data</div>
              :<canvas ref={catRef}/>}
          </div>
        </div>

        <div className="bg-white border border-[#E8EAED] rounded-2xl p-6">
          <h3 className="font-bold text-[#080C1A] mb-4">Metode Pembayaran</h3>
          {paymentBreakdown.length===0?(
            <p className="text-sm text-[#6A7686] text-center py-8">Belum ada data</p>
          ):(
            <div className="space-y-3 mt-2">
              {paymentBreakdown.map(p=>{
                const pct = orderSummary.total_revenue>0?Math.round((p.total/orderSummary.total_revenue)*100):0;
                return (
                  <div key={p.payment_method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-[#080C1A]">{PAY_LABELS[p.payment_method]||p.payment_method}</span>
                      <span className="text-[#6A7686]">{p.count}x · {fmtRp(p.total)}</span>
                    </div>
                    <div className="h-2 bg-[#EFF2F7] rounded-full overflow-hidden">
                      <div className="h-full bg-[#165DFF] rounded-full" style={{width:`${pct}%`}}/>
                    </div>
                    <p className="text-xs text-[#6A7686] text-right mt-0.5">{pct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E8EAED] rounded-2xl p-6">
          <h3 className="font-bold text-[#080C1A] mb-4">Kondisi Stok</h3>
          <div className="h-[200px]"><canvas ref={stkRef}/></div>
        </div>
      </div>

      {/* Inventory KPIs */}
      <div>
        <h2 className="text-sm font-bold text-[#6A7686] uppercase tracking-wider mb-3">Inventori</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI icon={<Package className="w-5 h-5 text-[#165DFF]"/>} color="bg-blue-50" label="Total SKU" value={String(inventoryStats.total_items)}/>
          <KPI icon={<DollarSign className="w-5 h-5 text-[#30B22D]"/>} color="bg-[#DCFCE7]" label="Nilai Total Stok" value={fmtRp(inventoryStats.total_value)}/>
          <KPI icon={<AlertTriangle className="w-5 h-5 text-[#F59E0B]"/>} color="bg-[#FEF3C7]" label="Stok Rendah" value={String(inventoryStats.low_stock)} sub={`${inventoryStats.critical_stock} kritis`}/>
          <KPI icon={<Package className="w-5 h-5 text-[#ED6B60]"/>} color="bg-[#FEE2E2]" label="Stok Habis" value={String(inventoryStats.out_of_stock)} sub="item"/>
        </div>
      </div>

      {/* Cashier perf + expiring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E8EAED] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[#E8EAED]">
            <h3 className="font-bold text-[#080C1A]">Performa Kasir</h3>
          </div>
          {cashierPerformance.length===0?(
            <p className="text-sm text-[#6A7686] text-center py-8">Belum ada data</p>
          ):(
            <table className="w-full text-sm">
              <thead><tr className="bg-[#F8F9FB]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A7686]">Kasir</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Pesanan</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Revenue</th>
              </tr></thead>
              <tbody>
                {cashierPerformance.map((c,i)=>(
                  <tr key={i} className="border-t border-[#F3F4F3] hover:bg-[#F8F9FB]">
                    <td className="px-5 py-3 font-semibold text-[#080C1A]">{c.cashier_name}</td>
                    <td className="px-5 py-3 text-right text-[#6A7686]">{c.total_orders}</td>
                    <td className="px-5 py-3 text-right font-bold text-[#165DFF]">{fmtRp(c.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border border-[#E8EAED] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[#E8EAED]">
            <h3 className="font-bold text-[#080C1A]">Item Mendekati Expired <span className="text-xs font-normal text-[#6A7686]">(7 hari ke depan)</span></h3>
          </div>
          {expiringItems.length===0?(
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#30B22D]">
              <Package className="w-8 h-8"/><p className="text-sm font-semibold">Tidak ada item mendekati expired ✓</p>
            </div>
          ):(
            <table className="w-full text-sm">
              <thead><tr className="bg-[#F8F9FB]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A7686]">Item</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Stok</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Expired</th>
              </tr></thead>
              <tbody>
                {expiringItems.map(item=>(
                  <tr key={item.id} className="border-t border-[#F3F4F3]">
                    <td className="px-5 py-3 font-semibold text-[#080C1A]">{item.name}</td>
                    <td className="px-5 py-3 text-right text-[#6A7686]">{item.stock} {item.unit}</td>
                    <td className="px-5 py-3 text-right font-bold text-[#F59E0B]">{fmtDate(item.expiry)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Top products table */}
      {topProducts.length>0&&(
        <div className="bg-white border border-[#E8EAED] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[#E8EAED]"><h3 className="font-bold text-[#080C1A]">Detail Produk Terlaris</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-[#F8F9FB]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A7686]">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A7686]">Produk</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Qty Terjual</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Revenue</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Kontribusi</th>
              </tr></thead>
              <tbody>
                {topProducts.map((p,i)=>{
                  const pct=orderSummary.total_revenue>0?((p.revenue/orderSummary.total_revenue)*100).toFixed(1):'0';
                  return (
                    <tr key={i} className="border-t border-[#F3F4F3] hover:bg-[#F8F9FB]">
                      <td className="px-5 py-3 text-[#6A7686] font-mono text-xs">{i+1}</td>
                      <td className="px-5 py-3 font-semibold text-[#080C1A]">{p.name}</td>
                      <td className="px-5 py-3 text-right text-[#6A7686]">{p.qty}</td>
                      <td className="px-5 py-3 text-right font-bold text-[#165DFF]">{fmtRp(p.revenue)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="px-2 py-0.5 bg-blue-50 text-[#165DFF] rounded-full text-xs font-semibold">{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
