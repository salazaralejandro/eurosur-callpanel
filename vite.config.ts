import { defineConfig, loadEnv } from 'vite'

import path from 'path'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables .env (ej. .env.local)
  const env = loadEnv(mode, process.cwd(), '')

  // Prepara el token de auth para el proxy local
  const basicAuthToken = Buffer.from(
    `${env.VITE_GASOGES_USERNAME}:${env.VITE_GASOGES_PASSWORD}`
  ).toString('base64')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // Asegúrate de que el puerto es el que usas (ej. 3173)
      port: 3173,
      
      // --- Proxy para desarrollo LOCAL ---
      proxy: {
        '/api': {
          target: env.VITE_GASOGES_API_URL, // Ej: https://api.gasoges.es/v1
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          headers: {
            Authorization: `Basic ${basicAuthToken}`
          }
        }
      }
    }
  }
})