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
          {/* Order Summary */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">Ringkasan Pesanan</h3>
            <div className="space-y-2 bg-[var(--surface-alt)] p-4 rounded-lg max-h-40 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">
                    {item.emoji} {item.name} x{item.qty}
                  </span>
                  <span className="font-medium text-[var(--foreground)]">
                    {fmt(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="space-y-2 py-4 border-t-2 border-b-2 border-[var(--border)]">
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <span>Total</span>
              <span className="font-bold text-lg text-[var(--primary)]">{fmt(total)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">Metode Pembayaran</h3>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <label
                    key={method.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                        : 'border-[var(--border)] hover:border-[var(--primary)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">{method.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{method.desc}</p>
                    </div>
                    <Icon className="w-5 h-5 text-[var(--text-secondary)]" />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-2">Catatan untuk Staff</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misalnya: Prioritas rendah, pesanan untuk later..."
              className="w-full p-3 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary-light)]"
              rows={2}
              disabled={isLoading}
            />
          </div>

          {/* Terms */}
          <div className="flex gap-2 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Pesanan akan siap dalam 10-15 menit. Staff akan memberi tahu saat siap.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[var(--border)] p-4 sm:p-6 bg-white space-y-3">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--primary)' }}
          >
            {isLoading ? 'Memproses...' : 'Konfirmasi & Pesan'}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-semibold border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-alt)] transition-all disabled:opacity-50"
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}
