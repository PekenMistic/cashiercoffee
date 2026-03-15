'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useMemo, use, useRef, useEffect } from 'react';
import {
  ShoppingBag, Plus, Minus, Trash2, Search, X,
  CheckCircle2, Clock, Loader2, ChevronRight, Star, Tag, Flame, Leaf
} from 'lucide-react';
import useSWR from 'swr';

// ── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: number; name: string; category: string; price: number;
  cost: number; image_emoji: string; description: string;
}
interface CartItem { id: number; name: string; price: number; qty: number; emoji: string; }

// ── Constants ─────────────────────────────────────────────────────────────────
const TAX = 0.10;
const CATS = ['All', 'Coffee', 'Non-Coffee', 'Food'];
const CAT_ICONS: Record<string, string> = {
  'All': '🍽️', 'Coffee': '☕', 'Non-Coffee': '🍵', 'Food': '🍞',
};

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  'Rp ' + Math.round(n).toLocaleString('id-ID');

const fmtShort = (n: number) => {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}Jt`;
  if (n >= 1000)    return `${(n/1000).toFixed(0)}K`;
  return String(Math.round(n));
};

async function fetcher(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('failed');
  return r.json();
}

// ── Color palette (dark espresso + gold) ─────────────────────────────────────
const C = {
  bg:         '#0d0602',
  bgCard:     '#1a0e06',
  bgCard2:    '#221208',
  gold:       '#e8a95c',
  goldDark:   '#c47d2e',
  goldLight:  'rgba(232,169,92,.15)',
  goldBorder: 'rgba(232,169,92,.25)',
  white:      '#ffffff',
  white60:    'rgba(255,255,255,.6)',
  white40:    'rgba(255,255,255,.4)',
  white15:    'rgba(255,255,255,.15)',
  white08:    'rgba(255,255,255,.08)',
  green:      '#4ade80',
  red:        '#f87171',
  divider:    'rgba(255,255,255,.07)',
};

// ── Cart Badge (floating) ─────────────────────────────────────────────────────
function CartFab({ qty, total, onClick }: { qty: number; total: number; onClick: () => void }) {
  const prev = useRef(qty);
  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (qty > prev.current) { setPop(true); setTimeout(() => setPop(false), 350); }
    prev.current = qty;
  }, [qty]);
  if (!qty) return null;
  return (
    <button onClick={onClick}
      className={`fixed bottom-6 inset-x-4 z-40 flex items-center justify-between px-5 py-3.5 rounded-2xl cursor-pointer transition-transform active:scale-[.97] ${pop ? 'scale-105' : 'scale-100'}`}
      style={{ background: `linear-gradient(135deg, ${C.goldDark}, ${C.gold})`, boxShadow: '0 8px 32px rgba(196,125,46,.55)', maxWidth: 480, margin: '0 auto' }}>
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,.25)' }}>
          <ShoppingBag className="w-4 h-4 text-white"/>
        </div>
        <div className="text-left">
          <p className="text-[11px] font-bold text-black/70 leading-none">{qty} item</p>
          <p className="font-black text-[#1a0a00] text-sm leading-tight">{fmt(total)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-[#1a0a00] font-black text-sm">
        Pesan <ChevronRight className="w-4 h-4"/>
      </div>
    </button>
  );
}

// ── Menu Card (2-col grid, reference layout) ──────────────────────────────────
function MenuCard({ item, inCart, onAdd, onQtyChange }: {
  item: MenuItem; inCart: CartItem | undefined;
  onAdd: () => void; onQtyChange: (d: number) => void;
}) {
  const hasDiscount = item.cost > 0 && item.cost < item.price;
  const fakeOriginal = hasDiscount ? Math.round(item.price * 1.15 / 1000) * 1000 : 0;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: C.bgCard, border: `1px solid ${inCart ? C.goldBorder : C.white08}`, boxShadow: inCart ? `0 4px 20px ${C.goldLight}` : 'none' }}
      onClick={!inCart ? onAdd : undefined}>

      {/* Image area */}
      <div className="relative flex items-center justify-center pt-4 pb-2"
        style={{ background: `radial-gradient(circle at 50% 70%, rgba(232,169,92,.12) 0%, transparent 65%)` }}>
        {/* Badge */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg text-[10px] font-black"
            style={{ background: C.red, color: 'white' }}>SALE</span>
        )}
        {inCart && (
          <span className="absolute top-2 right-2 size-6 rounded-xl flex items-center justify-center text-[11px] font-black"
            style={{ background: C.gold, color: '#1a0a00' }}>{inCart.qty}</span>
        )}
        <span className="text-5xl transition-transform duration-300 group-hover:scale-110 select-none">
          {item.image_emoji}
        </span>
      </div>

      {/* Info */}
      <div className="px-3 pb-3 flex flex-col gap-1.5 flex-1">
        <p className="font-bold text-xs leading-snug line-clamp-2" style={{ color: C.white, fontFamily: "'DM Serif Display', Georgia, serif" }}>
          {item.name}
        </p>
        {item.description && (
          <p className="text-[10px] leading-tight line-clamp-1" style={{ color: C.white40 }}>{item.description}</p>
        )}

        {/* Price row */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div>
            {hasDiscount && (
              <p className="text-[10px] line-through" style={{ color: C.white40 }}>
                Rp {fmtShort(fakeOriginal)}
              </p>
            )}
            <p className="font-black text-sm leading-none" style={{ color: C.gold }}>
              Rp {fmtShort(item.price)}
            </p>
          </div>

          {inCart ? (
            <div className="flex items-center gap-1.5">
              <button onClick={e => { e.stopPropagation(); onQtyChange(-1); }}
                className="size-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                style={{ background: C.white15, color: C.gold }}>
                <Minus className="w-3 h-3"/>
              </button>
              <span className="text-xs font-bold w-4 text-center" style={{ color: C.white }}>{inCart.qty}</span>
              <button onClick={e => { e.stopPropagation(); onQtyChange(1); }}
                className="size-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                style={{ background: C.gold, color: '#1a0a00' }}>
                <Plus className="w-3 h-3"/>
              </button>
            </div>
          ) : (
            <button className="size-7 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90"
              style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})` }}>
              <Plus className="w-3.5 h-3.5 text-[#1a0a00]"/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Featured / Hero Card (large, horizontal) ──────────────────────────────────
