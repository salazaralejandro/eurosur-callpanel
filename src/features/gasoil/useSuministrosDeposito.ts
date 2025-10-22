// src/features/gasoil/useSuministrosDeposito.ts
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { z } from 'zod'
import {
  SuministroFromApi,
  type Suministro as SuministroObject,
} from './schema'

// ... (El tipo EstadoEstimado y ymd() no cambian) ...
export type EstadoEstimado = {
  capacidad?: number | null
  stockInicial?: number | null
  entradas?: number
  consumos: number
  stockEstimado: number | null
  porcentaje: number | null
}
export function ymd(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
// ...

function apiTupleToSuministro(
  row: z.infer<typeof SuministroFromApi>,
): SuministroObject {
  const [
    id_usuario,
    id_vehiculo,
    km,
    litros,
    precio,
    fecha_hora,
    num_serie_surtidor,
    id_deposito,
    id_combustible,
  ] = row

  return {
    ID_USUARIO: id_usuario,
    ID_VEHICULO: id_vehiculo,
    KM: km,
    LITROS_SUMINISTRADOS: litros,
    PRECIO: precio,
    'FECHA Y HORA': fecha_hora,
    NUMERO_DE_SERIE_SURTIDOR: num_serie_surtidor,
    ID_DEPOSITO: id_deposito,
    ID_COMBUSTIBLE: id_combustible,
  }
}

export function useSuministrosDeposito(
  depositoId: number | string,
  inicio: string,
  fin: string,
  refetchMs = 60_000,
) {
  return useQuery({
    queryKey: ['suministros-deposito', String(depositoId), inicio, fin],
    queryFn: async () => {
      // --- CAMBIO: Usamos fetch a nuestro propio proxy ---
      const params = new URLSearchParams({
        id: String(depositoId),
        inicio: inicio,
        fin: fin,
      })
      const resReq = await fetch(`/api/suministros-deposito?${params.toString()}`)
      if (!resReq.ok) {
        throw new Error('Error al cargar /api/suministros-deposito')
      }
      const res = await resReq.json()

      const rawTuples = SuministroFromApi.array().parse(res)

      return rawTuples
        .map(apiTupleToSuministro)
        .sort((a: SuministroObject, b: SuministroObject) =>
          a['FECHA Y HORA'] < b['FECHA Y HORA'] ? 1 : -1,
        )
    },
    refetchInterval: refetchMs,
    refetchIntervalInBackground: true,
    staleTime: Math.floor(refetchMs * 0.5),
    initialData: [] as SuministroObject[],
    enabled: !!depositoId && !!inicio && !!fin,
  })
}

// ... (El resto del archivo: calcularEstadoEstimado, useEstadoDeposito, etc. no cambia) ...
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
    return { capacidad, stockInicial, entradas, consumos, stockEstimado: null, porcentaje: null }
  }

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
export function useEstadoDeposito(
  depositoId: number | string,
  inicio: string,
  fin: string,
  opciones?: {
    capacidad?: number | null
    stockInicial?: number | null
    entradas?: number | null
    refetchMs?: number
  },
) {
  const refetchMs = opciones?.refetchMs ?? 60_000
  const q = useSuministrosDeposito(depositoId, inicio, fin, refetchMs)

  const totalConsumos = computed(() =>
    (q.data.value ?? []).reduce((a: number, s: SuministroObject) => a + Number(s.LITROS_SUMINISTRADOS || 0), 0),
  )
  const ultimo = computed(() => (q.data.value ?? [])[0] ?? null)

  const estado = computed<EstadoEstimado>(() =>
    calcularEstadoEstimado({
      capacidad: opciones?.capacidad ?? null,
      stockInicial: opciones?.stockInicial ?? null,
      entradas: opciones?.entradas ?? 0,
      consumos: totalConsumos.value,
    }),
  )

  return {
    ...q,
    totalConsumos,
    ultimo,
    estado,
  }
}
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