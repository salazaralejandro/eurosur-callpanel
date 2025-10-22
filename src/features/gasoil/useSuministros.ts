// src/features/gasoil/useSuministros.ts
import { computed, unref, type Ref } from 'vue'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/vue-query'
import {
  SuministroFromApi,
  UsuarioFromApi,
  type UsuarioApiTuple,
  VehiculoFromApi,
  type VehiculoApiTuple,
} from './schema'

// --- Tipos de datos ---
export type Suministro = {
  id: string
  litros: number
  fecha_hora: string
  vehiculo?: string // "MATRICULA (NOMBRE)"
  surtidor?: string | number
  id_vehiculo: number | null
  id_usuario: number | null
}

// --- Helpers ---
function parseNumber(n: unknown, fallback = 0): number {
  const x = typeof n === 'string' ? Number(n.replace(',', '.')) : Number(n)
  return Number.isFinite(x) ? x : fallback
}

function rangoDia(d: string) {
  const y = dayjs(d)
  const inicio = y.format('YYYY-MM-DD')
  const fin = y.format('YYYY-MM-DD')
  return { inicio, fin }
}

// --- Hooks de "Tablas de Búsqueda" (Lookup Tables) ---
export function useVehiculosMap() {
  return useQuery({
    queryKey: ['vehiculosMap'],
    queryFn: async () => {
      // --- CAMBIO: Usamos el proxy ---
      const resReq = await fetch('/api/vehiculos')
      if (!resReq.ok) throw new Error('Error en proxy /api/vehiculos')
      const res = await resReq.json()

      const data = VehiculoFromApi.array().parse(res)
      return data.reduce((map, vehiculoTupla) => {
        map.set(vehiculoTupla[0], vehiculoTupla)
        return map
      }, new Map<number, VehiculoApiTuple>())
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

export function useUsuariosMap() {
  return useQuery({
    queryKey: ['usuariosMap'],
    queryFn: async () => {
      // --- CAMBIO: Usamos el proxy ---
      const resReq = await fetch('/api/usuarios')
      if (!resReq.ok) throw new Error('Error en proxy /api/usuarios')
      const res = await resReq.json()

      const data = UsuarioFromApi.array().parse(res)
      return data.reduce((map, usuarioTupla) => {
        map.set(usuarioTupla[0], usuarioTupla)
        return map
      }, new Map<number, UsuarioApiTuple>())
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

// --- Hook Principal ---
export function useSuministrosDia(fechaRef: Ref<string>, refetchMsIfToday = 60_000) {
  const todayStr = dayjs().format('YYYY-MM-DD')
  const isToday = computed(() => unref(fechaRef) === todayStr)

  // 1. Cargar las tablas de búsqueda (ahora desde el proxy)
  const { data: vehiculosMap, isLoading: isLoadingVehiculos } = useVehiculosMap()
  const { data: usuariosMap, isLoading: isLoadingUsuarios } = useUsuariosMap()

  const qSuministros = useQuery({
    queryKey: ['suministros-día', fechaRef],
    queryFn: async () => {
      const fecha = unref(fechaRef)
      const { inicio, fin } = rangoDia(fecha)

      // 2. Esta llamada ya estaba bien (usaba el proxy)
      const res = await fetch(`/api/suministros?inicio=${inicio}&fin=${fin}`)
      if (!res.ok) {
        throw new Error('La petición al proxy /api/suministros falló')
      }
      return await res.json()
    },
    refetchInterval: () => (isToday.value ? refetchMsIfToday : false),
    staleTime: 30_000,
    
    // 3. El 'select' combina los suministros con los mapas
    select: (rawSuministros: unknown): {
      items: Suministro[]
      totalLitros: number
      operaciones: number
      promedio: number
      ultimos: Suministro[]
    } => {
      const vMap = unref(vehiculosMap)!
      const uMap = unref(usuariosMap)!

      const parseResult = SuministroFromApi.array().safeParse(rawSuministros)
      const data = parseResult.success ? parseResult.data : []

      const items: Suministro[] = data.map((row, idx) => {
        const [
          id_usuario,
          id_vehiculo,
          km,
          litros,
          precio,
          fecha_hora,
          num_serie_surtidor,
        ] = row

        const vehiculoInfo = vMap.get(id_vehiculo ?? -1)
        const vehiculoDisplay = vehiculoInfo
          ? `${vehiculoInfo[1]} (${vehiculoInfo[2]})` // "MATRICULA (NOMBRE)"
          : id_vehiculo
            ? `ID: ${id_vehiculo}`
            : 'Vehículo Desconocido'
        
        return {
          id: `${fecha_hora ?? 'row'}-${idx}`,
          litros: parseNumber(litros, 0),
          fecha_hora: String(fecha_hora ?? ''),
          vehiculo: vehiculoDisplay,
          surtidor: num_serie_surtidor ?? undefined,
          id_vehiculo: id_vehiculo,
          id_usuario: id_usuario,
        }
      })

      const totalLitros = items.reduce((acc, s) => acc + (s.litros || 0), 0)
      const operaciones = items.length
      const promedio = operaciones ? Math.round((totalLitros / operaciones) * 100) / 100 : 0
      const ultimos = [...items]
        .sort((a, b) => String(b.fecha_hora).localeCompare(String(a.fecha_hora)))
        .slice(0, 5)

      return { items, totalLitros, operaciones, promedio, ultimos }
    },
    // 4. Habilitar SÓLO cuando los mapas de búsqueda estén listos
    enabled: computed(() => !!vehiculosMap.value && !!usuariosMap.value),
  })

  // 5. El estado 'isLoading' general depende de las 3 peticiones
  return {
    ...qSuministros,
    isLoading: computed(
      () =>
        qSuministros.isLoading.value ||
        isLoadingVehiculos.value ||
        isLoadingUsuarios.value,
    ),
  }
}