// src/features/gasoil/useGasoil.ts
import { computed, unref } from 'vue'

import { gasogesApi } from '@/utils/api'
import { useQuery } from '@tanstack/vue-query'

/** === Tipos (ajusta si ya los tienes) === */
export type EstadoDeposito = {
  ID_DEPOSITO: number
  NOMBRE: string
  CAPACIDAD: number | null
  LITROS_ACTUALES: number | null
  PORCENTAJE: number | null
  ULTIMO_SUMINISTRO: string | null
}

/** === Intervalo por defecto (5 min) — override con VITE_GASOIL_REFETCH_MS === */
const DEFAULT_REFETCH_MS = Number(import.meta.env.VITE_GASOIL_REFETCH_MS ?? 300000)

/** === Normaliza /depositos que puede devolver formatos distintos === */
function coerceDepositos(res: unknown): EstadoDeposito[] {
  // objetos completos
  if (Array.isArray(res) && res.length && typeof res[0] === 'object' && !Array.isArray(res[0])) {
    return res as EstadoDeposito[]
  }
  // { data: [...] }
  if (res && typeof res === 'object' && Array.isArray((res as any).data)) {
    return (res as any).data as EstadoDeposito[]
  }
  // tuplas [id, nombre]
  if (Array.isArray(res) && res.length && Array.isArray(res[0])) {
    return (res as Array<[number | string, string]>).map(([id, name]) => ({
      ID_DEPOSITO: Number(id),
      NOMBRE: String(name),
      CAPACIDAD: null,
      LITROS_ACTUALES: null,
      PORCENTAJE: null,
      ULTIMO_SUMINISTRO: null,
    }))
  }
  console.warn('Formato /depositos no reconocido:', res)
  return []
}

/** === Hook principal: NO inventa datos, solo backend === */
export function useDepositos(refetchMs = DEFAULT_REFETCH_MS) {
  return useQuery({
    queryKey: ['depositos'],
    queryFn: async () => {
      try {
        const res = await gasogesApi.get('depositos').json<unknown>()
        return coerceDepositos(res)
      } catch (err) {
        console.error('Error al cargar /depositos:', err)
        return [] as EstadoDeposito[]
      }
    },
    staleTime: Math.floor(refetchMs * 0.5),
    refetchInterval: refetchMs,
    refetchIntervalInBackground: true,
  })
}

/** 🔁 Depósitos bajo nivel (<threshold) y críticos (<criticalThreshold) */
export function useDepositosBajoNivel(
  threshold = 400,
  criticalThreshold = 200,
  refetchMs = DEFAULT_REFETCH_MS,
) {
  const { data: depositosRef, ...rest } = useDepositos(refetchMs)

  const depositosBajos = computed<EstadoDeposito[]>(() => {
    const depositos = unref(depositosRef) ?? []
    // Solo consideramos los que vienen con litros numéricos
    return depositos.filter(
      d => Number.isFinite(Number(d.LITROS_ACTUALES)) && Number(d.LITROS_ACTUALES) < threshold,
    )
  })

  const criticalDeposits = computed<EstadoDeposito[]>(() =>
    depositosBajos.value.filter(d => Number(d.LITROS_ACTUALES) < criticalThreshold),
  )

  const hasLowLevel = computed<boolean>(() => depositosBajos.value.length > 0)

  return {
    ...rest,
    data: depositosBajos,
    criticalDeposits,
    hasLowLevel,
  }
}
