import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env['VITE_BASE_PATH'] ?? '/',
  plugins: [
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Model Railway Planner',
        short_name: 'Track Planner',
        description: 'Inventory-aware, offline model railway layout planning.',
        theme_color: '#163d34',
        background_color: '#f5f4ef',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'] },
    }),
  ],
  test: { include: ['src/**/*.test.ts'] },
});
