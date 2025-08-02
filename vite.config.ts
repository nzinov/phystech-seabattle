/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      workbox: {
        globPatterns: ['**/*.{js,jsx,ts,tsx,css,html,ico,png,svg,woff2,json,wasm}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-static-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
      },
      manifest: {
        name: 'Phystech Seabattle',
        short_name: 'Seabattle',
        description:
          'Strategic naval battle game with complex rules originally played by students at Moscow Institute of Physics and Technology',
        start_url: '/',
        display: 'fullscreen',
        orientation: 'landscape',
        theme_color: '#1e3c72',
        background_color: '#1e3c72',
        categories: ['games', 'strategy'],
        lang: 'en',
        icons: [
          {
            src: 'logo_small.png',
            sizes: '50x50',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: '127.0.0.1',
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      },
      '/games': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
});