function HeroCard({ item, inCart, onAdd, onQtyChange }: {
  item: MenuItem; inCart: CartItem | undefined;
  onAdd: () => void; onQtyChange: (d: number) => void;
}) {
  return (
    <div className="relative rounded-3xl overflow-hidden cursor-pointer flex items-center gap-4 px-5 py-4"
      style={{ background: `linear-gradient(135deg, #2d1500 0%, #1a0a00 60%, #3d1a00 100%)`, border: `1px solid ${C.goldBorder}`, minHeight: 120 }}
      onClick={!inCart ? onAdd : undefined}>
      {/* Glow blob */}
      <div className="absolute right-0 top-0 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-30"
        style={{ background: `radial-gradient(circle, ${C.gold}, transparent)`, transform: 'translate(30%, -30%)' }}/>

      <span className="text-6xl shrink-0 relative z-10 transition-transform duration-300 hover:scale-110">
        {item.image_emoji}
      </span>
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black" style={{ background: C.gold, color: '#1a0a00' }}>
            ★ FEATURED
          </span>
        </div>
        <p className="font-black text-white text-base leading-tight" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
          {item.name}
        </p>
        {item.description && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: C.white60 }}>{item.description}</p>}
        <div className="flex items-center justify-between mt-2">
          <p className="font-black text-lg" style={{ color: C.gold }}>{fmt(item.price)}</p>
          {inCart ? (
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); onQtyChange(-1); }}
                className="size-8 rounded-xl flex items-center justify-center cursor-pointer"
                style={{ background: C.white15, color: C.gold }}>
                <Minus className="w-3.5 h-3.5"/>
              </button>
              <span className="font-bold text-white text-sm w-5 text-center">{inCart.qty}</span>
              <button onClick={e => { e.stopPropagation(); onQtyChange(1); }}
                className="size-8 rounded-xl flex items-center justify-center cursor-pointer"
                style={{ background: C.gold, color: '#1a0a00' }}>
                <Plus className="w-3.5 h-3.5"/>
              </button>
            </div>
          ) : (
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl cursor-pointer font-bold text-xs"
              style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: '#1a0a00' }}>
              <Plus className="w-3 h-3"/> Tambah
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Special Offer horizontal scroll card ─────────────────────────────────────
function OfferCard({ item, inCart, onAdd, onQtyChange }: {
  item: MenuItem; inCart: CartItem | undefined;
  onAdd: () => void; onQtyChange: (d: number) => void;
}) {
  return (
    <div className="shrink-0 w-36 flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
      style={{ background: C.bgCard2, border: `1px solid ${inCart ? C.goldBorder : C.white08}` }}
      onClick={!inCart ? onAdd : undefined}>
      <div className="flex items-center justify-center h-24 relative"
        style={{ background: `radial-gradient(circle at 50% 60%, rgba(232,169,92,.15) 0%, transparent 70%)` }}>
        <span className="text-4xl">{item.image_emoji}</span>
        {inCart && (
          <span className="absolute top-2 right-2 size-5 rounded-lg flex items-center justify-center text-[10px] font-black"
            style={{ background: C.gold, color: '#1a0a00' }}>{inCart.qty}</span>
        )}
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black"
          style={{ background: '#ef4444', color: 'white' }}>15% OFF</span>
      </div>
      <div className="px-2.5 pb-3 flex flex-col gap-1">
        <p className="text-xs font-bold line-clamp-2 leading-tight" style={{ color: C.white, fontFamily: "'DM Serif Display', Georgia, serif" }}>{item.name}</p>
        <p className="text-[10px] line-through" style={{ color: C.white40 }}>Rp {fmtShort(Math.round(item.price * 1.18))}</p>
        <div className="flex items-center justify-between">
          <p className="font-black text-sm" style={{ color: C.gold }}>Rp {fmtShort(item.price)}</p>
          {inCart ? (
            <div className="flex items-center gap-1">
              <button onClick={e => { e.stopPropagation(); onQtyChange(-1); }}
                className="size-5 rounded-md flex items-center justify-center cursor-pointer" style={{ background: C.white15, color: C.gold }}><Minus className="w-2.5 h-2.5"/></button>
              <span className="text-[10px] font-bold text-white w-3 text-center">{inCart.qty}</span>
              <button onClick={e => { e.stopPropagation(); onQtyChange(1); }}
                className="size-5 rounded-md flex items-center justify-center cursor-pointer" style={{ background: C.gold, color: '#1a0a00' }}><Plus className="w-2.5 h-2.5"/></button>
            </div>
          ) : (
            <button className="size-6 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ background: C.gold, color: '#1a0a00' }}><Plus className="w-3 h-3"/></button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Promo Banner ──────────────────────────────────────────────────────────────
function PromoBanner({ emoji, title, sub, color }: { emoji: string; title: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl flex items-center gap-4 px-4 py-3.5 relative overflow-hidden"
      style={{ background: color, border: `1px solid ${C.white08}` }}>
      <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 80% 50%, white, transparent)' }}/>
      <span className="text-3xl shrink-0 relative z-10">{emoji}</span>
      <div className="relative z-10">
        <p className="font-black text-white text-sm">{title}</p>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,.75)' }}>{sub}</p>
      </div>
    </div>
  );
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────
function CartDrawer({ cart, onQty, onRemove, onClose, onSubmit, submitting, notes, onNotes }: {
  cart: CartItem[]; onQty: (id: number, d: number) => void; onRemove: (id: number) => void;
  onClose: () => void; onSubmit: () => void; submitting: boolean; notes: string; onNotes: (v: string) => void;
}) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * TAX);
  const total = subtotal + tax;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose}/>
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto flex flex-col rounded-t-3xl overflow-hidden"
        style={{ maxHeight: '88vh', background: 'linear-gradient(180deg, #1c1008 0%, #120a04 100%)', boxShadow: '0 -20px 60px rgba(0,0,0,.9)' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-12 h-1 rounded-full" style={{ background: C.white15 }}/>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${C.divider}` }}>
          <div>
            <h2 className="font-black text-white text-base" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>Keranjang</h2>
            <p className="text-xs" style={{ color: C.white40 }}>{cart.reduce((s,i)=>s+i.qty,0)} item dipilih</p>
          </div>
          <button onClick={onClose} className="size-8 rounded-2xl flex items-center justify-center cursor-pointer"
            style={{ background: C.white08, color: C.white60 }}><X className="w-4 h-4"/></button>
        </div>
        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: C.white08 }}>
              <span className="text-2xl shrink-0">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-xs truncate">{item.name}</p>
                <p className="text-[11px] mt-0.5 font-bold" style={{ color: C.gold }}>{fmt(item.price)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => onQty(item.id, -1)} className="size-7 rounded-xl flex items-center justify-center cursor-pointer"
                  style={{ background: C.white15, color: C.gold }}><Minus className="w-3 h-3"/></button>
                <span className="text-white font-bold text-xs w-4 text-center">{item.qty}</span>
                <button onClick={() => onQty(item.id, 1)} className="size-7 rounded-xl flex items-center justify-center cursor-pointer"
                  style={{ background: C.goldLight, color: C.gold }}><Plus className="w-3 h-3"/></button>
                <button onClick={() => onRemove(item.id)} className="size-7 rounded-xl flex items-center justify-center cursor-pointer ml-1"
                  style={{ background: 'rgba(239,68,68,.15)', color: C.red }}><Trash2 className="w-3 h-3"/></button>
              </div>
            </div>
          ))}
          <textarea value={notes} onChange={e => onNotes(e.target.value)} placeholder="Catatan pesanan…" rows={2}
            className="w-full rounded-2xl px-4 py-3 text-xs resize-none outline-none mt-2"
            style={{ background: C.white08, border: `1px solid ${C.white15}`, color: 'white', caretColor: C.gold }}/>
        </div>
        {/* Summary */}
        <div className="shrink-0 px-5 pb-8 pt-3 space-y-3" style={{ borderTop: `1px solid ${C.divider}` }}>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs" style={{ color: C.white60 }}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-xs" style={{ color: C.white60 }}><span>Pajak 10%</span><span>{fmt(tax)}</span></div>
            <div className="flex justify-between font-black text-base pt-2" style={{ borderTop: `1px solid ${C.divider}` }}>
              <span className="text-white">Total</span>
              <span style={{ color: C.gold }}>{fmt(total)}</span>
            </div>
          </div>
          <button onClick={onSubmit} disabled={submitting || !cart.length}
            className="w-full py-4 rounded-2xl font-black text-[#1a0a00] text-sm cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, boxShadow: `0 4px 20px rgba(232,169,92,.4)` }}>
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin"/>Mengirim…</> : <>Kirim Pesanan · {fmt(total)}</>}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Success ───────────────────────────────────────────────────────────────────
function Success({ orderNo, total, tableNo, onAgain }: { orderNo: string; total: number; tableNo: string; onAgain: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: `radial-gradient(ellipse at 50% 0%, #2d1500 0%, ${C.bg} 60%)` }}>
      <div className="w-full max-w-sm text-center">
        <div className="relative mx-auto mb-8 flex items-center justify-center" style={{ width: 120, height: 120 }}>
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: `radial-gradient(circle, ${C.gold}, transparent)`, animationDuration: '2s' }}/>
          <div className="absolute inset-3 rounded-full" style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}` }}/>
          <CheckCircle2 className="w-12 h-12 relative" style={{ color: C.gold }}/>
        </div>
        <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>Pesanan Masuk!</h1>
        <p className="mb-6" style={{ color: C.white60 }}>Staf kami akan segera menyiapkan</p>
        <div className="rounded-3xl p-5 mb-5 text-left space-y-3" style={{ background: C.white08, border: `1px solid ${C.white15}` }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: C.white40 }}>No. Pesanan</span>
            <span className="font-black" style={{ color: C.gold, fontFamily: 'monospace' }}>{orderNo}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: C.white40 }}>Meja</span>
            <span className="font-semibold text-white">{tableNo}</span>
          </div>
          <div className="flex justify-between font-black text-base pt-2" style={{ borderTop: `1px solid ${C.divider}` }}>
            <span className="text-white">Total</span>
            <span style={{ color: C.gold }}>{fmt(total)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl p-3.5 mb-5" style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}` }}>
          <Clock className="w-4 h-4 shrink-0" style={{ color: C.gold }}/>
          <p className="text-xs text-left" style={{ color: C.white60 }}>Bayar ke kasir saat pesanan tiba. Terima kasih!</p>
        </div>
        <button onClick={onAgain} className="w-full py-3.5 rounded-2xl font-bold text-sm cursor-pointer"
          style={{ background: C.white08, border: `1px solid ${C.white15}`, color: C.white60 }}>Pesan Lagi</button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function CustomerMenuPage({ params }: { params: Promise<{ table: string }> }) {
  const { table } = use(params);
  const tableNo   = decodeURIComponent(table);
  const { data: menuItems = [], isLoading, error } = useSWR<MenuItem[]>('/api/public/menu', fetcher);

  const [cart, setCart]         = useState<CartItem[]>([]);
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch]     = useState('');
  const [notes, setNotes]       = useState('');
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState<{ order_no: string; total: number } | null>(null);
  const [submitErr, setSubmitErr] = useState('');

  const allItems = menuItems as MenuItem[];

  // Featured: first available coffee
  const featuredItem = useMemo(() =>
    allItems.find(m => m.category === 'Coffee') || allItems[0],
    [allItems]
  );

  // Special offers: non-featured items from all categories
  const specialOffers = useMemo(() =>
    allItems.filter(m => m.id !== featuredItem?.id).slice(0, 6),
    [allItems, featuredItem]
  );

  // Filtered by category + search
  const filtered = useMemo(() => {
    let rows = allItems;
    if (activeCat !== 'All') rows = rows.filter(m => m.category === activeCat);
    if (search) { const q = search.toLowerCase(); rows = rows.filter(m => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)); }
    return rows;
  }, [allItems, activeCat, search]);

  // Group by category for section headers
  const grouped = useMemo(() => {
    const g: Record<string, MenuItem[]> = {};
    filtered.forEach(m => { (g[m.category] ??= []).push(m); });
    return g;
  }, [filtered]);

  const addItem   = (item: MenuItem) => setCart(c => {
    const ex = c.find(i => i.id === item.id);
    if (ex) return c.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
    return [...c, { id: item.id, name: item.name, price: item.price, qty: 1, emoji: item.image_emoji }];
  });
  const updateQty = (id: number, d: number) => setCart(c =>
    c.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty > 0)
  );

  const cartQty  = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total    = subtotal + Math.round(subtotal * TAX);

  async function submit() {
    setSubmitting(true); setSubmitErr('');
    try {
      const res = await fetch('/api/public/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_no: tableNo,
          items: cart.map(i => ({ menu_item_id: i.id, name: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
          customer_notes: notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal');
      setResult({ order_no: data.order_no, total: data.total });
      setCart([]); setNotes(''); setShowCart(false);
    } catch (e: unknown) { setSubmitErr(e instanceof Error ? e.message : 'Error'); }
    setSubmitting(false);
  }

  // ── Screens ────────────────────────────────────────────────────────────────
  if (result) return <Success orderNo={result.order_no} total={result.total} tableNo={tableNo} onAgain={() => setResult(null)}/>;

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: `radial-gradient(ellipse at 50% 0%, #2d1500 0%, ${C.bg} 60%)` }}>
      <span className="text-6xl animate-bounce" style={{ animationDuration: '1.4s' }}>☕</span>
      <p className="text-sm font-medium" style={{ color: C.white40 }}>Memuat menu…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: C.bg }}>
      <span className="text-4xl">😕</span>
      <p className="font-bold text-white">Menu tidak tersedia</p>
      <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-2xl font-bold text-sm cursor-pointer" style={{ background: C.gold, color: '#1a0a00' }}>Coba lagi</button>
    </div>
  );

  // ── Main Layout ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        body{margin:0;padding:0;background:${C.bg}}
        ::-webkit-scrollbar{display:none}
        scrollbar-width:none;
      `}</style>

      <div className="min-h-screen pb-32" style={{ background: C.bg, fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: '0 auto' }}>

        {/* ── Sticky top bar ── */}
        <div className="sticky top-0 z-30 px-4 pt-4 pb-3 flex items-center gap-3"
          style={{ background: `${C.bg}ee`, backdropFilter: 'blur(20px)' }}>
          {/* Cart button top-left (like reference) */}
          <button onClick={() => setShowCart(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer shrink-0"
            style={{ background: cartQty ? `linear-gradient(135deg, ${C.goldDark}, ${C.gold})` : C.white08, border: `1px solid ${cartQty ? 'transparent' : C.white15}` }}>
            <ShoppingBag className="w-4 h-4" style={{ color: cartQty ? '#1a0a00' : C.gold }}/>
            {cartQty > 0 && <span className="text-[11px] font-black text-[#1a0a00]">{cartQty}</span>}
          </button>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.white40 }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari menu…"
              className="w-full rounded-2xl pl-9 pr-4 py-2.5 text-xs outline-none"
              style={{ background: C.white08, border: `1px solid ${C.white15}`, color: 'white' }}/>
          </div>

          {/* Table badge */}
          <div className="px-3 py-2 rounded-2xl shrink-0" style={{ background: C.white08, border: `1px solid ${C.white15}` }}>
            <p className="text-[10px] font-bold" style={{ color: C.white40 }}>MEJA</p>
            <p className="text-xs font-black leading-none" style={{ color: C.gold }}>{tableNo}</p>
          </div>
        </div>

        {/* ── Layout: left category nav + right content ── */}
        <div className="flex gap-0">

          {/* LEFT: Vertical category sidebar (like reference) */}
          <div className="w-[72px] shrink-0 sticky top-[68px] self-start h-[calc(100vh-68px)] overflow-y-auto flex flex-col gap-1 py-2 px-2"
            style={{ background: `${C.bgCard}aa`, borderRight: `1px solid ${C.divider}` }}>
            {CATS.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                className="flex flex-col items-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all text-center"
                style={activeCat === cat
                  ? { background: C.goldLight, border: `1px solid ${C.goldBorder}` }
                  : { background: 'transparent', border: '1px solid transparent' }}>
                <span className="text-xl leading-none">{CAT_ICONS[cat]}</span>
                <span className="text-[10px] font-bold leading-tight"
                  style={{ color: activeCat === cat ? C.gold : C.white40, wordBreak: 'break-word', lineHeight: 1.2 }}>
                  {cat === 'Non-Coffee' ? 'Non\nCoffee' : cat}
                </span>
              </button>
            ))}
          </div>

          {/* RIGHT: Scrollable content */}
          <div className="flex-1 min-w-0 overflow-x-hidden">
            <div className="px-3 py-3 space-y-5">

              {/* Hero item (featured) */}
              {featuredItem && activeCat === 'All' && !search && (
                <HeroCard item={featuredItem} inCart={cart.find(c => c.id === featuredItem.id)}
                  onAdd={() => addItem(featuredItem)} onQtyChange={d => updateQty(featuredItem.id, d)}/>
              )}

              {/* Special Offers horizontal scroll */}
              {activeCat === 'All' && !search && specialOffers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5" style={{ color: '#f97316' }}/>
                      <h3 className="font-black text-xs uppercase tracking-wider" style={{ color: C.white }}>Special Offers</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#ef444422', color: C.red }}>Limited</span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollSnapType: 'x mandatory' }}>
                    {specialOffers.map(item => (
                      <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
                        <OfferCard item={item} inCart={cart.find(c => c.id === item.id)}
                          onAdd={() => addItem(item)} onQtyChange={d => updateQty(item.id, d)}/>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promo banners */}
              {activeCat === 'All' && !search && (
                <div className="space-y-2.5">
                  <PromoBanner emoji="🎉" title="Buy 2 Get 1 Free" sub="Berlaku untuk semua minuman Coffee" color="linear-gradient(135deg, #7c3aed, #4f46e5)"/>
                  <PromoBanner emoji="🌿" title="Menu Sehat Baru" sub="Non-Coffee & pilihan food sehat" color="linear-gradient(135deg, #16a34a, #15803d)"/>
                </div>
              )}

              {/* Menu sections by category */}
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{CAT_ICONS[cat] || '🍽️'}</span>
                    <h3 className="font-black text-xs uppercase tracking-wider" style={{ color: C.white }}>{cat}</h3>
                    <div className="flex-1 h-px" style={{ background: C.divider }}/>
                    <span className="text-[10px]" style={{ color: C.white40 }}>{items.length} item</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {items.map(item => (
                      <MenuCard key={item.id} item={item} inCart={cart.find(c => c.id === item.id)}
                        onAdd={() => addItem(item)} onQtyChange={d => updateQty(item.id, d)}/>
                    ))}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Search className="w-10 h-10 opacity-20" style={{ color: C.gold }}/>
                  <p className="font-semibold" style={{ color: C.white40 }}>Tidak ada menu</p>
                </div>
              )}

              {/* Bottom padding */}
              <div className="h-4"/>
            </div>
          </div>
        </div>

        {/* Error toast */}
        {submitErr && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-xs font-semibold text-white shadow-2xl"
            style={{ background: 'rgba(239,68,68,.95)', maxWidth: 300, textAlign: 'center' }}>
            {submitErr}
          </div>
        )}
      </div>

      {/* Floating cart CTA */}
      <CartFab qty={cartQty} total={total} onClick={() => setShowCart(true)}/>

      {/* Cart drawer */}
      {showCart && (
        <CartDrawer cart={cart} onQty={updateQty} onRemove={id => setCart(c => c.filter(i => i.id !== id))}
          onClose={() => setShowCart(false)} onSubmit={submit} submitting={submitting} notes={notes} onNotes={setNotes}/>
      )}
    </>
  );
}
