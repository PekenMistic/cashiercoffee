'use client';
import { useEffect, useState } from 'react';
import { useSyncEngine } from '@/lib/sync';
import { CloudOff, CloudUpload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface SyncBarProps {
  onDataSynced?: () => void;
}

export function SyncStatusBar({ onDataSynced }: SyncBarProps) {
  const { online, pending, syncing, lastSyncAt, errors, sync } = useSyncEngine(onDataSynced);
  const [visible, setVisible] = useState(false);
  const [dismissTimer, setDismissTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Show bar when there's something noteworthy
  useEffect(() => {
    const show = !online || pending > 0 || syncing || errors.length > 0;
    setVisible(show);

    // Auto-hide "synced" state after 3s
    if (online && pending === 0 && !syncing && errors.length === 0 && lastSyncAt) {
      const t = setTimeout(() => setVisible(false), 3000);
      setDismissTimer(t);
    } else {
      if (dismissTimer) clearTimeout(dismissTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, pending, syncing, errors.length]);

  if (!visible) return null;

  // Offline state
  if (!online) {
    return (
      <div className="fixed top-0 inset-x-0 z-[600] flex items-center justify-center gap-2 px-4 py-2
                      bg-amber-500 text-white text-xs font-semibold shadow-lg">
        <CloudOff className="w-3.5 h-3.5 shrink-0"/>
        <span>Mode offline — perubahan disimpan lokal, akan disinkronkan saat online</span>
        {pending > 0 && (
          <span className="bg-white/20 rounded-full px-2 py-0.5">{pending} pending</span>
        )}
      </div>
    );
  }

  // Syncing
  if (syncing) {
    return (
      <div className="fixed top-0 inset-x-0 z-[600] flex items-center justify-center gap-2 px-4 py-2
                      bg-blue-500 text-white text-xs font-semibold shadow-lg">
        <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin"/>
        <span>Menyinkronkan {pending} perubahan…</span>
      </div>
    );
  }

  // Errors
  if (errors.length > 0) {
    return (
      <div className="fixed top-0 inset-x-0 z-[600] flex items-center justify-between gap-2 px-4 py-2
                      bg-red-500 text-white text-xs font-semibold shadow-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0"/>
          <span>{errors.length} sinkronisasi gagal</span>
        </div>
        <button onClick={sync} className="underline cursor-pointer hover:opacity-80">Coba lagi</button>
      </div>
    );
  }

  // Pending (online but not yet synced)
  if (pending > 0) {
    return (
      <div className="fixed top-0 inset-x-0 z-[600] flex items-center justify-center gap-2 px-4 py-2
                      bg-blue-500 text-white text-xs font-semibold shadow-lg">
        <CloudUpload className="w-3.5 h-3.5 shrink-0"/>
        <span>{pending} perubahan menunggu sinkronisasi</span>
        <button onClick={sync} className="bg-white/20 rounded-full px-2 py-0.5 cursor-pointer hover:bg-white/30">
          Sync sekarang
        </button>
      </div>
    );
  }

  // All synced
  return (
    <div className="fixed top-0 inset-x-0 z-[600] flex items-center justify-center gap-2 px-4 py-2
                    bg-green-500 text-white text-xs font-semibold shadow-lg fade-in">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0"/>
      <span>Semua data tersinkronkan</span>
    </div>
  );
}
