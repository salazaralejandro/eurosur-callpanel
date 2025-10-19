import ky from 'ky'

const isDev = import.meta.env.DEV

let _gasogesStatus: 'ok'|'error'|'idle' = 'idle'
let _mundosmsStatus: 'ok'|'error'|'idle' = 'idle'
export const getGasogesApiStatus = () => _gasogesStatus
export const getMundoSmsApiStatus = () => _mundosmsStatus


export const gasogesApi = ky.create({
  prefixUrl: isDev
    ? '/gasoapi'
    : (import.meta.env.VITE_GASOGES_API_URL ?? 'https://api.gasoges.es/v1'),
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization:
      'Basic ' +
      btoa(
        `${import.meta.env.VITE_GASOGES_USERNAME}:${import.meta.env.VITE_GASOGES_PASSWORD}`
      ),
  },
})


// MUNDOSMS  (⚠️ Este es el que faltaba exportar con este nombre exacto)
export const mundosmsApi = ky.create({
  prefixUrl: isDev
    ? '/smsapi'
    : (import.meta.env.VITE_MUNDOSMS_API_URL ?? 'https://api.mundosms.es'),
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  hooks: {
    beforeRequest: [
      (request) => {
        // En dev y prod, si hay token lo añadimos
        const token = import.meta.env.VITE_MUNDOSMS_TOKEN
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
    afterResponse: [
      (_req, _opt, res) => {
        _mundosmsStatus = res.ok ? 'ok' : 'error'
        return res
      },
    ],
    beforeError: [
      (error) => {
        _mundosmsStatus = 'error'
        return error
      },
    ],
  },
})

// Alias si en alguna parte antigua se usa `api`
export const api = gasogesApi
