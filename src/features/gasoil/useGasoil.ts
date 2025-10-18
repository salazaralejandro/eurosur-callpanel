// src/features/gasoil/useGasoil.ts
import { computed, unref } from 'vue'

import { gasogesApi } from '@/utils/api'
import { useMocks } from '@/utils/mock'
import { useQuery } from '@tanstack/vue-query'

// Tipos mínimos (ajústalos si ya los tienes en ./schemas)
export type EstadoDeposito = {
  ID_DEPOSITO: number
  NOMBRE: string
  CAPACIDAD: number | null
  LITROS_ACTUALES: number | null
  PORCENTAJE: number | null
  ULTIMO_SUMINISTRO: string | null
}

// Intervalo por defecto (5 min) — override con VITE_GASOIL_REFETCH_MS
const DEFAULT_REFETCH_MS = Number(import.meta.env.VITE_GASOIL_REFETCH_MS ?? 300000)

// Mock opcional si VITE_USE_MOCKS=1
function mockDepositos(): EstadoDeposito[] {
  return [
    {
      ID_DEPOSITO: 1,
      NOMBRE: 'DEP 1',
      CAPACIDAD: 5000,
      LITROS_ACTUALES: 300,
      PORCENTAJE: 6,
      ULTIMO_SUMINISTRO: new Date().toISOString(),
    },
    {
      ID_DEPOSITO: 2,
      NOMBRE: 'DEP 2',
      CAPACIDAD: 8000,
      LITROS_ACTUALES: 5200,
      PORCENTAJE: 65,
      ULTIMO_SUMINISTRO: new Date().toISOString(),
    },
  ]
}

// Normaliza /depositos que puede devolver objetos, {data:[]}, o tuplas [id, nombre]
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

// useGasoil.ts
export function useDepositos(refetchMs = DEFAULT_REFETCH_MS) {
  const mocks = useMocks()

  return useQuery({
    queryKey: ['depositos'],
    queryFn: async () => {
      if (mocks) return mockDepositos()

      const res = await gasogesApi.get('depositos').json<unknown>()

      // Normalización
      if (Array.isArray(res)) {
        return res as EstadoDeposito[]
      }
      if (res && typeof res === 'object' && Array.isArray((res as any).data)) {
        return (res as any).data as EstadoDeposito[]
      }

      console.warn('Respuesta inesperada de /depositos:', res)
      return [] as EstadoDeposito[]
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
    return depositos.filter(d => Number.isFinite(Number(d.LITROS_ACTUALES)) && Number(d.LITROS_ACTUALES) < threshold)
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
