# BrewStock ☕ — Coffee Shop Management System

Sistem manajemen kedai kopi **offline-first** dengan **sync otomatis** dan **QR Order** untuk pelanggan.

## 🚀 Cara Pakai — 2 Langkah

```bash
npm install
npm run dev        # buka http://localhost:3000
```

Data demo 30 hari + semua master data di-seed otomatis pada start pertama.  
**Tidak perlu database server, Docker, atau konfigurasi apapun.**

---

## 🎯 Fitur Lengkap

### Admin Panel (http://localhost:3000)
| Menu | Deskripsi |
|---|---|
| 🛒 **Kasir / POS** | Transaksi dengan deduct stok via resep, tambah/edit/hapus menu |
| 📦 **Inventori** | CRUD stok + alert rendah/kritis |
| 📋 **Purchase Order** | Workflow draft→kirim→terima, stok auto-update |
| 📖 **Resep & BOM** | Mapping menu ke bahan baku |
| 🧾 **Transaksi** | Riwayat stok masuk/keluar |
| 👥 **Karyawan + Shift** | Clock-in/out, hitung jam kerja otomatis |
| 💰 **Penggajian** | Kalkulasi gaji bulanan |
| 📊 **Dashboard** | Revenue real-time, alert stok, top menu |
| 📈 **Laporan** | Analytics hari ini/minggu/bulan |
| 📱 **Meja & QR Order** | Generate QR per meja, pantau pesanan masuk |

### Customer QR Order (http://localhost:3000/menu/[nama-meja])
- Scan QR di meja → buka menu di HP
- Browse menu (search, filter kategori)
- Tambah ke keranjang → tulis catatan → kirim pesanan
- Status pesanan real-time

---

## 📶 Offline + Sync

| Situasi | Perilaku |
|---|---|
| Online | Data fresh dari server, di-cache ke IndexedDB |
| Offline | Serve dari IndexedDB, mutasi masuk antrian |
| Kembali online | Antrian di-sync otomatis ke server |
| PWA | Installable, Service Worker cache aset |

---

## 🍽️ QR Order Flow

```
Admin → "Meja & QR Order" → Generate QR Meja 1
        ↓ cetak / tempel di meja
Customer → Scan QR → /menu/Meja%201
        ↓ pilih menu, kirim pesanan
Order masuk → status: pending, source: qr, table_no: Meja 1
        ↓ auto-refresh tiap 10 detik di admin
Staf → konfirmasi → klik "Selesai" → status: completed
        ↓ stok terpotong otomatis via resep
```

---

## 🔧 Scripts

```bash
npm run dev       # development server
npm run build     # production build
npm start         # production server
npm run db:seed   # reset & isi ulang data demo
```

---

## 💾 Database

File SQLite: `./data/brewstock.db` (auto-created, auto-seeded)  
Backup: copy file tersebut  
Reset: hapus file → restart app

---

## ⚙️ Teknologi

- **Next.js 16** + React 19 + TypeScript
- **SQLite** via `@libsql/client` — offline, pure JS, tanpa server
- **Drizzle ORM** — type-safe queries
- **SWR** — stale-while-revalidate, lazy load per halaman
- **IndexedDB** (`idb`) — offline cache + sync queue
- **next-pwa** — Service Worker, installable PWA
- **Tailwind CSS v4** + CSS design tokens
