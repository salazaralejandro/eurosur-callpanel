<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
// --- INICIO CAMBIOS ECHARTS ---
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
} from 'echarts/components'

// Registrar los módulos de ECharts
use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
])
// --- FIN CAMBIOS ECHARTS ---

import { useCallsKpis } from '@/features/calls/useCalls'
import { RefreshCcw, Hourglass, PhoneCall, Users, TriangleAlert } from 'lucide-vue-next'

const REFRESH_MS = 60_000 
const MAX_HISTORY_POINTS = 30

const {
  data: calls, isLoading: loadingCalls, isFetching: fetchingCalls, isError: errorCalls, refetch: refetchCalls
} = useCallsKpis(REFRESH_MS, 60, 10) 

const waitingNow    = computed(() => calls.value?.waiting_now ?? 0)
const answeredToday = computed(() => calls.value?.answered_today ?? 0)
const agentsOnline  = computed(() => calls.value?.agents_online ?? 0)

const lastUpdated = ref<Date | null>(null)
async function doRefetch() {
  refetchCalls()
}

// Reloj
const clock = ref(new Date())
let clockId: number | null = null
onMounted(() => {
  clockId = window.setInterval(() => (clock.value = new Date()), 1000)
  doRefetch()
})
onBeforeUnmount(() => clockId && clearInterval(clockId))
const fmtTime = (d: Date) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
const fmtTimeWithSeconds = (d: Date) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })



// --- Lógica del Gráfico ---
const waitingHistory = ref<{ x: number, y: number }[]>([])

watch(waitingNow, (newValue) => {
  const newPoint = { x: new Date().getTime(), y: newValue }
  waitingHistory.value.push(newPoint)
  if (waitingHistory.value.length > MAX_HISTORY_POINTS) {
    waitingHistory.value.shift()
  }
  lastUpdated.value = new Date()
})

// --- OPCIONES DE GRÁFICO ECHARTS ---
const chartOption = computed(() => ({
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true // Importante para que las etiquetas no se corten
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      // ECharts usa 'params' como un array
      const data = params[0]
      const date = new Date(data.axisValue).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      return `${date}<br /><strong>${data.value[1]} llamadas</strong>`
    }
  },
  xAxis: {
    type: 'time', // ECharts maneja 'time' de forma nativa
    axisLabel: {
      formatter: '{HH}:{mm}', // Formato de hora
      color: '#6b7280'
    },
    axisLine: { show: false },
    axisTick: { lineStyle: { color: '#e5e7eb' } }
  },
  yAxis: {
    type: 'value',
    name: 'Llamadas',
    nameTextStyle: {
      color: '#6b7280',
      fontWeight: 500
    },
    min: 0,
    axisLabel: {
      color: '#6b7280',
      formatter: (val: number) => val.toFixed(0)
    },
    splitLine: { // Esto reemplaza el 'grid.borderColor'
      lineStyle: {
        color: '#e5e7eb',
        type: 'dashed'
      }
    }
  },
  series: [
    {
      name: 'Llamadas en Espera',
      type: 'line',
      smooth: true,
      symbol: 'none', // Oculta los puntos
      // ECharts espera los datos como [timestamp, value]
      data: waitingHistory.value.map(p => [p.x, p.y]),
      // Estilo del área
      areaStyle: {
        color: '#0261F4',
        opacity: 0.3
      },
      // Estilo de la línea
      lineStyle: {
        color: '#0261F4',
        width: 3
      },
      // Color del punto en el tooltip
      itemStyle: {
        color: '#0261F4'
      }
    }
  ]
}))
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-900">
    <main class="mx-auto max-w-[1800px] px-4 sm:px-8 py-8">
      
      <header class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-4xl font-bold text-slate-800">Panel de Llamadas</h1>
        </div>
        <div class="text-right">
          <div class="text-4xl font-bold text-slate-900 tabular-nums">
            {{ fmtTimeWithSeconds(clock) }}
          </div>
           <p class="text-lg text-slate-500 mt-1">
            Actualizado: {{ lastUpdated ? fmtTime(lastUpdated) : '—' }}
          </p>
        </div>
      </header>

      <div class="space-y-8">
         <section class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          
          <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <div class="text-2xl font-medium text-slate-600">En espera</div>
              <div class="bg-blue-100 text-blue-600 rounded-lg p-3"> <Hourglass class="h-8 w-8"/> </div>
            </div>
            <div class="mt-4 text-8xl font-bold text-slate-900 tabular-nums leading-none">
              {{ waitingNow }}
            </div>
            <div class="text-xl text-slate-500 mt-2">Ahora mismo</div>
          </div>
          
          <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
             <div class="flex items-center justify-between">
              <div class="text-2xl font-medium text-slate-600">Contestadas</div>
              <div class="bg-blue-100 text-blue-600 rounded-lg p-3"> <PhoneCall class="h-8 w-8"/> </div>
            </div>
            <div class="mt-4 text-8xl font-bold text-slate-900 tabular-nums leading-none">
              {{ answeredToday }}
            </div>
            <div class="text-xl text-slate-500 mt-2">Desde las 00:00</div>
          </div>
          
          <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <div class="text-2xl font-medium text-slate-600">Agentes activos</div>
              <div class="bg-blue-100 text-blue-600 rounded-lg p-3"> <Users class="h-8 w-8"/> </div>
            </div>
            <div class="mt-4 text-8xl font-bold text-slate-900 tabular-nums leading-none">
              {{ agentsOnline }}
            </div>
            <div class="text-xl text-slate-500 mt-2">Últimos 10 min</div>
          </div>

        </section>
        
        <section class="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <header class="p-4 border-b border-slate-200">
            <h3 class="text-2xl font-semibold text-slate-800">
              Actividad en espera (Últ. {{ MAX_HISTORY_POINTS }} min)
            </h3>
          </header>
          <div class="p-4">
            <div v-if="loadingCalls && waitingHistory.length === 0" class="h-[250px] flex items-center justify-center text-slate-500 text-lg">
              Cargando datos del gráfico...
            </div>
            <div v-else class="h-[250px]">
              <VChart :option="chartOption" autoresize />
            </div>
          </div>
        </section>

      </div>

    </main>
  </div>
</template>

<style scoped>
/* Asegura que los números no "bailen" cuando cambian de valor */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>