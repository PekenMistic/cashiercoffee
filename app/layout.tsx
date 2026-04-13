import type { Metadata, Viewport } from 'next';
import { SWRProvider } from '@/components/SWRProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewStock — Modern Coffee Management',
  description: 'Sistem manajemen kedai kopi modern dengan menu interaktif QR, manajemen inventori, dan integrasi pembayaran',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'BrewStock' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#8b7355',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="bg-background">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
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
