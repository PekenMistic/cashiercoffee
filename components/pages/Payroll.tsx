'use client';
import { useState, useEffect } from 'react';
import { DollarSign, Clock, Users, TrendingUp, RefreshCw, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { fmtRp } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface PayrollEmployee {
  employee_id: number;
  employee_name: string;
  role: string;
  hourly_rate: number;
  total_shifts: number;
  completed_shifts: number;
  absent_shifts: number;
  total_hours: number;
  gross_wage: number;
}

interface PayrollData {
  month: string;
  startDate: string;
  endDate: string;
  payroll: PayrollEmployee[];
  totals: { total_gross: number; total_hours: number; total_shifts: number };
  availableMonths: string[];
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-[#165DFF] border-t-transparent rounded-full"/></div>;
}

function ROLE_COLOR(role: string) {
  const map: Record<string, string> = {
    Barista: 'bg-blue-50 text-[#165DFF]',
    Kasir: 'bg-[#DCFCE7] text-[#30B22D]',
    Supervisor: 'bg-[#FEF3C7] text-[#F59E0B]',
    Manager: 'bg-[#F3E8FF] text-[#9333EA]',
    Cleaning: 'bg-[#EFF2F7] text-[#6A7686]',
  };
  return map[role] || 'bg-[#EFF2F7] text-[#6A7686]';
}

export function Payroll() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [data, setData] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(m: string) {
    setLoading(true);
    const d = await apiFetch<PayrollData>(`/api/payroll?month=${m}`);
    setData(d);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(month); }, [month]);

  function changeMonth(delta: number) {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const monthLabel = (m: string) => {
    const [y, mo] = m.split('-');
    return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  if (loading || !data) return <Spinner />;

  const { payroll, totals } = data;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#080C1A]">Penggajian</h1>
          <p className="text-[#6A7686] text-sm">{monthLabel(month)}</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Month navigation */}
          <button onClick={() => changeMonth(-1)} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-[#6A7686]"/>
          </button>
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="border border-[#E8EAED] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#165DFF] bg-white cursor-pointer"
          >
            {(data.availableMonths.length > 0 ? data.availableMonths : [month]).map(m => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
          <button onClick={() => changeMonth(1)} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] cursor-pointer">
            <ChevronRight className="w-4 h-4 text-[#6A7686]"/>
          </button>
          <button onClick={() => load(month)} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] cursor-pointer">
            <RefreshCw className="w-4 h-4 text-[#6A7686]"/>
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm hover:ring-[#165DFF] cursor-pointer">
            <Printer className="w-4 h-4"/>Print
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-5">
          <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-[#165DFF]"/>
          </div>
          <p className="text-xs text-[#6A7686] mb-0.5">Total Gaji Kotor</p>
          <p className="font-bold text-[#080C1A] text-lg leading-tight">{fmtRp(totals.total_gross)}</p>
        </div>
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-5">
          <div className="size-10 bg-[#DCFCE7] rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-[#30B22D]"/>
          </div>
          <p className="text-xs text-[#6A7686] mb-0.5">Total Jam Kerja</p>
          <p className="font-bold text-[#080C1A] text-lg leading-tight">{totals.total_hours.toFixed(1)} jam</p>
        </div>
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-5">
          <div className="size-10 bg-[#FEF3C7] rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-[#F59E0B]"/>
          </div>
          <p className="text-xs text-[#6A7686] mb-0.5">Total Shift Selesai</p>
          <p className="font-bold text-[#080C1A] text-lg leading-tight">{totals.total_shifts} shift</p>
        </div>
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-5">
          <div className="size-10 bg-[#F3E8FF] rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-[#9333EA]"/>
          </div>
          <p className="text-xs text-[#6A7686] mb-0.5">Karyawan Diproses</p>
          <p className="font-bold text-[#080C1A] text-lg leading-tight">{payroll.length} orang</p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white border border-[#E8EAED] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#E8EAED] flex items-center justify-between">
          <h3 className="font-bold text-[#080C1A]">Detail Penggajian — {monthLabel(month)}</h3>
          <span className="text-xs text-[#6A7686]">Tarif × Jam Kerja</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F9FB]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A7686]">Karyawan</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-[#6A7686]">Jabatan</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Tarif/Jam</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Shift Selesai</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Absen</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Jam Kerja</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#6A7686]">Gaji Kotor</th>
              </tr>
            </thead>
            <tbody>
              {payroll.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#6A7686]">
                    Tidak ada data shift untuk bulan ini
                  </td>
                </tr>
              ) : (
                payroll.map(emp => {
                  const attendancePct = emp.total_shifts > 0
                    ? Math.round((emp.completed_shifts / emp.total_shifts) * 100)
                    : 0;
                  return (
                    <tr key={emp.employee_id} className="border-t border-[#F3F4F3] hover:bg-[#F8F9FB]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-blue-50 rounded-xl flex items-center justify-center font-bold text-[#165DFF] text-sm">
                            {emp.employee_name.charAt(0)}
                          </div>
                          <span className="font-semibold text-[#080C1A]">{emp.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLOR(emp.role)}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-[#6A7686]">{fmtRp(emp.hourly_rate)}/jam</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-semibold text-[#080C1A]">{emp.completed_shifts}</span>
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-[#EFF2F7] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${attendancePct}%`,
                                  backgroundColor: attendancePct >= 80 ? '#30B22D' : attendancePct >= 50 ? '#F59E0B' : '#ED6B60'
                                }}
                              />
                            </div>
                            <span className="text-xs text-[#6A7686]">{attendancePct}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {emp.absent_shifts > 0
                          ? <span className="font-semibold text-[#ED6B60]">{emp.absent_shifts}</span>
                          : <span className="text-[#6A7686]">—</span>
                        }
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-[#080C1A]">
                        {emp.total_hours.toFixed(1)} jam
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-bold text-[#165DFF] text-base">{fmtRp(emp.gross_wage)}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {payroll.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#E8EAED] bg-[#F8F9FB]">
                  <td className="px-5 py-4 font-bold text-[#080C1A]" colSpan={5}>Total</td>
                  <td className="px-5 py-4 text-right font-bold text-[#080C1A]">
                    {totals.total_hours.toFixed(1)} jam
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-[#165DFF] text-base">
                    {fmtRp(totals.total_gross)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Per-employee cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {payroll.map(emp => {
          const attendancePct = emp.total_shifts > 0 ? Math.round((emp.completed_shifts / emp.total_shifts) * 100) : 0;
          const color = attendancePct >= 80 ? '#30B22D' : attendancePct >= 50 ? '#F59E0B' : '#ED6B60';
          return (
            <div key={emp.employee_id} className="bg-white border border-[#E8EAED] rounded-2xl p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-11 bg-blue-50 rounded-xl flex items-center justify-center font-bold text-[#165DFF] text-lg">
                  {emp.employee_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-[#080C1A]">{emp.employee_name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLOR(emp.role)}`}>{emp.role}</span>
                </div>
              </div>

              {/* Attendance bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-[#6A7686] mb-1">
                  <span>Kehadiran</span>
                  <span style={{ color }}>{attendancePct}%</span>
                </div>
                <div className="h-2 bg-[#EFF2F7] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${attendancePct}%`, backgroundColor: color }}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#EFF2F7] rounded-xl p-2.5">
                  <p className="text-[#6A7686] mb-0.5">Jam Kerja</p>
                  <p className="font-bold text-[#080C1A]">{emp.total_hours.toFixed(1)} jam</p>
                </div>
                <div className="bg-[#EFF2F7] rounded-xl p-2.5">
                  <p className="text-[#6A7686] mb-0.5">Absen</p>
                  <p className="font-bold" style={{ color: emp.absent_shifts > 0 ? '#ED6B60' : '#30B22D' }}>
                    {emp.absent_shifts} hari
                  </p>
                </div>
                <div className="bg-[#EFF2F7] rounded-xl p-2.5">
                  <p className="text-[#6A7686] mb-0.5">Tarif/Jam</p>
                  <p className="font-bold text-[#080C1A]">{fmtRp(emp.hourly_rate)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-2.5">
                  <p className="text-[#6A7686] mb-0.5">Gaji Kotor</p>
                  <p className="font-bold text-[#165DFF]">{fmtRp(emp.gross_wage)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
