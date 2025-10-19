import { computed, unref, type Ref } from 'vue'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/vue-query'


type SuministroRaw = any

export type Suministro = {
  id: number | string
  litros: number
  fecha_hora: string 
  vehiculo?: string | number
  surtidor?: string | number
}

function parseNumber(n: unknown, fallback = 0): number {
  const x = typeof n === 'string' ? Number(n.replace(',', '.')) : Number(n)
  return Number.isFinite(x) ? x : fallback
}

// La API /v1/suministros/todos/{inicio}/{fin} acepta YYYY-MM-DD
function rangoDia(d: string) {
  const y = dayjs(d)
  const inicio = y.format('YYYY-MM-DD')
  const fin = y.format('YYYY-MM-DD')
  return { inicio, fin }
}

function normalizar(raw: any): Suministro[] {
  if (!raw) return []
  const data = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []

  return data.map((row: unknown, idx: number) => {
    const arr = Array.isArray(row) ? row : []
    const id_usuario = arr[0] ?? null
    const id_vehiculo = arr[1] ?? null
    const km = arr[2] ?? null
    const litros_suministrados = arr[3] ?? 0
    const precio = arr[4] ?? null
    const fecha_y_hora = arr[5] ?? ''
    const num_serie_surtidor = arr[6] ?? null

    return {
      id: `${fecha_y_hora ?? 'row'}-${idx}`,
      litros: parseNumber(litros_suministrados),
      fecha_hora: String(fecha_y_hora ?? ''),
      vehiculo: id_vehiculo ?? undefined,
      surtidor: num_serie_surtidor ?? undefined,
    } as Suministro
  })
}


export function useSuministrosDia(fechaRef: Ref<string>, refetchMsIfToday = 60_000) {
  const todayStr = dayjs().format('YYYY-MM-DD')
  const isToday = computed(() => unref(fechaRef) === todayStr)

  return useQuery({
    queryKey: ['suministros-día', fechaRef],
    queryFn: async () => {
      const fecha = unref(fechaRef)
      const { inicio, fin } = rangoDia(fecha)
      
      // --- ESTE ES EL CAMBIO MÁS IMPORTANTE ---
      // Llamamos a nuestra propia API Route de Vercel
      // La ruta es /api/suministros (sin .ts, .php, etc.)
      const res = await fetch(`/api/suministros?inicio=${inicio}&fin=${fin}`);

      if (!res.ok) {
        throw new Error('La petición a la API Route de Vercel falló');
      }

      const data = await res.json();
      return normalizar(data);
    },
    refetchInterval: () => (isToday.value ? refetchMsIfToday : false),
    staleTime: 30_000,
    select: (items: Suministro[]) => {
      const totalLitros = items.reduce((acc, s) => acc + (s.litros || 0), 0)
      const operaciones = items.length
      const promedio = operaciones ? Math.round((totalLitros / operaciones) * 100) / 100 : 0
      const ultimos = [...items]
        .sort((a, b) => String(b.fecha_hora).localeCompare(String(a.fecha_hora)))
        .slice(0, 5)
      return { items, totalLitros, operaciones, promedio, ultimos }
    },
  })
}

