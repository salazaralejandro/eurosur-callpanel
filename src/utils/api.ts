import ky from 'ky'

const isDev = import.meta.env.DEV

// GASOGES
export const gasogesApi = ky.create({
  prefixUrl: isDev ? '/gasoapi' : (import.meta.env.VITE_GASOGES_API_URL ?? 'https://api.gasoges.es/v1'),
  timeout: 10000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  hooks: {
    beforeRequest: [
      (request) => {
        if (!isDev) {
          const u = import.meta.env.VITE_GASOGES_USERNAME
          const p = import.meta.env.VITE_GASOGES_PASSWORD
          if (u && p) request.headers.set('Authorization', 'Basic ' + btoa(`${u}:${p}`))
        }
      },
    ],
  },
})

// MUNDOSMS
export const mundosmsApi = ky.create({
  prefixUrl: isDev ? '/smsapi' : (import.meta.env.VITE_MUNDOSMS_API_URL ?? 'https://api.mundosms.com'),
  timeout: 10000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = import.meta.env.VITE_MUNDOSMS_TOKEN
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
  },
})

// Alias
export const api = gasogesApi
