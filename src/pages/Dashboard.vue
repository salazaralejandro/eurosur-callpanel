<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { RefreshCcw } from 'lucide-vue-next'

import { useDepositos } from '@/features/gasoil/useGasoil'
import { useSuministros, ymd } from '@/features/gasoil/useSuministros'
import {
  useEstadoDeposito,
  getCapacidadesFromEnv,
  getStockInicialFromEnv,
  getEntradasFromEnv,
} from '@/features/gasoil/useSuministrosDeposito'

/* ====== Reloj (TV) ====== */
const clock = ref(new Date())
let clockId: number | null = null
onMounted(() => (clockId = window.setInterval(() => (clock.value = new Date()), 1000)))
onBeforeUnmount(() => clockId && clearInterval(clockId))
const fmtTime = (d: Date | null) =>
  (d ?? new Date()).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/* ====== Depositos (id + nombre) ====== */
const { data: depositos, isLoading: loadingDeps } = useDepositos()

/* Selección del depósito a mostrar:
   - si hay lista, el primero por nombre (puedes cambiar a otro criterio) */
const selectedDeposit = computed(() => {
  const all = (depositos.value ?? []).slice()
  if (all.length === 0) return null
  all.sort((a, b) => String(a.NOMBRE).localeCompare(String(b.NOMBRE)))
  return all[0]
})

/* ====== Estado del depósito (hoy) – litros actuales estimados ======
   Necesitamos capacidad y stock inicial (opcional) desde ENV:
   VITE_DEPOS_CAP='{"2":5000,"3":8000}'
   VITE_DEPOS_STOCK='{"2":3200}'
   VITE_DEPOS_ENTRADAS='{"2":0}'
*/
const hoy = ymd(new Date())
const capacidades = getCapacidadesFromEnv()
const stocks = getStockInicialFromEnv()
const entradas = getEntradasFromEnv()

const depositoId = computed(() => selectedDeposit.value?.ID_DEPOSITO ?? null)

const {
  totalConsumos,        // litros suministrados HOY del depósito
  estado,               // { capacidad, stockInicial, entradas, consumos, stockEstimado, porcentaje }
  isLoading: loadingEstado,
  isFetching: fetchingEstado,
  refetch: refetchEstado,
} = useEstadoDeposito(
  depositoId as unknown as number,
  hoy,
  hoy,
  {
    capacidad: depositoId.value != null ? capacidades[String(depositoId.value)] : null,
    stockInicial: depositoId.value != null ? stocks[String(depositoId.value)] : null,
    entradas: depositoId.value != null ? entradas[String(depositoId.value)] : 0,
    refetchMs: 60_000,
  }
)

/* ====== KPIs de suministros (globales hoy) ====== */
const {
  data: suministros,
  isLoading: sumLoading,
  isFetching: sumFetching,
  refetch: refetchSum,
} = useSuministros(hoy, hoy, 60_000)

const totalLitrosHoy = computed(() =>
  (suministros.value ?? []).reduce((acc, s) => acc + Number(s.LITROS_SUMINISTRADOS || 0), 0)
)
const countSumHoy = computed(() => (suministros.value ?? []).length)
const ultimos6 = computed(() => (suministros.value ?? []).slice(0, 6))

/* ====== Llamadas (placeholders) ====== */
const callsWaiting = ref(0)
const callsAnsweredToday = ref(0)
const agentsOnline = ref(0)

/* ====== Auto-refresh global ====== */
const REFRESH_MS = 60_000
let refreshId: number | null = null
const lastUpdated = ref<Date | null>(null)
const doRefetch = async () => {
  await Promise.all([refetchEstado(), refetchSum()])
  lastUpdated.value = new Date()
}
onMounted(async () => {
  await doRefetch()
  refreshId = window.setInterval(doRefetch, REFRESH_MS)
})
onBeforeUnmount(() => refreshId && clearInterval(refreshId))

/* ====== Helpers ====== */
const hasNum = (v: unknown) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))
</script>

