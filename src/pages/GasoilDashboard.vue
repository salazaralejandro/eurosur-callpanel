<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { RefreshCcw, Droplets, Truck, Gauge, Search, TriangleAlert } from 'lucide-vue-next'

/* === Chart.js (barras por hora) === */
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type ChartOptions,
} from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

/* === Data hooks === */
import { useSuministrosDia, type Suministro } from '@/features/gasoil/useSuministros'
import { useDepositos, type EstadoDeposito } from '@/features/gasoil/useGasoil'

/* === Fecha seleccionada === */
const today = dayjs().format('YYYY-MM-DD')
const selectedDate = ref<string>(today)
const isToday = computed(() => selectedDate.value === today)

/* === Suministros === */
const { data, isLoading, isFetching, refetch } = useSuministrosDia(selectedDate, isToday.value ? 60_000 : 0)

/* === Depósitos (sin mocks) === */
const {
  data: depositos,
  isLoading: isLoadingDepositos,
  isFetching: isFetchingDepositos,
  error: depositosError,
} = useDepositos()

/* === Helpers === */
const fmtNum = (n: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n)

function getDepositoStatus(deposito: EstadoDeposito | null) {
  const p = deposito?.PORCENTAJE ?? null
  if (p == null || Number.isNaN(Number(p))) {
    return { text: 'Sin datos', class: 'bg-neutral-100 text-neutral-800', colorClass: 'bg-neutral-400' }
  }
  if (p > 20) return { text: 'Nivel OK', class: 'bg-emerald-100 text-emerald-800', colorClass: 'bg-emerald-500' }
  if (p > 10) return { text: 'Nivel Bajo', class: 'bg-yellow-100 text-yellow-800', colorClass: 'bg-yellow-500' }
  return { text: 'Nivel Crítico', class: 'bg-red-100 text-red-800', colorClass: 'bg-red-500' }
}

/* === KPIs === */
const totalLitrosFmt = computed(() => (isLoading.value || !data.value ? '–' : `${fmtNum(data.value.totalLitros)} L`))
const operacionesFmt = computed(() => (isLoading.value || !data.value ? '–' : data.value.operaciones))
const promedioFmt = computed(() => (isLoading.value || !data.value ? '–' : `${fmtNum(data.value.promedio)} L`))

/* === Controles fecha === */
const setHoy = () => (selectedDate.value = today)
const setAyer = () => (selectedDate.value = dayjs().subtract(1, 'day').format('YYYY-MM-DD'))

/* === Filtro & lista === */
const searchQuery = ref('')
const items = computed<Suministro[]>(() => data.value?.items ?? [])
const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  const q = searchQuery.value.toLowerCase()
  return items.value.filter(i =>
    String(i.vehiculo).toLowerCase().includes(q) || String(i.surtidor).toLowerCase().includes(q),
  )
})
const totalItems = computed(() => filteredItems.value.length)

/* === Depósitos críticos solo si hay datos reales === */
const hasDepositosData = computed(() => Array.isArray(depositos.value) && depositos.value.length > 0)
const criticalDeposits = computed(() =>
  hasDepositosData.value ? depositos.value!.filter(d => (d.PORCENTAJE ?? 100) <= 10) : [],
)

