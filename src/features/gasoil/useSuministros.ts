import { gasogesApi } from '@/utils/api'
import { useQuery } from '@tanstack/vue-query'

export type Suministro = {
  ID_USUARIO?: number | null
  ID_VEHICULO?: number | null
  KM?: number | null
  LITROS_SUMINISTRADOS: number
  PRECIO?: number | null
  FECHA_HORA: string
  NUMERO_SERIE_SURTIDOR?: number | string | null
}

// YYYY-MM-DD
export function ymd(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Normaliza un registro que puede venir como objeto o como tupla (array) */
function normalizeRow(raw: any): Suministro | null {
  // A) OBJETO (con claves)
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const litros = Number(
      raw.LITROS_SUMINISTRADOS ?? raw['LITROS_SUMINISTRADOS'] ?? raw['litros'] ?? raw['LITROS']
    )
    if (!Number.isFinite(litros)) return null
    const fecha =
      raw.FECHA_HORA ?? raw['FECHA_HORA'] ?? raw['FECHA Y HORA'] ?? raw['fecha_hora'] ?? raw['fecha'] ?? ''
    return {
      ID_USUARIO: raw.ID_USUARIO ?? null,
      ID_VEHICULO: raw.ID_VEHICULO ?? null,
      KM: raw.KM ?? null,
      LITROS_SUMINISTRADOS: litros,
      PRECIO: raw.PRECIO != null ? Number(raw.PRECIO) : null,
      FECHA_HORA: String(fecha),
      NUMERO_SERIE_SURTIDOR: raw.NUMERO_SERIE_SURTIDOR ?? raw['NUMERO DE SERIE SURTIDOR'] ?? null,
    }
  }

  // B) TUPLA (array) en el orden documentado
  // [0] ID_USUARIO
  // [1] ID_VEHICULO
  // [2] KM
  // [3] LITROS_SUMINISTRADOS
  // [4] PRECIO
  // [5] "FECHA Y HORA"
  // [6] NUMERO_SERIE_SURTIDOR
  if (Array.isArray(raw)) {
    const litros = Number(raw[3])
    if (!Number.isFinite(litros)) return null
    return {
      ID_USUARIO: raw[0] ?? null,
      ID_VEHICULO: raw[1] ?? null,
      KM: raw[2] ?? null,
      LITROS_SUMINISTRADOS: litros,
      PRECIO: raw[4] != null ? Number(raw[4]) : null,
      FECHA_HORA: raw[5] ? String(raw[5]) : '',
      NUMERO_SERIE_SURTIDOR: raw[6] ?? null,
    }
  }

  return null
}

export function useSuministros(inicio: string, fin: string, refetchMs = 60_000) {
  return useQuery({
    queryKey: ['suministros', inicio, fin],
    queryFn: async () => {
      const res = await gasogesApi
        .get(`suministros/todos/${encodeURIComponent(inicio)}/${encodeURIComponent(fin)}`)
        .json<unknown>()

      const raw: any[] =
        Array.isArray(res) ? res : (res && typeof res === 'object' && Array.isArray((res as any).data) ? (res as any).data : [])

      return raw
        .map(normalizeRow)
        .filter((r): r is Suministro => !!r)
        .sort((a, b) => (a.FECHA_HORA < b.FECHA_HORA ? 1 : -1)) // recientes primero
    },
    refetchInterval: refetchMs,
    refetchIntervalInBackground: true,
    staleTime: Math.floor(refetchMs * 0.5),
    initialData: [] as Suministro[],
  })
}
