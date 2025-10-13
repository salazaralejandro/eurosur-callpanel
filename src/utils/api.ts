import ky from 'ky'
export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_BASE ?? '/api',
  timeout: 10000,
  credentials: 'include',
})
