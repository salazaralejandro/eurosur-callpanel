import { computed } from 'vue'
import { gasogesApi } from '@/utils/api'
// src/features/gasoil/useSuministrosDeposito.ts
import { useQuery } from '@tanstack/vue-query'

/** ===== Tipos ===== */
export type Suministro = {
  ID_USUARIO?: number | null
  ID_VEHICULO?: number | null
  KM?: number | null
  LITROS_SUMINISTRADOS: number
  PRECIO?: number | null
  FECHA_HORA: string
  NUMERO_SERIE_SURTIDOR?: number | string | null
}

export type EstadoEstimado = {
  capacidad?: number | null
  stockInicial?: number | null
  entradas?: number // reposiciones en el periodo (si las conoces)
  consumos: number   // total suministrado (salidas)
  stockEstimado: number | null // acotado a [0, capacidad]
  porcentaje: number | null
}

/** ===== Utilidades ===== */
export function ymd(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Normaliza un registro de suministro: acepta OBJETO o TUPLA (array) */
function normalizeRow(raw: any): Suministro | null {
  // Caso OBJETO
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const litros = Number(
      raw.LITROS_SUMINISTRADOS ??
      raw['LITROS_SUMINISTRADOS'] ??
      raw['litros'] ??
      raw['LITROS']
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

  // Caso TUPLA (orden documentado)
  // [0] ID_USUARIO, [1] ID_VEHICULO, [2] KM, [3] LITROS_SUMINISTRADOS, [4] PRECIO,
  // [5] FECHA Y HORA, [6] NUMERO DE SERIE SURTIDOR, ... (ignorar resto si lo hubiera)
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

/** ===== Hook: suministros de un depósito entre fechas =====
 * GET /v1/suministros/deposito/{ID}/{inicio}/{fin}
 */
export function useSuministrosDeposito(
  depositoId: number | string,
  inicio: string,
  fin: string,
  refetchMs = 60_000
) {
  return useQuery({
    queryKey: ['suministros-deposito', String(depositoId), inicio, fin],
    queryFn: async () => {
      const res = await gasogesApi
        .get(`suministros/deposito/${encodeURIComponent(String(depositoId))}/${encodeURIComponent(inicio)}/${encodeURIComponent(fin)}`)
        .json<unknown>()

      const raw: any[] =
        Array.isArray(res) ? res
        : (res && typeof res === 'object' && Array.isArray((res as any).data)) ? (res as any).data
        : []

      return raw
        .map(normalizeRow)
        .filter((r): r is Suministro => !!r)
        .sort((a, b) => (a.FECHA_HORA < b.FECHA_HORA ? 1 : -1)) // recientes primero
    },
    refetchInterval: refetchMs,
    refetchIntervalInBackground: true,
    staleTime: Math.floor(refetchMs * 0.5),
    initialData: [] as Suministro[],
    enabled: !!depositoId && !!inicio && !!fin,
  })
}

/** ===== Helper de estado estimado (opcional) =====
 * Calcula stockEstimado = stockInicial + entradas - consumos
 * Acota a [0, capacidad] si hay capacidad.
 */
export function calcularEstadoEstimado(opts: {
  capacidad?: number | null
  stockInicial?: number | null
  entradas?: number | null
  consumos: number
}): EstadoEstimado {
  const capacidad = Number.isFinite(Number(opts.capacidad)) ? Number(opts.capacidad) : null
  const stockInicial = Number.isFinite(Number(opts.stockInicial)) ? Number(opts.stockInicial) : null
  const entradas = Number.isFinite(Number(opts.entradas)) ? Number(opts.entradas) : 0
  const consumos = Number(opts.consumos) || 0

  if (stockInicial == null && capacidad == null) {
    // No podemos estimar sin al menos un punto de partida
    return { capacidad, stockInicial, entradas, consumos, stockEstimado: null, porcentaje: null }
  }

  // Si no hay stockInicial pero sí capacidad, asumimos 0 por defecto
  const base = stockInicial ?? 0
  let estimado = base + entradas - consumos
  if (capacidad != null) {
    estimado = Math.max(0, Math.min(capacidad, estimado))
  }

  const porcentaje =
    capacidad != null && capacidad > 0 && Number.isFinite(estimado)
      ? Math.round((estimado / capacidad) * 100)
      : null

  return {
    capacidad,
    stockInicial,
    entradas,
    consumos,
    stockEstimado: Number.isFinite(estimado) ? estimado : null,
    porcentaje,
  }
}

/** ===== Composable de "estado de depósito" (cómodo para el Dashboard) =====
 * Lee suministros del depósito y devuelve:
 *  - totales del periodo
 *  - último suministro
 *  - estado estimado (si le pasas capacidad/stockInicial/entradas)
 */
export function useEstadoDeposito(
  depositoId: number | string,
  inicio: string,
  fin: string,
  opciones?: {
    capacidad?: number | null
    stockInicial?: number | null
    entradas?: number | null // reposiciones en el periodo
    refetchMs?: number
  }
) {
  const refetchMs = opciones?.refetchMs ?? 60_000
  const q = useSuministrosDeposito(depositoId, inicio, fin, refetchMs)

  const totalConsumos = computed(() =>
    (q.data.value ?? []).reduce((a, s) => a + Number(s.LITROS_SUMINISTRADOS || 0), 0)
  )
  const ultimo = computed(() => (q.data.value ?? [])[0] ?? null)

  const estado = computed<EstadoEstimado>(() =>
    calcularEstadoEstimado({
      capacidad: opciones?.capacidad ?? null,
      stockInicial: opciones?.stockInicial ?? null,
      entradas: opciones?.entradas ?? 0,
      consumos: totalConsumos.value,
    })
  )

  return {
    ...q,
    totalConsumos, // litros totales suministrados en el rango
    ultimo,        // último suministro (si hay)
    estado,        // {capacidad, stockInicial, entradas, consumos, stockEstimado, porcentaje}
  }
}

/** ====== (Opcional) cargar capacidades/stock desde ENV ======
 * Puedes definir en .env.local:
 *   VITE_DEPOS_CAP='{"2":5000,"3":8000}'
 *   VITE_DEPOS_STOCK='{"2":3200}'
 *   VITE_DEPOS_ENTRADAS='{"2":0}'
 */
export function getCapacidadesFromEnv(): Record<string, number> {
  try {
    const raw = import.meta.env.VITE_DEPOS_CAP
    return raw ? JSON.parse(String(raw)) : {}
  } catch { return {} }
}
export function getStockInicialFromEnv(): Record<string, number> {
  try {
    const raw = import.meta.env.VITE_DEPOS_STOCK
    return raw ? JSON.parse(String(raw)) : {}
  } catch { return {} }
}
export function getEntradasFromEnv(): Record<string, number> {
  try {
    const raw = import.meta.env.VITE_DEPOS_ENTRADAS
    return raw ? JSON.parse(String(raw)) : {}
  } catch { return {} }
}
