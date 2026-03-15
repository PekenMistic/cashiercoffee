import type { Metadata, Viewport } from 'next';
import { SWRProvider } from '@/components/SWRProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewStock — Coffee Management',
  description: 'Sistem manajemen kedai kopi — offline-first, sync otomatis',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'BrewStock' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#165DFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png"/>
      </head>
      <body>
        <SWRProvider>
          {children}
        </SWRProvider>
      </body>
    </html>
  );
}
