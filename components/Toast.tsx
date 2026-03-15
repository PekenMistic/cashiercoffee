'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-[600] fade-in">
      <div className="flex items-center gap-3 bg-[#080C1A] text-white px-5 py-3 rounded-2xl shadow-xl">
        {type === 'success' ? <CheckCircle className="w-5 h-5 text-[#30B22D]" /> : <XCircle className="w-5 h-5 text-[#ED6B60]" />}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });
  const clearToast = () => setToast(null);
  return { toast, showToast, clearToast };
}
