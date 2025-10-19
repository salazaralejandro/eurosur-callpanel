// vite.config.ts
import { URL, fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import tailwind from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue(), tailwind()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    proxy: {
      '/smsapi': {
        target: 'https://api.mundosms.es',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/smsapi/, ''),
      },
      '/gasoapi': {
        target: 'https://api.gasoges.es/v1',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/gasoapi/, ''),
      },
    },
  },
})
