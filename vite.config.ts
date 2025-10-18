import { URL, fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

import tailwind from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const gasUser = env.VITE_GASOGES_USERNAME ?? ''
  const gasPass = env.VITE_GASOGES_PASSWORD ?? ''
  const gasBasic = Buffer.from(`${gasUser}:${gasPass}`).toString('base64')

  return {
    plugins: [vue(), tailwind()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      proxy: {
        // GASOGES -> /gasoapi/*
        '/gasoapi': {
          target: env.VITE_GASOGES_API_URL || 'https://api.gasoges.es/v1',
          changeOrigin: true,
          secure: true,
          rewrite: p => p.replace(/^\/gasoapi/, ''),
          headers: {
            Authorization: `Basic ${gasBasic}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
        // MUNDOSMS -> /smsapi/*   (aunque no lo uses aún, déjalo preparado)
        '/smsapi': {
          target: env.VITE_MUNDOSMS_API_URL || 'https://api.mundosms.com',
          changeOrigin: true,
          secure: true,
          rewrite: p => p.replace(/^\/smsapi/, ''),
          // Si tuvieras token fijo, puedes inyectarlo aquí:
          // headers: { Authorization: `Bearer ${env.VITE_MUNDOSMS_TOKEN || ''}` },
        },
      },
    },
  }
})
