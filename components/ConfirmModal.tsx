'use client';
import { Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center fade-in">
        <div className="w-14 h-14 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-[#ED6B60]" />
        </div>
        <h3 className="font-bold text-lg text-[#080C1A] mb-2">Confirm Delete</h3>
        <p className="text-[#6A7686] text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 ring-1 ring-[#E8EAED] rounded-full font-semibold text-sm hover:ring-[#165DFF] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-[#ED6B60] text-white rounded-full font-bold text-sm hover:opacity-90 transition-all cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
