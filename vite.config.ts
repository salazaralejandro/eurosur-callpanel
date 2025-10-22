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

  return {
    plugins: [vue(), tailwind()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 3173, // Tu puerto
      proxy: {
        // Tu proxy de SMS
        '/smsapi': {
          target: 'https://api.mundosms.es',
          changeOrigin: true,
          rewrite: p => p.replace(/^\/smsapi/, ''),
        },

        // --- ¡CAMBIOS EN EL PROXY DE API! ---
        // (Deben ir DE MÁS ESPECÍFICO A MÁS GENÉRICO)

        // 1. PROXY ESPECÍFICO (para /api/depositos/nivel)
        '/api/depositos/nivel': {
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
        
        // 2. ¡NUEVO! PROXY ESPECÍFICO (para /api/suministros)
        '/api/suministros': {
          target: env.VITE_GASOGES_API_URL,
          changeOrigin: true,
          headers: { 'Authorization': `Basic ${basicAuthToken}` },
          // Reescribe la URL de GET ?inicio=...&fin=... a /suministros/todos/.../...
          rewrite: (path) => {
            const params = new URLSearchParams(path.split('?')[1])
            const inicio = params.get('inicio')
            const fin = params.get('fin')
            return `/suministros/todos/${inicio}/${fin}`
          },
        },
        
        // 3. PROXY GENÉRICO (para /api/depositos, /api/usuarios, /api/vehiculos)
        '/api': {
          target: env.VITE_GASOGES_API_URL, 
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          headers: {
            'Authorization': `Basic ${basicAuthToken}`
          }
        }
      },
    },
  }
})