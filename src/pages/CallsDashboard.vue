<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts' // <--- CORRECCIÓN 1: Importar tipo
import { useCallsKpis } from '@/features/calls/useCalls'
import { getGasogesApiStatus, getMundoSmsApiStatus } from '@/utils/api'
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

const chartSeries = computed(() => {
  return [{
    name: 'Llamadas en Espera',
    data: waitingHistory.value
  }]
})

// CAMBIO: Opciones de gráfico adaptadas a MODO CLARO
// <--- CORRECCIÓN 2: Tipar la propiedad computada
const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'area', // TypeScript ahora sabe que esto es del tipo 'area'
    height: 250,
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    zoom: { enabled: false }
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 }, // Mantenemos la línea gruesa
  colors: ['#0261F4'], // Color azul original
  fill: {
    type: 'gradient',
    gradient: {
      opacityFrom: 0.6,
      opacityTo: 0.1,
    }
  },
  xaxis: {
    type: 'datetime',
    labels: {
      format: 'HH:mm',
      style: { colors: '#6b7280' }, // color: slate-500
    },
    tooltip: {
      enabled: false
    },
    axisBorder: { show: false },
    axisTicks: { color: '#e5e7eb' } // color: slate-200
  },
  yaxis: {
    title: { 
      text: 'Llamadas', 
      style: { color: '#6b7280', fontWeight: 500 } // color: slate-500
    },
    labels: { 
      style: { colors: '#6b7280' }, // color: slate-500
      formatter: (val: number) => val.toFixed(0)
    },
    min: 0,
    forceNiceScale: true,
  },
  grid: {
    borderColor: '#e5e7eb', // color: slate-200
    strokeDashArray: 4,
  },
  tooltip: {
    theme: 'light', // Tooltip modo claro
    x: { format: 'dd/MM/yy HH:mm' },
    y: { formatter: (val: number) => `${val.toFixed(0)} llamadas` },
  },
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
              <VueApexCharts type="area" height="250" :options="chartOptions" :series="chartSeries" />
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