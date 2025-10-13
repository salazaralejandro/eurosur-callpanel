import { URL, fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import tailwind from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue(), tailwind()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@store': fileURLToPath(new URL('./src/store', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
    },
  },
})
