import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pesan Sekarang — BrewStock',
  description: 'Pesan langsung dari meja Anda',
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
