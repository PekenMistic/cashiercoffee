'use client';
import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import { Package, DollarSign, AlertTriangle, TrendingUp, Users, Clock, ShoppingCart, RefreshCw, ArrowUpRight, ArrowDownRight, CalendarX } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { fmtRp, fmtDateTime } from '@/lib/utils';

Chart.register(...registerables);

interface DData {
  todaySales:      { orders: number; revenue: number; avg: number };
  yesterdaySales:  { orders: number; revenue: number };
  inventoryAlerts: { low: number; critical: number; expiring: number };
  inventoryValue:  { total: number; items: number };
  activeShifts:    { active: number; total: number };
  activeEmployees: { count: number };
  recentOrders:    { id: number; order_no: string; total: number; payment_method: string; created_at: string; cashier_name: string }[];
  weekRevenue:     { date: string; revenue: number }[];
  lowStockItems:   { id: number; name: string; stock: number; min_stock: number; unit: string; category_name: string }[];
  topMenuToday:    { name: string; qty: number; revenue: number }[];
}

function pct(a: number, b: number) { return b===0 ? (a>0?100:0) : Math.round(((a-b)/b)*100); }

function KPI({ label, value, sub, icon, bg, change }: { label: string; value: string; sub?: string; icon: React.ReactNode; bg: string; change?: number }) {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`size-10 ${bg} rounded-xl flex items-center justify-center`}>{icon}</div>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${change>=0?'text-[var(--success)]':'text-[var(--error)]'}`}>
            {change>=0?<ArrowUpRight className="w-3 h-3"/>:<ArrowDownRight className="w-3 h-3"/>}{Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-0.5">{label}</p>
      <p className="font-bold text-[var(--foreground)] text-lg leading-tight">{value}</p>
      {sub && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
    </div>
  );
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full"/></div>;
}

export function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const weekRef = useRef<HTMLCanvasElement>(null);
  const topRef  = useRef<HTMLCanvasElement>(null);
  const weekInst = useRef<Chart|null>(null);
  const topInst  = useRef<Chart|null>(null);

  const { data, isLoading: loading, mutate: reload } = useSWR<DData>('/api/dashboard');

  useEffect(() => {
    if (!data) return;

    if (weekRef.current) {
      weekInst.current?.destroy();
      const labels: string[] = []; const vals: number[] = [];
      for (let i=6; i>=0; i--) {
        const d = new Date(); d.setDate(d.getDate()-i);
        const ds = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('id-ID',{weekday:'short',day:'2-digit'}));
        vals.push(data.weekRevenue.find(r=>r.date===ds)?.revenue??0);
      }
      weekInst.current = new Chart(weekRef.current, {
        type: 'bar',
        data: { labels, datasets: [{ data: vals,
          backgroundColor: vals.map((_,i)=>i===vals.length-1?'#165DFF':'#BFCFFF'),
          borderRadius: 8, borderSkipped: false }]},
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
          scales: { x:{grid:{display:false},ticks:{font:{size:11}}}, y:{beginAtZero:true, grid:{color:'#F2F4F7'}, border:{display:false}, ticks:{font:{size:10},callback:v=>'Rp '+(Number(v)/1000)+'K'}}}},
      });
    }
    if (topRef.current && data.topMenuToday.length>0) {
      topInst.current?.destroy();
      topInst.current = new Chart(topRef.current, {
        type: 'doughnut',
        data: { labels: data.topMenuToday.map(m=>m.name), datasets:[{data:data.topMenuToday.map(m=>m.qty), backgroundColor:['#165DFF','#16A34A','#D97706','#DC2626','#7C3AED'], borderWidth:0, hoverOffset:4}]},
        options: { responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{legend:{position:'bottom',labels:{font:{size:11},boxWidth:10,borderRadius:3,padding:8}}}},
      });
    }
    return () => { weekInst.current?.destroy(); topInst.current?.destroy(); };
  }, [data, reload]);

  if (loading||!data) return <Spinner/>;

  const revChange = pct(data.todaySales.revenue, data.yesterdaySales.revenue);
  const ordChange = pct(data.todaySales.orders,  data.yesterdaySales.orders);

  return (
    <div className="fade-in space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Dashboard</h1>
          <p className="text-xs text-[var(--text-secondary)]">{new Date().toLocaleDateString('id-ID',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</p>
        </div>
        <button onClick={() => reload()} className="size-9 flex items-center justify-center rounded-xl border border-[var(--border)] hover:border-[var(--primary)] cursor-pointer transition-colors">
          <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]"/>
        </button>
      </div>

      {/* KPI grid — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPI label="Revenue Hari Ini" value={fmtRp(data.todaySales.revenue)} sub={`avg ${fmtRp(data.todaySales.avg)}`}
          icon={<DollarSign className="w-5 h-5 text-[var(--primary)]"/>} bg="bg-[var(--primary-light)]" change={revChange}/>
        <KPI label="Pesanan Hari Ini" value={String(data.todaySales.orders)} sub={`${data.activeShifts.active} shift aktif`}
          icon={<ShoppingCart className="w-5 h-5 text-[var(--success)]"/>} bg="bg-[var(--success-light)]" change={ordChange}/>
        <div className="card p-4 md:p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={()=>onNavigate('inventory')}>
          <div className="size-10 bg-[var(--warning-light)] rounded-xl flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-[var(--warning)]"/>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-0.5">Alert Stok</p>
          <p className="font-bold text-[var(--foreground)] text-lg leading-tight">{data.inventoryAlerts.critical} kritis · {data.inventoryAlerts.low} rendah</p>
          {data.inventoryAlerts.expiring>0 && <p className="text-xs text-[var(--warning)] mt-0.5">{data.inventoryAlerts.expiring} mendekati exp</p>}
        </div>
        <KPI label="Nilai Inventori" value={fmtRp(data.inventoryValue.total)} sub={`${data.inventoryValue.items} SKU`}
          icon={<Package className="w-5 h-5 text-purple-600"/>} bg="bg-purple-50"/>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 md:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div><p className="font-bold text-sm text-[var(--foreground)]">Revenue 7 Hari</p><p className="text-xs text-[var(--text-tertiary)]">Biru gelap = hari ini</p></div>
            <TrendingUp className="w-4 h-4 text-[var(--text-tertiary)]"/>
          </div>
          <div className="h-44"><canvas ref={weekRef}/></div>
        </div>
        <div className="card p-4 md:p-5">
          <p className="font-bold text-sm text-[var(--foreground)] mb-4">Top Menu Hari Ini</p>
          {data.topMenuToday.length===0
            ? <div className="h-44 flex flex-col items-center justify-center gap-2 text-[var(--text-tertiary)]"><ShoppingCart className="w-8 h-8 opacity-30"/><p className="text-xs">Belum ada pesanan</p></div>
            : <div className="h-44"><canvas ref={topRef}/></div>}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <p className="font-bold text-sm text-[var(--foreground)]">Pesanan Terakhir</p>
            <button onClick={()=>onNavigate('pos')} className="text-xs text-[var(--primary)] font-semibold hover:underline cursor-pointer">Buka POS →</button>
          </div>
          {data.recentOrders.length===0
            ? <p className="text-sm text-[var(--text-tertiary)] text-center py-8">Belum ada pesanan</p>
            : <div className="divide-y divide-[var(--border)]">
                {data.recentOrders.map(o=>(
                  <div key={o.id} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--muted)] transition-colors">
                    <div>
                      <p className="text-xs font-bold text-[var(--foreground)]">{o.order_no}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{o.cashier_name} · {fmtDateTime(o.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--primary)]">{fmtRp(o.total)}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] capitalize">{o.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>}
        </div>

        {/* Low stock */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <p className="font-bold text-sm text-[var(--foreground)]">Stok Perlu Perhatian</p>
            <button onClick={()=>onNavigate('inventory')} className="text-xs text-[var(--primary)] font-semibold hover:underline cursor-pointer">Inventori →</button>
          </div>
          {data.lowStockItems.length===0
            ? <div className="flex flex-col items-center justify-center py-8 gap-1.5 text-[var(--success)]"><Package className="w-7 h-7"/><p className="text-xs font-semibold">Semua stok aman ✓</p></div>
            : <div className="p-3 space-y-2">
                {data.lowStockItems.map(item=>{
                  const p=item.min_stock>0?Math.min(100,(item.stock/item.min_stock)*100):100;
                  const c=p<=30?'var(--error)':p<=70?'var(--warning)':'var(--success)';
                  return (
                    <div key={item.id} className="p-2.5 bg-[var(--muted)] rounded-xl">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-xs font-semibold text-[var(--foreground)] truncate">{item.name}</p>
                        <p className="text-xs font-bold ml-2 shrink-0" style={{color:c}}>{item.stock}/{item.min_stock} {item.unit}</p>
                      </div>
                      <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{width:`${p}%`,backgroundColor:c}}/>
                      </div>
                    </div>
                  );
                })}
              </div>}
        </div>
      </div>

      {/* Staff row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPI label="Karyawan Aktif"   value={`${data.activeEmployees.count} orang`} icon={<Users className="w-5 h-5 text-[var(--primary)]"/>} bg="bg-[var(--primary-light)]"/>
        <KPI label="Shift Hari Ini"   value={`${data.activeShifts.active}/${data.activeShifts.total} shift`} icon={<Clock className="w-5 h-5 text-[var(--success)]"/>} bg="bg-[var(--success-light)]"/>
        <KPI label="Avg Order Value"  value={fmtRp(data.todaySales.avg)} icon={<ShoppingCart className="w-5 h-5 text-[var(--warning)]"/>} bg="bg-[var(--warning-light)]"/>
        <KPI label="Mendekati Expired" value={`${data.inventoryAlerts.expiring} item`} icon={<CalendarX className="w-5 h-5 text-purple-500"/>} bg="bg-purple-50"/>
      </div>
    </div>
  );
}
