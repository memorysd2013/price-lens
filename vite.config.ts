import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Price Lens',
        short_name: 'PriceLens',
        description: 'Scan and recognize prices',
        theme_color: '#d0bb95',
        background_color: '#1a2744',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 8011,
    host: true,
    // Use HTTP in dev to avoid self-signed cert issues; use mkcert for HTTPS on device
    // https: true,
  },
  resolve: {
    alias: [
      // Map .js requests to .ts (fix 404 from moduleResolution)
      {
        find: /^(\/src\/.*)\.js$/,
        replacement: '$1.ts',
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
});