/* === Chart options/data === */
const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} L` } },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Litros', color: '#6b7280', font: { weight: 'bold' } },
      ticks: { color: '#6b7280' },
      grid: { color: '#e5e7eb' },
    },
    x: { ticks: { color: '#6b7280' }, grid: { display: false } },
  },
}
const chartData = computed(() => {
  const hourlyTotals: number[] = Array(24).fill(0)
  for (const s of items.value) {
    const h = dayjs(s.fecha_hora).hour()
    if (h >= 0 && h <= 23) hourlyTotals[h] += s.litros
  }
  return {
    labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
    datasets: [{ label: 'Litros', data: hourlyTotals, backgroundColor: '#0261F4', borderRadius: 4 }],
  }
})
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-900">
    <main class="mx-auto max-w-[1800px] px-4 sm:px-6 py-6">
      <!-- Header -->
      <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Dashboard de Gasoil</h1>
          <p class="text-sm text-slate-500">Vista general de suministros y estado de depósitos.</p>
        </div>
        <div class="flex items-center gap-2">
          <input
            type="date"
            v-model="selectedDate"
            :max="today"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            @click="setHoy"
            :disabled="isToday"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            Hoy
          </button>
          <button
            @click="setAyer"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            Ayer
          </button>
          <button
            @click="() => refetch()"
            :disabled="isFetching"
            class="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCcw :class="['h-4 w-4', isFetching ? 'animate-spin' : '']" />
          </button>
        </div>
      </header>

      <div class="space-y-6">
        <!-- Alertas críticas de depósitos (solo si hay datos y hay críticos) -->
        <section
          v-if="criticalDeposits.length > 0"
          class="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm"
        >
          <div class="flex items-center gap-3">
            <div class="text-red-600"><TriangleAlert class="h-6 w-6" /></div>
            <h2 class="text-lg font-semibold text-red-800">Alertas Críticas</h2>
          </div>
          <ul class="mt-3 space-y-2">
            <li
              v-for="deposito in criticalDeposits"
              :key="deposito.ID_DEPOSITO"
              class="text-sm text-red-700 font-medium"
            >
              · El depósito <span class="font-bold">{{ deposito.NOMBRE }}</span> está al
              {{ deposito.PORCENTAJE }}%.
            </li>
          </ul>
        </section>

        <!-- KPIs -->
        <section class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-start gap-4">
            <div class="bg-blue-100 text-blue-600 rounded-lg p-3"><Droplets class="h-6 w-6" /></div>
            <div>
              <div class="text-sm font-medium text-slate-500">Litros Suministrados</div>
              <div class="text-2xl font-bold text-slate-900 mt-1">{{ totalLitrosFmt }}</div>
            </div>
          </div>
          <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-start gap-4">
            <div class="bg-blue-100 text-blue-600 rounded-lg p-3"><Truck class="h-6 w-6" /></div>
            <div>
              <div class="text-sm font-medium text-slate-500">Operaciones</div>
              <div class="text-2xl font-bold text-slate-900 mt-1">{{ operacionesFmt }}</div>
            </div>
          </div>
          <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-start gap-4">
            <div class="bg-blue-100 text-blue-600 rounded-lg p-3"><Gauge class="h-6 w-6" /></div>
            <div>
              <div class="text-sm font-medium text-slate-500">Promedio / Op.</div>
              <div class="text-2xl font-bold text-slate-900 mt-1">{{ promedioFmt }}</div>
            </div>
          </div>
        </section>

        <!-- Estado de Depósitos (sin inventar datos) -->
        <section class="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <header class="p-4 border-b border-slate-200">
            <h2 class="text-base font-semibold text-slate-800">Estado de Depósitos</h2>
          </header>

          <!-- Cargando -->
          <div v-if="isLoadingDepositos" class="p-6 text-center text-slate-500 text-sm">
            Cargando datos de depósitos…
          </div>

          <!-- Error o sin datos -->
          <div
            v-else-if="depositosError || !depositos || depositos.length === 0"
            class="p-6 text-center text-slate-600 text-sm"
          >
            No se han recibido datos de depósitos.
          </div>

          <!-- Con datos -->
          <div v-else class="p-4 space-y-4">
            <div v-for="deposito in depositos" :key="deposito.ID_DEPOSITO">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-bold text-slate-800">{{ deposito.NOMBRE }}</span>
                <span :class="['text-xs font-bold px-2 py-0.5 rounded-full', getDepositoStatus(deposito).class]">
                  <!-- Nunca inventar: si no hay porcentaje, mostramos ‘—’ -->
                  {{ deposito.PORCENTAJE ?? '—' }}{{ deposito.PORCENTAJE != null ? '%' : '' }}
                </span>
              </div>
              <div class="relative h-2 w-full rounded-full bg-slate-200" aria-hidden="true">
                <div
                  class="absolute top-0 left-0 h-2 rounded-full transition-all duration-500"
                  :class="getDepositoStatus(deposito).colorClass"
                  :style="{
                    width:
                      deposito.PORCENTAJE != null && !Number.isNaN(Number(deposito.PORCENTAJE))
                        ? `${deposito.PORCENTAJE}%`
                        : '0%'
                  }"
                />
              </div>
              <p class="mt-1 text-xs text-slate-500">
                Capacidad: {{ deposito.CAPACIDAD ?? '—' }} · Litros actuales: {{ deposito.LITROS_ACTUALES ?? '—' }}
                · Último suministro: {{ deposito.ULTIMO_SUMINISTRO ?? '—' }}
              </p>
            </div>
          </div>
        </section>

        <!-- Actividad del día -->
        <section class="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <header class="p-4 border-b border-slate-200">
            <h3 class="text-base font-semibold text-slate-800">Actividad de Suministros del Día</h3>
          </header>
          <div class="p-4">
            <div v-if="isLoading" class="h-64 mb-6 flex items-center justify-center text-slate-500 text-lg">
              Cargando gráfico...
            </div>
            <div v-else class="h-64 mb-6">
              <Bar :data="chartData" :options="{ ...chartOptions }" />
            </div>

            <div class="flex justify-between items-center mb-4">
              <h4 class="text-sm font-semibold text-slate-700">Registros Individuales ({{ totalItems }})</h4>
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Filtrar por vehículo..."
                  class="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg w-48 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="max-h-[400px] overflow-y-auto pr-2">
              <div v-if="isLoading" class="p-6 text-center text-sm text-slate-500">Cargando...</div>
              <div v-else-if="filteredItems.length === 0" class="p-6 text-center text-sm text-slate-500">
                {{ searchQuery ? 'No hay resultados para tu búsqueda.' : `Sin registros para el día ${selectedDate}.` }}
              </div>
              <ul v-else class="space-y-2">
                <li
                  v-for="s in filteredItems"
                  :key="s.id"
                  class="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-50 transition-colors hover:bg-slate-100"
                >
                  <div class="min-w-0">
                    <div class="truncate text-sm font-medium text-slate-800">
                      {{ s.vehiculo ?? 'Vehículo Desconocido' }}
                    </div>
                    <div class="truncate text-xs text-slate-500">
                      {{ s.fecha_hora || '—' }} · Surtidor: {{ s.surtidor ?? '—' }}
                    </div>
                  </div>
                  <div class="shrink-0 w-24 text-right">
                    <div class="text-base font-bold text-slate-900 tabular-nums">{{ fmtNum(s.litros) }} L</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <footer class="mt-8 text-center text-xs text-slate-500">
        El refresco automático está {{ isToday ? 'activado' : 'desactivado (fecha histórica)' }}
      </footer>
    </main>
  </div>
</template>

<style scoped>
.tabular-nums { font-variant-numeric: tabular-nums; }
</style>
