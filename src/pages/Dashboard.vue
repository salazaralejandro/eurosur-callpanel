<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useKpis } from '@/features/kpis/useKpis'
import DonutCard from '@/components/charts/DonutCard.vue'
import RadialProgressCard from '@/components/charts/RadialProgressCard.vue'
import { RefreshCcw, Sun, Moon, PhoneIncoming, PhoneCall, Users } from 'lucide-vue-next'

/** DATA */
const { data, isLoading, refetch, isFetching } = useKpis()
const kpis = computed(() => data.value ?? { answered_today: 0, waiting_now: 0, agents_online: 0 })

/** THEME HANDLER */
const theme = ref<'light' | 'dark'>('dark')
onMounted(() => {
  const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
  if (saved) theme.value = saved
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
})
watch(theme, (val) => {
  localStorage.setItem('theme', val)
  document.documentElement.classList.toggle('dark', val === 'dark')
})
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

/** REFRESH AUTO */
const { value: now } = ref(new Date())
const REFRESH_MS = 20000
let refreshId: number | null = null
const lastUpdated = ref<Date | null>(null)
const doRefetch = async () => {
  await refetch()
  lastUpdated.value = new Date()
}
onMounted(async () => {
  await doRefetch()
  refreshId = window.setInterval(doRefetch, REFRESH_MS)
})
onBeforeUnmount(() => refreshId && clearInterval(refreshId))

/** CLOCK */
const clock = ref(new Date())
let clockId: number | null = null
onMounted(() => {
  clockId = window.setInterval(() => (clock.value = new Date()), 1000)
})
onBeforeUnmount(() => clockId && clearInterval(clockId))
const fmtTime = (d: Date) =>
  d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** CHARTS & DELTAS */
const donutSeries = computed<number[]>(() => [
  Number(kpis.value?.answered_today ?? 0),
  Number(kpis.value?.waiting_now ?? 0),
])
const donutLabels = ['Contestadas hoy', 'En espera ahora']

const waitingDelta = computed<number>(() => Math.max(-5, Math.min(5, (kpis.value?.waiting_now ?? 0) - 2)))
const answeredDelta = computed<number>(() => Math.max(-20, Math.min(20, (kpis.value?.answered_today ?? 0) - 100)))
const agentsDelta = computed<number>(() => Math.max(-5, Math.min(5, (kpis.value?.agents_online ?? 0) - 8)))
const withSign = (n: number) => (n > 0 ? `+${n}` : `${n}`)
</script>

