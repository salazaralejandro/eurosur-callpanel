import {
  DepositoFromApi,
  DepositoNivelFromApi
} from './schema'
// src/features/gasoil/useGasoil.ts
import { computed, unref } from 'vue'

import type { EstadoDeposito } from './schema.ts'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/vue-query'
import { z } from 'zod'
export type { EstadoDeposito }

const DEFAULT_REFETCH_MS = Number(import.meta.env.VITE_GASOIL_REFETCH_MS ?? 300000)

export function useDepositos(refetchMs = DEFAULT_REFETCH_MS) {
  return useQuery({
    queryKey: ['depositos'],
    queryFn: async () => {
      try {
        const resListaReq = await fetch('/api/depositos')
        if (!resListaReq.ok) throw new Error('Error en proxy /api/depositos')
        const resLista = await resListaReq.json()

        const depositosBase = DepositoFromApi.array().parse(resLista)
        
        if (depositosBase.length === 0) {
          return [] as EstadoDeposito[]
        }

        const fechaHoraActual = dayjs().format('YYYY-MM-DD HH:mm:ss')
        const encodedFecha = encodeURIComponent(fechaHoraActual)

        const peticionesDeNivel = depositosBase.map(async ([id, nombre]) => {
          try {
            const params = new URLSearchParams({
              id: String(id),
              fecha: encodedFecha,
            })
            const resNivelReq = await fetch(`/api/depositos/nivel?${params.toString()}`)

            if (!resNivelReq.ok) {
               throw new Error(`Error en proxy /api/depositos/nivel para id ${id}. Status: ${resNivelReq.status}`)
            }
            
            const resNivel = await resNivelReq.json()

            // --- ¡CAMBIO AQUÍ PARA PROCESAR EL ARRAY DOBLE! ---
            // 1. Validamos con el schema flexible
            const nivelOuterArray = DepositoNivelFromApi.parse(resNivel) // Ej: [[970]] o []
            
            // 2. Extraemos el array *interno* (puede ser undefined si nivelOuterArray está vacío)
            const nivelInnerArray = nivelOuterArray[0] // Ej: [970] or undefined
            
            // 3. Extraemos el valor *crudo* del array interno (puede ser undefined)
            const litrosRaw = nivelInnerArray ? nivelInnerArray[0] : undefined // Ej: 970, "970", null, o undefined

            // 4. Convertimos el valor a número
            let litros: number | null = null
            if (typeof litrosRaw === 'number') {
              litros = litrosRaw
            } else if (typeof litrosRaw === 'string') {
              const parsed = parseFloat(litrosRaw.replace(',', '.'))
              if (Number.isFinite(parsed)) {
                litros = parsed
              }
            }
            // 'litros' permanece null si litrosRaw era null, undefined, o un string no numérico
            // --- FIN DEL CAMBIO ---

            return {
              ID_DEPOSITO: id,
              NOMBRE: nombre,
              LITROS_ACTUALES: litros, // Usamos nuestro valor 'litros' ya parseado
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

// ... (useDepositosBajoNivel no cambia) ...
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