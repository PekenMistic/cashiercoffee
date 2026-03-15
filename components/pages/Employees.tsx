'use client';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Phone, Mail, DollarSign, X, RefreshCw } from 'lucide-react';
import { DBEmployee } from '@/types/db';
import { fmtRp } from '@/lib/utils';
import { apiPost, apiPut, apiDelete } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast, Toast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';

const ROLES = ['Barista', 'Kasir', 'Supervisor', 'Manager', 'Cleaning'];

export function Employees() {
  const [employees, setEmployees] = useState<DBEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; emp: DBEmployee | null }>({ open: false, emp: null });
  const [deleteConfirm, setDeleteConfirm] = useState<DBEmployee | null>(null);
  const { toast, showToast, clearToast } = useToast();

  async function load() {
    setLoading(true);
    setEmployees(await apiFetch<DBEmployee[]>('/api/employees'));
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const active = employees.filter(e => e.status === 'active');
  const inactive = employees.filter(e => e.status === 'inactive');

  if (loading) return <Spinner />;

  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#080C1A]">Karyawan</h1><p className="text-[#6A7686] text-sm">{active.length} aktif · {inactive.length} non-aktif</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] cursor-pointer"><RefreshCw className="w-4 h-4 text-[#6A7686]"/></button>
          <button onClick={() => setModal({ open: true, emp: null })} className="flex items-center gap-2 px-5 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer"><Plus className="w-4 h-4"/> Tambah Karyawan</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Karyawan', value: employees.length, color: 'bg-blue-50 text-[#165DFF]' },
          { label: 'Aktif', value: active.length, color: 'bg-[#DCFCE7] text-[#30B22D]' },
          { label: 'Non-Aktif', value: inactive.length, color: 'bg-[#FEE2E2] text-[#ED6B60]' },
          { label: 'Total Upah/Jam', value: fmtRp(active.reduce((s, e) => s + e.hourly_rate, 0)), color: 'bg-[#FEF3C7] text-[#F59E0B]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#E8EAED] rounded-2xl p-5">
            <p className="text-xs text-[#6A7686] mb-1">{label}</p>
            <p className={`text-xl font-bold ${color.split(' ')[1]}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employees.map(emp => (
          <div key={emp.id} className={`bg-white border rounded-2xl p-5 space-y-4 hover:shadow-md transition-all ${emp.status === 'inactive' ? 'opacity-60 border-dashed' : 'border-[#E8EAED]'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 bg-gradient-to-br from-[#165DFF] to-[#7C4A1E] rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-[#080C1A]">{emp.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#165DFF]">{emp.role}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${emp.status === 'active' ? 'bg-[#DCFCE7] text-[#30B22D]' : 'bg-[#FEE2E2] text-[#ED6B60]'}`}>
                      {emp.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal({ open: true, emp })} className="size-8 flex items-center justify-center rounded-lg hover:bg-[#EFF2F7] cursor-pointer text-[#6A7686]"><Pencil className="w-4 h-4"/></button>
                <button onClick={() => setDeleteConfirm(emp)} className="size-8 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] hover:text-[#ED6B60] cursor-pointer text-[#6A7686]"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {emp.phone && <div className="flex items-center gap-2 text-[#6A7686]"><Phone className="w-4 h-4 shrink-0"/><span>{emp.phone}</span></div>}
              {emp.email && <div className="flex items-center gap-2 text-[#6A7686]"><Mail className="w-4 h-4 shrink-0"/><span className="truncate">{emp.email}</span></div>}
              <div className="flex items-center gap-2 text-[#6A7686]"><DollarSign className="w-4 h-4 shrink-0"/><span>{fmtRp(emp.hourly_rate)}/jam</span></div>
            </div>
            <div className="pt-3 border-t border-[#E8EAED] flex items-center justify-between">
              <span className="text-xs text-[#6A7686]">PIN: <span className="font-mono font-bold tracking-widest">{emp.pin ? '••••' : '—'}</span></span>
              <span className="text-xs text-[#6A7686]">ID: #{emp.id}</span>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <EmployeeModal emp={modal.emp} onClose={() => setModal({ open: false, emp: null })}
          onSaved={async (msg) => { showToast(msg); setModal({ open: false, emp: null }); await load(); }} />
      )}
      {deleteConfirm && (
        <ConfirmModal message={`Hapus karyawan "${deleteConfirm.name}"?`}
          onConfirm={async () => { await apiDelete('/api/employees', { id: deleteConfirm.id }); showToast('Karyawan dihapus'); setDeleteConfirm(null); await load(); }}
          onCancel={() => setDeleteConfirm(null)} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

function EmployeeModal({ emp, onClose, onSaved }: { emp: DBEmployee | null; onClose: () => void; onSaved: (m: string) => void }) {
  const [f, setF] = useState({ name: emp?.name || '', role: emp?.role || 'Barista', phone: emp?.phone || '', email: emp?.email || '', pin: emp?.pin || '', hourly_rate: emp?.hourly_rate?.toString() || '0', status: emp?.status || 'active' });
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  async function save() {
    if (!f.name.trim()) { alert('Nama wajib diisi'); return; }
    const body = { ...f, hourly_rate: parseFloat(f.hourly_rate) || 0 };
    if (emp) { await apiPut('/api/employees', { ...body, id: emp.id }); onSaved('Karyawan diperbarui'); }
    else { await apiPost('/api/employees', body); onSaved('Karyawan ditambahkan'); }
  }
  const inp = 'w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] transition-all';
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]">
          <h2 className="font-bold text-xl">{emp ? 'Edit Karyawan' : 'Tambah Karyawan'}</h2>
          <button onClick={onClose} className="size-9 flex items-center justify-center rounded-xl hover:bg-[#EFF2F7] cursor-pointer"><X className="w-5 h-5 text-[#6A7686]"/></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
          {[
            { label: 'Nama *', key: 'name', placeholder: 'Nama lengkap' },
            { label: 'No. HP', key: 'phone', placeholder: '+62 xxx' },
            { label: 'Email', key: 'email', placeholder: 'email@domain.com' },
            { label: 'PIN (4 digit)', key: 'pin', placeholder: '0000' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-semibold mb-1.5">{label}</label>
              <input className={inp} value={(f as Record<string, string>)[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} maxLength={key === 'pin' ? 4 : undefined} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Jabatan</label>
            <select className={inp + ' bg-white'} value={f.role} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Upah / Jam (Rp)</label>
            <input type="number" className={inp} value={f.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Status</label>
            <select className={inp + ' bg-white'} value={f.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Aktif</option>
              <option value="inactive">Non-Aktif</option>
            </select>
          </div>
        </div>
        <div className="p-6 border-t border-[#E8EAED] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm cursor-pointer">Batal</button>
          <button onClick={save} className="px-6 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer">Simpan</button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-[#165DFF] border-t-transparent rounded-full" /></div>;
}
