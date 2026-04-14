'use client';

import { X, AlertCircle, CheckCircle2, CreditCard, Coins } from 'lucide-react';
import { useState } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  emoji: string;
}

interface CheckoutModalProps {
  items: CartItem[];
  total: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirmOrder: (paymentMethod: string, notes: string) => void;
  isLoading?: boolean;
}

const fmt = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Tunai', icon: Coins, desc: 'Bayar langsung di tempat' },
  { id: 'card', name: 'Kartu Kredit/Debit', icon: CreditCard, desc: 'Visa, Mastercard, dll' },
  { id: 'qris', name: 'QRIS', icon: CreditCard, desc: 'E-wallet atau transfer bank' },
];

export function CheckoutModal({
  items,
  total,
  isOpen,
  onClose,
  onConfirmOrder,
  isLoading = false,
}: CheckoutModalProps) {
  const [selectedPayment, setSelectedPayment] = useState<string>('cash');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    onConfirmOrder(selectedPayment, notes);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[var(--success-light)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Pesanan Berhasil!
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            Pesanan Anda telah diterima. Silakan tunggu pesanan disiapkan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Konfirmasi Pesanan</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-[var(--surface-alt)] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Order Summary Section */}
          <div className="bg-[var(--surface-alt)] rounded-xl p-4 sm:p-5">
            <h3 className="font-bold text-[var(--foreground)] mb-4 text-sm uppercase tracking-wider">Ringkasan Pesanan</h3>
            <div className="space-y-2.5 max-h-40 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-[var(--text-secondary)] flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="flex-1">{item.name}</span>
                    <span className="font-medium text-xs bg-white px-2 py-1 rounded">x{item.qty}</span>
                  </span>
                  <span className="font-semibold text-[var(--foreground)] ml-2">{fmt(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Highlight */}
          <div className="bg-gradient-to-r from-[var(--primary-light)] to-[var(--surface-alt)] rounded-xl p-5 border border-[var(--border)]">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-[var(--text-secondary)]">Total Pembayaran</span>
              <span className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
                {fmt(total)}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="font-bold text-[var(--foreground)] mb-4 text-sm uppercase tracking-wider">Pilih Metode Pembayaran</h3>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <label
                    key={method.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? 'border-[var(--primary)] bg-[var(--primary-light)] shadow-md'
                        : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-alt)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-[var(--foreground)] text-sm">{method.name}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{method.desc}</p>
                    </div>
                    <Icon className="w-6 h-6 text-[var(--primary)] flex-shrink-0" />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <h3 className="font-bold text-[var(--foreground)] mb-3 text-sm uppercase tracking-wider">Catatan Khusus</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Gula sedikit, pedas, no ice..."
              className="w-full p-4 border-2 border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all"
              rows={2}
              disabled={isLoading}
            />
          </div>

          {/* Info Banner */}
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Estimasi Waktu</p>
              <p className="text-xs text-blue-700">
                Pesanan siap dalam 10-15 menit. Kami akan notifikasi saat pesanan selesai.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[var(--border)] p-4 sm:p-6 bg-white space-y-2.5">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--primary)' }}
          >
            {isLoading ? 'Memproses...' : 'Konfirmasi & Pesan'}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-bold border-2 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-alt)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all disabled:opacity-50"
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}