<template>
  <div
    class="min-h-dvh w-full transition-colors duration-500"
    :class="theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'"
  >
    <!-- HEADER -->
    <header
      class="w-full border-b"
      :class="theme === 'dark' ? 'border-white/10' : 'border-neutral-200'"
    >
      <div class="mx-auto max-w-[1800px] px-[2vw] py-[1.2vw] flex items-center justify-between">
        <div class="flex items-center gap-[1vw]">
          <img
            src="/eurosur-logo.svg"
            alt="Grupo Eurosur"
            class="h-[2.6vw] w-auto opacity-95"
          />
          <div
            class="h-[2.6vw] w-px"
            :class="theme === 'dark' ? 'bg-white/15' : 'bg-neutral-300/50'"
          ></div>
          <h1 class="text-[2vw] font-semibold tracking-tight">Panel de llamadas</h1>
          <span
            class="hidden md:inline-flex rounded-full px-[0.9vw] py-[0.3vw] text-[0.9vw] font-medium"
            :class="theme === 'dark'
              ? 'bg-[#0261F4]/15 text-[#9CC1FF]'
              : 'bg-[#0261F4]/10 text-[#0261F4]'"
          >
            Grupo Eurosur
          </span>
        </div>

        <div class="flex items-center gap-[1vw]">
          <div class="text-right leading-none">
            <div class="text-[1.2vw] font-medium tabular-nums">{{ fmtTime(clock) }}</div>
            <div class="text-[0.9vw]" :class="theme === 'dark' ? 'text-white/60' : 'text-neutral-500'">
              {{ lastUpdated ? 'Actualizado ' + fmtTime(lastUpdated as Date) : 'Cargando…' }}
            </div>
          </div>

          <button
            class="inline-flex items-center gap-[0.5vw] rounded-[0.7vw] px-[1.2vw] py-[0.6vw]
                   text-[0.95vw] font-semibold transition-transform active:scale-[0.98]"
            :class="theme === 'dark'
              ? 'bg-[#0261F4] text-white hover:bg-[#0251D4]'
              : 'bg-[#0261F4] text-white hover:bg-[#0251D4]'"
            :disabled="isFetching"
            @click="doRefetch"
          >
            <RefreshCcw :class="['h-[1.1vw] w-[1.1vw]', isFetching ? 'animate-spin' : '']" />
            <span>{{ isFetching ? 'Actualizando' : 'Refrescar' }}</span>
          </button>

          <!-- BOTÓN TEMA -->
          <button
            class="rounded-[0.7vw] border p-[0.6vw] transition-all"
            :class="theme === 'dark'
              ? 'border-white/10 hover:bg-white/10 text-white/80'
              : 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'"
            @click="toggleTheme"
            :title="theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'"
          >
            <Sun v-if="theme === 'dark'" class="h-[1.3vw] w-[1.3vw]" />
            <Moon v-else class="h-[1.3vw] w-[1.3vw]" />
          </button>
        </div>
      </div>
    </header>

    <!-- KPIs -->
    <main class="mx-auto max-w-[1800px] px-[2vw] py-[1.6vw]">
      <section class="grid gap-[1.2vw] md:grid-cols-3 mb-[1.6vw]">
        <div
          class="rounded-[1.2vw] ring-1 p-[1.6vw]"
          :class="theme === 'dark'
            ? 'bg-white/5 ring-white/10'
            : 'bg-white ring-neutral-200 shadow-sm'"
        >
          <div class="flex items-center justify-between mb-[0.8vw]">
            <div class="flex items-center gap-[0.6vw]">
              <div class="rounded-[0.8vw] bg-[#0261F4]/20 p-[0.7vw]">
                <PhoneIncoming class="h-[1.6vw] w-[1.6vw] text-[#0261F4]" />
              </div>
              <h3 class="text-[1vw] font-medium">Llamadas en espera</h3>
            </div>
            <span
              class="text-[0.85vw] px-[0.6vw] py-[0.25vw] rounded-full"
              :class="waitingDelta > 0
                ? 'bg-red-500/20 text-red-500'
                : 'bg-emerald-500/20 text-emerald-600'"
            >
              {{ withSign(waitingDelta) }}
            </span>
          </div>
          <div class="leading-none tracking-tight">
            <span class="block font-bold tabular-nums text-[clamp(3rem,10vw,10rem)]">
              {{ isLoading ? '–' : kpis.waiting_now }}
            </span>
          </div>
          <p class="mt-[0.6vw] text-[0.95vw] opacity-70">Ahora mismo</p>
        </div>

        <div
          class="rounded-[1.2vw] ring-1 p-[1.6vw]"
          :class="theme === 'dark'
            ? 'bg-white/5 ring-white/10'
            : 'bg-white ring-neutral-200 shadow-sm'"
        >
          <div class="flex items-center justify-between mb-[0.8vw]">
            <div class="flex items-center gap-[0.6vw]">
              <div class="rounded-[0.8vw] bg-[#0261F4]/20 p-[0.7vw]">
                <PhoneCall class="h-[1.6vw] w-[1.6vw] text-[#0261F4]" />
              </div>
              <h3 class="text-[1vw] font-medium">Contestadas hoy</h3>
            </div>
            <span
              class="text-[0.85vw] px-[0.6vw] py-[0.25vw] rounded-full"
              :class="answeredDelta >= 0
                ? 'bg-emerald-500/20 text-emerald-600'
                : 'bg-red-500/20 text-red-500'"
            >
              {{ withSign(answeredDelta) }}
            </span>
          </div>
          <div class="leading-none tracking-tight">
            <span class="block font-bold tabular-nums text-[clamp(3rem,10vw,10rem)]">
              {{ isLoading ? '–' : kpis.answered_today }}
            </span>
          </div>
          <p class="mt-[0.6vw] text-[0.95vw] opacity-70">Desde las 00:00</p>
        </div>

        <div
          class="rounded-[1.2vw] ring-1 p-[1.6vw]"
          :class="theme === 'dark'
            ? 'bg-white/5 ring-white/10'
            : 'bg-white ring-neutral-200 shadow-sm'"
        >
          <div class="flex items-center justify-between mb-[0.8vw]">
            <div class="flex items-center gap-[0.6vw]">
              <div class="rounded-[0.8vw] bg-[#0261F4]/20 p-[0.7vw]">
                <Users class="h-[1.6vw] w-[1.6vw] text-[#0261F4]" />
              </div>
              <h3 class="text-[1vw] font-medium">Agentes activos</h3>
            </div>
            <span
              class="text-[0.85vw] px-[0.6vw] py-[0.25vw] rounded-full"
              :class="agentsDelta >= 0
                ? 'bg-emerald-500/20 text-emerald-600'
                : 'bg-red-500/20 text-red-500'"
            >
              {{ withSign(agentsDelta) }}
            </span>
          </div>
          <div class="leading-none tracking-tight">
            <span class="block font-bold tabular-nums text-[clamp(3rem,10vw,10rem)]">
              {{ isLoading ? '–' : kpis.agents_online }}
            </span>
          </div>
          <p class="mt-[0.6vw] text-[0.95vw] opacity-70">Conectados</p>
        </div>
      </section>

      <!-- GRÁFICOS -->
      <section class="grid gap-[1.2vw] md:grid-cols-2">
        <div
          class="rounded-[1.2vw] ring-1 p-[1.2vw]"
          :class="theme === 'dark'
            ? 'bg-white/5 ring-white/10'
            : 'bg-white ring-neutral-200 shadow-sm'"
        >
          <DonutCard
            title="Distribución de llamadas"
            subtitle="Hoy"
            :labels="donutLabels"
            :series="donutSeries"
            :height="480"
          />
        </div>
        <div
          class="rounded-[1.2vw] ring-1 p-[1.2vw]"
          :class="theme === 'dark'
            ? 'bg-white/5 ring-white/10'
            : 'bg-white ring-neutral-200 shadow-sm'"
        >
          <RadialProgressCard
            title="Disponibilidad de agentes"
            :value="Number(kpis?.agents_online ?? 0)"
            :height="480"
          />
        </div>
      </section>

      <footer class="mt-[1.6vw] text-[0.9vw] opacity-60">
        Modo: <b>{{ theme }}</b> · Actualización cada {{ REFRESH_MS / 1000 }} s
      </footer>
    </main>
  </div>
</template>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
