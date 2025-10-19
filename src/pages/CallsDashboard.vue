<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
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

// --- Lógica del Gráfico (Eliminada) ---
// Se mantiene 'lastUpdated' para la UI
watch(calls, () => {
  lastUpdated.value = new Date()
})

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
              Actividad en espera
            </h3>
          </header>
          <div class="p-4">
            <!-- Sección del gráfico eliminada -->
            <div class="h-[250px] flex items-center justify-center text-slate-500 text-lg">
              Gráfico temporalmente desactivado.
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
