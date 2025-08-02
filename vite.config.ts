/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/]
      },
      manifest: {
        name: 'Phystech Seabattle',
        short_name: 'Seabattle',
        description: 'Strategic naval battle game with complex rules originally played by students at Moscow Institute of Physics and Technology',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo_small.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: '127.0.0.1',
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:8000',
        ws: true,
        changeOrigin: true
      },
      '/games': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  }
})