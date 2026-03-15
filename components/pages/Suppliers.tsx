'use client';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, User, Phone, Mail, RefreshCw, X } from 'lucide-react';
import { DBSupplier } from '@/types/db';
import { apiPost, apiPut, apiDelete } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast, Toast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<DBSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{open:boolean;sup:DBSupplier|null}>({open:false,sup:null});
  const [del, setDel] = useState<DBSupplier|null>(null);
  const {toast,showToast,clearToast} = useToast();
  async function load(){setLoading(true);setSuppliers(await apiFetch<DBSupplier[]>('/api/suppliers'));setLoading(false);}
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{load();},[]);
  if (loading) return <Spinner/>;
  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#080C1A]">Supplier</h1><p className="text-[#6A7686] text-sm">{suppliers.length} supplier</p></div>
        <div className="flex gap-2"><button onClick={load} className="size-10 flex items-center justify-center rounded-xl ring-1 ring-[#E8EAED] hover:ring-[#165DFF] cursor-pointer"><RefreshCw className="w-4 h-4 text-[#6A7686]"/></button><button onClick={()=>setModal({open:true,sup:null})} className="flex items-center gap-2 px-5 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer"><Plus className="w-4 h-4"/>Tambah Supplier</button></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {suppliers.map(s=>(
          <div key={s.id} className="bg-white border border-[#E8EAED] rounded-2xl p-5 space-y-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3"><div className="size-11 bg-blue-50 rounded-xl flex items-center justify-center font-bold text-[#165DFF] text-lg">{s.name.charAt(0)}</div><div><h4 className="font-bold text-[#080C1A]">{s.name}</h4><p className="text-xs text-[#6A7686]">{s.category||'Umum'}</p></div></div>
              <div className="flex gap-1"><button onClick={()=>setModal({open:true,sup:s})} className="size-8 flex items-center justify-center rounded-lg hover:bg-[#EFF2F7] cursor-pointer text-[#6A7686]"><Pencil className="w-4 h-4"/></button><button onClick={()=>setDel(s)} className="size-8 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] hover:text-[#ED6B60] cursor-pointer text-[#6A7686]"><Trash2 className="w-4 h-4"/></button></div>
            </div>
            <div className="space-y-2 text-sm">{s.contact&&<div className="flex items-center gap-2 text-[#6A7686]"><User className="w-4 h-4 shrink-0"/><span>{s.contact}</span></div>}{s.phone&&<div className="flex items-center gap-2 text-[#6A7686]"><Phone className="w-4 h-4 shrink-0"/><span>{s.phone}</span></div>}{s.email&&<div className="flex items-center gap-2 text-[#6A7686]"><Mail className="w-4 h-4 shrink-0"/><span className="truncate">{s.email}</span></div>}</div>
          </div>
        ))}
      </div>
      {modal.open&&<SupplierModal sup={modal.sup} onClose={()=>setModal({open:false,sup:null})} onSaved={async msg=>{showToast(msg);setModal({open:false,sup:null});await load();}}/>}
      {del&&<ConfirmModal message={`Hapus "${del.name}"?`} onConfirm={async()=>{await apiDelete('/api/suppliers',{id:del.id});showToast('Supplier dihapus');setDel(null);await load();}} onCancel={()=>setDel(null)}/>}
      {toast&&<Toast message={toast.message} type={toast.type} onClose={clearToast}/>}
    </div>
  );
}

function SupplierModal({sup,onClose,onSaved}:{sup:DBSupplier|null;onClose:()=>void;onSaved:(m:string)=>void}) {
  const [f,setF]=useState({name:sup?.name||'',contact:sup?.contact||'',phone:sup?.phone||'',email:sup?.email||'',category:sup?.category||''});
  const set=(k:string,v:string)=>setF(p=>({...p,[k]:v}));
  async function save(){if(!f.name.trim()){alert('Nama wajib');return;}if(sup){await apiPut('/api/suppliers',{...f,id:sup.id});onSaved('Supplier diperbarui');}else{await apiPost('/api/suppliers',f);onSaved('Supplier ditambahkan');}}
  const inp='w-full border border-[#E8EAED] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#165DFF] transition-all';
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]"><h2 className="font-bold text-xl">{sup?'Edit Supplier':'Tambah Supplier'}</h2><button onClick={onClose} className="size-9 flex items-center justify-center rounded-xl hover:bg-[#EFF2F7] cursor-pointer"><X className="w-5 h-5 text-[#6A7686]"/></button></div>
        <div className="p-6 space-y-4">{[['name','Nama *','Nama supplier'],['contact','Kontak','Nama kontak'],['phone','Telepon','+62 xxx'],['email','Email','email@domain.com'],['category','Kategori','e.g. Biji Kopi']].map(([k,l,p])=><div key={k}><label className="block text-sm font-semibold mb-1.5">{l}</label><input className={inp} value={(f as Record<string,string>)[k]} onChange={e=>set(k,e.target.value)} placeholder={p}/></div>)}</div>
        <div className="p-6 border-t border-[#E8EAED] flex justify-end gap-3"><button onClick={onClose} className="px-6 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm cursor-pointer">Batal</button><button onClick={save} className="px-6 py-2.5 bg-[#165DFF] text-white rounded-full font-bold text-sm hover:bg-[#0E4BD9] cursor-pointer">Simpan</button></div>
      </div>
    </div>
  );
}
function Spinner(){return <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-[#165DFF] border-t-transparent rounded-full"/></div>;}
