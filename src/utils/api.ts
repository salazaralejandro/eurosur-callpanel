// /utils/api.ts (ACTUALIZADO Y SEGURO)
import ky from 'ky'

const isDev = import.meta.env.DEV

let _gasogesStatus: 'ok' | 'error' | 'idle' = 'idle'
let _mundosmsStatus: 'ok' | 'error' | 'idle' = 'idle'
export const getGasogesApiStatus = () => _gasogesStatus
export const getMundoSmsApiStatus = () => _mundosmsStatus

/**
 * Cliente API para el proxy de Gasoges.
 * Habla con /gasoapi (en dev) o /api/gasoges (en prod).
 * ❌ SIN AUTENTICACIÓN AQUÍ. Se añade en el backend/proxy.
 */
export const gasogesApi = ky.create({
  prefixUrl: isDev ? '/gasoapi' : '/api/gasoges',
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  hooks: {
    afterResponse: [
      (_req, _opt, res) => {
        _gasogesStatus = res.ok ? 'ok' : 'error'
        return res
      },
    ],
    beforeError: [
      (error) => {
        _gasogesStatus = 'error'
        return error
      },
    ],
  },
})

/**
 * Cliente API para los proxies de MundoSMS.
 * Habla con /smsapi (en dev) o /api (en prod).
 * ❌ SIN AUTENTICACIÓN AQUÍ. Se añade en /api/voip.calls.ts
 */
export const mundosmsApi = ky.create({
  // Apuntamos a la raíz de nuestras propias APIs
  prefixUrl: isDev ? '/smsapi' : '/api',
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  hooks: {
    // ❌ ELIMINADO el hook 'beforeRequest' que añadía el VITE_MUNDOSMS_TOKEN

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