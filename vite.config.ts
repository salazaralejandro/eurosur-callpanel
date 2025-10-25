// vite.config.ts
import { URL, fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

import tailwind from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basicAuthToken = Buffer.from(
    `${env.VITE_GASOGES_USERNAME}:${env.VITE_GASOGES_PASSWORD}`
  ).toString('base64')

  // URL donde corre 'vercel dev' (tus APIs /api/voip.calls.ts, etc.)
  const VERCEL_DEV_URL = 'http://localhost:3000' // O el puerto que uses

  return {
    plugins: [vue(), tailwind()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 3173, // Tu puerto de frontend
      proxy: {
        // --- Proxy 1: MundoSMS (Seguro) ---
        // utils/api.ts (mundosmsApi) llama a '/smsapi/voip.calls'
        '/smsapi': {
          target: VERCEL_DEV_URL, // Apunta a tu backend de Vercel
          changeOrigin: true,
          // Reescribe: /smsapi/voip.calls -> /api/voip.calls
          rewrite: path => path.replace(/^\/smsapi/, '/api'),
          // No se añade token aquí. Se añade en /api/voip.calls.ts
        },

        // --- Proxy 2: Gasoges (Seguro) ---
        // utils/api.ts (gasogesApi) llama a '/gasoapi/depositos'
        '/gasoapi': {
          target: env.VITE_GASOGES_API_URL, // Apunta a Gasoges
          changeOrigin: true,
          // Reescribe: /gasoapi/depositos -> /depositos
          rewrite: path => path.replace(/^\/gasoapi/, ''),
          headers: {
            'Authorization': `Basic ${basicAuthToken}`,
          },
        },

        // --- NOTA ---
        // Ya NO necesitas los proxies específicos '/api/depositos/nivel'
        // porque tu 'utils/api.ts' ahora usa '/gasoapi' y
        // tu backend (/api/gasoges.ts) debe manejar esa lógica de rewrite.
        
        // Si quieres mantener la lógica de rewrite en Vite (solo para dev):
        '/gasoapi/depositos/nivel': {
          target: env.VITE_GASOGES_API_URL,
          changeOrigin: true,
          headers: { 'Authorization': `Basic ${basicAuthToken}` },
          rewrite: (path) => {
            const params = new URLSearchParams(path.split('?')[1])
            const id = params.get('id')
            const fecha = params.get('fecha')
            return `/depositos/nivel/${id}/${fecha}`
          },
        },
        '/gasoapi/suministros': {
          target: env.VITE_GASOGES_API_URL,
          changeOrigin: true,
          headers: { 'Authorization': `Basic ${basicAuthToken}` },
          rewrite: (path) => {
            const params = new URLSearchParams(path.split('?')[1])
            const inicio = params.get('inicio')
            const fin = params.get('fin')
            return `/suministros/todos/${inicio}/${fin}`
          },
        },
      },
    },
  }
})