<template>
  <div class="min-h-dvh bg-white text-neutral-900">
    <!-- HEADER -->
    <header class="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div class="mx-auto max-w-[1800px] px-10 py-6 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <img src="/eurosur-logo.svg" alt="GE" class="h-12 w-auto" />
          <div>
            <h1 class="text-4xl font-semibold tracking-tight">Panel de llamadas · Combustible</h1>
            <p class="text-lg text-neutral-500">
              {{ (sumFetching || fetchingEstado) ? 'Actualizando…' : (lastUpdated ? 'Actualizado ' + fmtTime(lastUpdated) : 'Cargando…') }}
            </p>
          </div>
        </div>
        <button
          class="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-white text-2xl font-semibold hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60"
          :disabled="sumFetching || fetchingEstado"
          @click="doRefetch"
          title="Refrescar"
        >
          <RefreshCcw class="h-7 w-7" :class="(sumFetching || fetchingEstado) ? 'animate-spin' : ''" />
          Refrescar
        </button>
      </div>
    </header>

    <!-- CONTENIDO -->
    <main class="mx-auto max-w-[1800px] px-10 py-8 space-y-10">
      <!-- Row 1: Llamadas -->
      <section class="grid gap-8 md:grid-cols-3">
        <div class="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div class="text-2xl text-neutral-500">Llamadas en espera</div>
          <div class="mt-3 text-[9rem] leading-none font-bold tabular-nums">{{ callsWaiting }}</div>
          <div class="mt-2 text-xl text-neutral-500">Ahora mismo</div>
        </div>
        <div class="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div class="text-2xl text-neutral-500">Contestadas hoy</div>
          <div class="mt-3 text-[9rem] leading-none font-bold tabular-nums">{{ callsAnsweredToday }}</div>
          <div class="mt-2 text-xl text-neutral-500">Desde las 00:00</div>
        </div>
        <div class="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div class="text-2xl text-neutral-500">Agentes activos</div>
          <div class="mt-3 text-[9rem] leading-none font-bold tabular-nums">{{ agentsOnline }}</div>
          <div class="mt-2 text-xl text-neutral-500">Conectados</div>
        </div>
      </section>

      <!-- Row 2: Depósito seleccionado (nombre + litros actuales estimados) -->
      <section class="grid gap-8">
        <div class="rounded-3xl border border-neutral-200 bg-white p-10 shadow-sm">
          <div class="text-2xl text-neutral-500 mb-2">Depósito con menor nivel (seleccionado)</div>

          <div v-if="selectedDeposit" class="space-y-4">
            <div class="text-5xl font-semibold tracking-tight">
              {{ selectedDeposit.NOMBRE }}
            </div>

            <!-- Litros actuales (estimados) -->
            <div class="flex items-end gap-5">
              <div class="text-[10rem] leading-none font-extrabold tabular-nums">
                {{ hasNum(estado?.stockEstimado) ? Number(estado.stockEstimado).toLocaleString('es-ES') : '—' }}
              </div>
              <div class="pb-6 text-5xl font-semibold">L</div>
            </div>

            <!-- Capacidad -->
            <div class="text-2xl">
              Capacidad:
              <b>
                {{ hasNum(estado?.capacidad) ? Number(estado.capacidad).toLocaleString('es-ES') + ' L' : '—' }}
              </b>
            </div>

            <!-- Estado -->
            <div v-if="hasNum(estado?.stockEstimado)" class="text-xl"
                 :class="Number(estado?.stockEstimado) < 200 ? 'text-red-600'
                      : Number(estado?.stockEstimado) < 400 ? 'text-amber-600' : 'text-emerald-600'">
              {{
                Number(estado?.stockEstimado) < 200 ? 'Nivel crítico'
                : Number(estado?.stockEstimado) < 400 ? 'Nivel bajo'
                : 'Nivel correcto'
              }}
              <span v-if="hasNum(estado?.porcentaje)" class="text-neutral-500">
                · {{ estado?.porcentaje }}%
              </span>
            </div>

            <!-- Litros suministrados HOY en este depósito -->
            <div class="text-xl text-neutral-600">
              Hoy suministrados desde este depósito:
              <b>{{ Number(totalConsumos ?? 0).toLocaleString('es-ES') }} L</b>
            </div>
          </div>

          <div v-else class="text-2xl text-neutral-500">No hay depósitos disponibles.</div>
        </div>
      </section>

      <!-- Row 3: KPIs Suministros (global hoy) -->
      <section class="grid gap-6 md:grid-cols-3">
        <div class="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div class="text-xl text-neutral-500">Litros suministrados</div>
          <div class="mt-2 text-[6rem] leading-none font-bold tabular-nums">
            {{ sumLoading ? '–' : totalLitrosHoy.toLocaleString('es-ES') }}
          </div>
          <div class="mt-2 text-lg text-neutral-500">Total del día ({{ hoy }})</div>
        </div>

        <div class="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div class="text-xl text-neutral-500">Operaciones</div>
          <div class="mt-2 text-[6rem] leading-none font-bold tabular-nums">
            {{ sumLoading ? '–' : countSumHoy }}
          </div>
          <div class="mt-2 text-lg text-neutral-500">Registros en el día</div>
        </div>

        <!-- espacio para futuro KPI (importe, etc.) -->
        <div class="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div class="text-xl text-neutral-500">Promedio por operación</div>
          <div class="mt-2 text-[6rem] leading-none font-bold tabular-nums">
            {{ sumLoading || countSumHoy === 0 ? '–' : Math.round(totalLitrosHoy / countSumHoy) }}
          </div>
          <div class="mt-2 text-lg text-neutral-500">Litros / ope</div>
        </div>
      </section>

      <!-- Row 4: Últimos suministros (global hoy) -->
      <section class="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div class="mb-4 text-xl font-medium">Últimos suministros</div>
        <div v-if="(ultimos6?.length || 0) === 0" class="text-lg text-neutral-500">Sin registros hoy.</div>

        <ul v-else class="divide-y divide-neutral-200">
          <li
            v-for="s in ultimos6"
            :key="s.FECHA_HORA + String(s.ID_VEHICULO ?? '')"
            class="flex items-center justify-between py-3"
          >
            <div class="flex flex-col">
              <span class="text-lg font-medium tabular-nums">
                {{ new Date(s.FECHA_HORA).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' }) }}
              </span>
              <span class="text-sm text-neutral-500">
                Vehículo: {{ s.ID_VEHICULO ?? '—' }} · Surtidor: {{ s.NUMERO_SERIE_SURTIDOR ?? '—' }}
              </span>
            </div>
            <div class="text-2xl font-semibold tabular-nums">
              {{ Number(s.LITROS_SUMINISTRADOS).toLocaleString('es-ES') }} L
            </div>
          </li>
        </ul>
      </section>
    </main>

    <!-- FOOTER -->
    <footer class="sticky bottom-0 border-t border-neutral-200 bg-white/80 backdrop-blur">
      <div class="mx-auto max-w-[1800px] px-10 py-3 flex items-center justify-between text-lg text-neutral-600">
        <span>Hora: <b class="tabular-nums">{{ fmtTime(clock) }}</b></span>
        <span>Auto-refresco: <b>1 min</b></span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.tabular-nums { font-variant-numeric: tabular-nums; }
</style>
