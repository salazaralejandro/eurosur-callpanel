// vite.config.ts
import { URL, fileURLToPath } from 'node:url'
// 1. Importa 'loadEnv' además de 'defineConfig'
import { defineConfig, loadEnv } from 'vite'

import tailwind from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

// 2. Cambia a la forma de "función" para poder leer el 'mode'
export default defineConfig(({ mode }) => {
  
  // 3. Carga las variables de entorno (de tu .env.local)
  const env = loadEnv(mode, process.cwd(), '')

  // 4. Crea el token de Basic Auth para el proxy local
  const basicAuthToken = Buffer.from(
    `${env.VITE_GASOGES_USERNAME}:${env.VITE_GASOGES_PASSWORD}`
  ).toString('base64')

  // 5. Devuelve tu configuración (plugins y alias se quedan igual)
  return {
    plugins: [vue(), tailwind()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // Opcional: si quieres forzar el puerto que usabas (visto en la captura)
      // port: 3173,

      proxy: {
        // Tu proxy existente para /smsapi (se queda igual)
        '/smsapi': {
          target: 'https://api.mundosms.es',
          changeOrigin: true,
          rewrite: p => p.replace(/^\/smsapi/, ''),
        },

        // --- 6. NUESTRO PROXY PARA GASOGES AÑADIDO ---
        '/api': {
          target: env.VITE_GASOGES_API_URL, // De tu .env.local (ej: https://api.gasoges.es/v1)
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