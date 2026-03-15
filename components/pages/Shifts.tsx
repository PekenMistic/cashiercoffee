'use client';
import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, LogIn, LogOut, Trash2, X, RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { DBShift, DBEmployee } from '@/types/db';
import { fmtRp, shiftLabel, shiftColor, statusColor, todayStr } from '@/lib/utils';
import { apiPost, apiPut, apiDelete } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast, Toast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';

export function Shifts() {
  const [shifts, setShifts] = useState<DBShift[]>([]);
  const [employees, setEmployees] = useState<DBEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());
  const [modal, setModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DBShift | null>(null);
  const { toast, showToast, clearToast } = useToast();

  async function load() {
    setLoading(true);
    const [s, e] = await Promise.all([
      apiFetch<DBShift[]>(`/api/shifts?date=${date}`),
      apiFetch<DBEmployee[]>('/api/employees'),
    ]);
    setShifts(s); setEmployees(e.filter((emp: {status: string}) => emp.status === 'active'));
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [date]);

  function changeDate(delta: number) {
    const d = new Date(date); d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  }

  async function clockAction(shift: DBShift, action: 'clockin' | 'clockout' | 'absent') {
    await apiPut('/api/shifts', { id: shift.id, action });
    showToast(action === 'clockin' ? `${shift.employee_name} clock in` : action === 'clockout' ? `${shift.employee_name} clock out` : 'Ditandai absen');
    await load();
  }

  const scheduled = shifts.filter(s => s.status === 'scheduled');
  const active = shifts.filter(s => s.status === 'active');
  const completed = shifts.filter(s => s.status === 'completed');
  const absent = shifts.filter(s => s.status === 'absent');
  const totalWage = completed.reduce((s, sh) => s + sh.hours_worked * (sh.hourly_rate || 0), 0);

  const isToday = date === todayStr();

  if (loading) return <Spinner />;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#080C1A]">Manajemen Shift</h1><p className="text-[#6A7686] text-sm">{shifts.length} shift terjadwal</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] cursor-pointer"><RefreshCw className="w-4 h-4 text-[#6A7686]"/></button>
          <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer"><Plus className="w-4 h-4"/> Tambah Shift</button>
        </div>
      </div>

      {/* Date Picker */}
      <div className="flex items-center gap-3 bg-[#EFF2F7] rounded-2xl p-4">
        <button onClick={() => changeDate(-1)} className="size-9 flex items-center justify-center rounded-xl bg-white hover:bg-[#165DFF] hover:text-white transition-all cursor-pointer"><ChevronLeft className="w-5 h-5"/></button>
        <div className="flex-1 flex items-center justify-center gap-3">
          <Calendar className="w-5 h-5 text-[#165DFF]"/>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent font-bold text-[#080C1A] text-center outline-none cursor-pointer"/>
          {isToday && <span className="px-2 py-0.5 rounded-full bg-[#165DFF] text-white text-xs font-bold">Hari Ini</span>}
        </div>
        <button onClick={() => changeDate(1)} className="size-9 flex items-center justify-center rounded-xl bg-white hover:bg-[#165DFF] hover:text-white transition-all cursor-pointer"><ChevronRight className="w-5 h-5"/></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Terjadwal', value: scheduled.length, color: 'bg-gray-100 text-gray-700' },
          { label: 'Sedang Kerja', value: active.length, color: 'bg-[#DCFCE7] text-[#30B22D]' },
          { label: 'Selesai', value: completed.length, color: 'bg-blue-100 text-blue-700' },
          { label: 'Absen', value: absent.length, color: 'bg-[#FEE2E2] text-[#ED6B60]' },
          { label: 'Total Upah', value: fmtRp(totalWage), color: 'bg-[#FEF3C7] text-[#F59E0B]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#E8EAED] rounded-2xl p-4">
            <p className="text-xs text-[#6A7686] mb-1">{label}</p>
            <p className={`font-bold text-sm ${color.split(' ')[1]}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Shift Cards */}
      {shifts.length === 0 ? (
        <div className="bg-white border border-[#E8EAED] rounded-2xl p-12 text-center">
          <Clock className="w-10 h-10 text-[#6A7686] mx-auto mb-3"/>
          <p className="font-semibold text-[#080C1A]">Tidak ada shift untuk tanggal ini</p>
          <p className="text-sm text-[#6A7686] mt-1">Klik &quot;Tambah Shift&quot; untuk menjadwalkan karyawan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shifts.map(shift => (
            <ShiftCard key={shift.id} shift={shift} isToday={isToday} onAction={clockAction} onDelete={() => setDeleteConfirm(shift)} />
          ))}
        </div>
      )}

      {modal && (
        <AddShiftModal employees={employees} date={date} onClose={() => setModal(false)}
          onSaved={async (msg) => { showToast(msg); setModal(false); await load(); }} />
      )}
      {deleteConfirm && (
        <ConfirmModal message={`Hapus shift ${deleteConfirm.employee_name}?`}
          onConfirm={async () => { await apiDelete('/api/shifts', { id: deleteConfirm.id }); showToast('Shift dihapus'); setDeleteConfirm(null); await load(); }}
          onCancel={() => setDeleteConfirm(null)} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

function ShiftCard({ shift, isToday, onAction, onDelete }: { shift: DBShift; isToday: boolean; onAction: (s: DBShift, a: 'clockin' | 'clockout' | 'absent') => void; onDelete: () => void }) {
  const wage = shift.hours_worked * (shift.hourly_rate || 0);
  return (
    <div className="bg-white border border-[#E8EAED] rounded-2xl p-5 space-y-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="size-11 bg-gradient-to-br from-[#165DFF] to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {shift.employee_name?.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-[#080C1A]">{shift.employee_name}</p>
            <p className="text-xs text-[#6A7686]">{shift.employee_role}</p>
          </div>
        </div>
        <button onClick={onDelete} className="size-8 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] hover:text-[#ED6B60] cursor-pointer text-[#6A7686]"><Trash2 className="w-4 h-4"/></button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${shiftColor(shift.shift_type)}`}>{shiftLabel(shift.shift_type)}</span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(shift.status)}`}>
          {shift.status === 'scheduled' ? '🕐 Terjadwal' : shift.status === 'active' ? '🟢 Sedang Kerja' : shift.status === 'completed' ? '✅ Selesai' : '❌ Absen'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-[#EFF2F7] rounded-xl p-2"><p className="text-xs text-[#6A7686]">Masuk</p><p className="font-bold text-[#080C1A]">{shift.clock_in || '—'}</p></div>
        <div className="bg-[#EFF2F7] rounded-xl p-2"><p className="text-xs text-[#6A7686]">Keluar</p><p className="font-bold text-[#080C1A]">{shift.clock_out || '—'}</p></div>
        <div className="bg-[#EFF2F7] rounded-xl p-2"><p className="text-xs text-[#6A7686]">Jam</p><p className="font-bold text-[#080C1A]">{shift.hours_worked > 0 ? shift.hours_worked + 'h' : '—'}</p></div>
      </div>

      {shift.hours_worked > 0 && (
        <div className="flex items-center justify-between text-sm pt-1 border-t border-[#E8EAED]">
          <span className="text-[#6A7686]">Upah hari ini</span>
          <span className="font-bold text-[#30B22D]">{fmtRp(wage)}</span>
        </div>
      )}

      {isToday && (
        <div className="flex gap-2">
          {shift.status === 'scheduled' && (
            <>
              <button onClick={() => onAction(shift, 'clockin')} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#30B22D] text-white rounded-xl text-xs font-bold hover:opacity-90 cursor-pointer"><LogIn className="w-4 h-4"/> Clock In</button>
              <button onClick={() => onAction(shift, 'absent')} className="py-2 px-3 bg-[#FEE2E2] text-[#ED6B60] rounded-xl text-xs font-bold hover:opacity-80 cursor-pointer"><XCircle className="w-4 h-4"/></button>
            </>
          )}
          {shift.status === 'active' && (
            <button onClick={() => onAction(shift, 'clockout')} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#ED6B60] text-white rounded-xl text-xs font-bold hover:opacity-90 cursor-pointer"><LogOut className="w-4 h-4"/> Clock Out</button>
          )}
          {(shift.status === 'completed' || shift.status === 'absent') && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#EFF2F7] text-[#6A7686] rounded-xl text-xs font-bold">
              {shift.status === 'completed' ? <><CheckCircle className="w-4 h-4 text-[#30B22D]"/> Selesai</> : <><XCircle className="w-4 h-4 text-[#ED6B60]"/> Absen</>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddShiftModal({ employees, date, onClose, onSaved }: { employees: DBEmployee[]; date: string; onClose: () => void; onSaved: (m: string) => void }) {
  const [empId, setEmpId] = useState('');
  const [shiftType, setShiftType] = useState<'morning' | 'afternoon' | 'evening' | 'full'>('morning');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!empId) { alert('Pilih karyawan'); return; }
    setSaving(true);
    await apiPost('/api/shifts', { employee_id: parseInt(empId), date, shift_type: shiftType, notes, status: 'scheduled' });
    onSaved('Shift ditambahkan');
  }

  const inp = 'w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] bg-white';
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]">
          <h2 className="font-bold text-xl">Tambah Shift</h2>
          <button onClick={onClose} className="size-9 flex items-center justify-center rounded-xl hover:bg-[#EFF2F7] cursor-pointer"><X className="w-5 h-5 text-[#6A7686]"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Karyawan *</label>
            <select value={empId} onChange={e => setEmpId(e.target.value)} className={inp}>
              <option value="">— Pilih karyawan —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Tanggal</label>
            <div className="border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm bg-[#EFF2F7] font-semibold">{date}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Tipe Shift</label>
            <div className="grid grid-cols-2 gap-2">
              {(['morning','afternoon','evening','full'] as const).map(t => (
                <button key={t} type="button" onClick={() => setShiftType(t)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${shiftType===t?'border-[#165DFF] bg-blue-50 text-[#165DFF]':'border-[#E8EAED] text-[#6A7686] hover:border-gray-300'}`}>
                  {shiftLabel(t)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Catatan</label>
            <input className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opsional"/>
          </div>
        </div>
        <div className="p-6 border-t border-[#E8EAED] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm cursor-pointer">Batal</button>
          <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-[#165DFF] border-t-transparent rounded-full"/></div>;
}
