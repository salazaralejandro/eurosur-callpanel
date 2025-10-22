import {
  DepositoFromApi,
  DepositoNivelFromApi,
} from './schema'
// src/features/gasoil/useGasoil.ts
import { computed, unref } from 'vue'

import type { EstadoDeposito } from './schema'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/vue-query'
import { z } from 'zod'
export type { EstadoDeposito } // Re-exportamos el tipo

const DEFAULT_REFETCH_MS = Number(import.meta.env.VITE_GASOIL_REFETCH_MS ?? 300000)

export function useDepositos(refetchMs = DEFAULT_REFETCH_MS) {
  return useQuery({
    queryKey: ['depositos'],
    queryFn: async () => {
      try {
        // --- 1. Obtener la lista de depósitos (del proxy) ---
        const resListaReq = await fetch('/api/depositos')
        if (!resListaReq.ok) throw new Error('Error en proxy /api/depositos')
        const resLista = await resListaReq.json()

        const depositosBase = DepositoFromApi.array().parse(resLista)
        
        if (depositosBase.length === 0) {
          return [] as EstadoDeposito[]
        }

        // --- 2. Preparar las peticiones de nivel (del proxy) ---
        const fechaHoraActual = dayjs().format('YYYY-MM-DD HH:mm:ss')
        const encodedFecha = encodeURIComponent(fechaHoraActual)

        const peticionesDeNivel = depositosBase.map(async ([id, nombre]) => {
          try {
            const resNivelReq = await fetch('/api/deposito-nivel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: id, fecha: encodedFecha }),
            })
            if (!resNivelReq.ok) throw new Error(`Error en proxy /api/deposito-nivel para id ${id}`)
            const resNivel = await resNivelReq.json()
              
            const [litros] = DepositoNivelFromApi.parse(resNivel)

            return {
              ID_DEPOSITO: id,
              NOMBRE: nombre,
              LITROS_ACTUALES: Number.isFinite(litros) ? litros : null,
              CAPACIDAD: null,
              PORCENTAJE: null, 
              ULTIMO_SUMINISTRO: null,
            } as EstadoDeposito

          } catch (errNivel) {
            console.error(`Error al cargar nivel para depósito ${id} (${nombre}):`, errNivel)
            return {
              ID_DEPOSITO: id,
              NOMBRE: nombre,
              LITROS_ACTUALES: null,
              CAPACIDAD: null,
              PORCENTAJE: null,
              ULTIMO_SUMINISTRO: null,
            } as EstadoDeposito
          }
        })

        const depositosCompletos = await Promise.all(peticionesDeNivel)
        return depositosCompletos
        
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

// ... (El resto del archivo, useDepositosBajoNivel, no necesita cambios) ...
export function useDepositosBajoNivel(
  threshold = 400,
  criticalThreshold = 200,
  refetchMs = DEFAULT_REFETCH_MS,
) {
  const { data: depositosRef, ...rest } = useDepositos(refetchMs)

  const depositosBajos = computed<EstadoDeposito[]>(() => {
    const depositos = unref(depositosRef) ?? []
    return depositos.filter(
      d => d.LITROS_ACTUALES != null && Number(d.LITROS_ACTUALES) < threshold,
    )
  })

  const criticalDeposits = computed<EstadoDeposito[]>(() =>
    depositosBajos.value.filter(d => d.LITROS_ACTUALES != null && Number(d.LITROS_ACTUALES) < criticalThreshold),
  )

  const hasLowLevel = computed<boolean>(() => depositosBajos.value.length > 0)

  return {
    ...rest,
    data: depositosBajos,
    criticalDeposits,
    hasLowLevel,
  }
}