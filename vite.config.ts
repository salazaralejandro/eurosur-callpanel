import { URL, fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import tailwind from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue(), tailwind()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),

    },
  },
})
