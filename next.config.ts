import type { NextConfig } from 'next';
// @ts-expect-error next-pwa types
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  turbopack: {},  // Required for Next.js 16 Turbopack compatibility
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'brewstock-api',
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /\.(?:js|css|woff2?)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'brewstock-static', expiration: { maxEntries: 100, maxAgeSeconds: 2592000 } },
    },
    {
      urlPattern: /^\/$/,
      handler: 'NetworkFirst',
      options: { cacheName: 'brewstock-pages', networkTimeoutSeconds: 3 },
    },
  ],
})(nextConfig);
