// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages の URL「https://<ユーザー名>.github.io/<リポジトリ名>/」に対応させる
  base: '/pwa-clock/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'デジタル時計',
        short_name: 'Clock',
        description: '多機能デジタル時計 PWA',
        theme_color: '#121212',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
