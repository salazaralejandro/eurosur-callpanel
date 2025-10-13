<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useKpis } from '@/features/kpis/useKpis'
import StatPanel from '@/components/StatPanel.vue'
import DonutCard from '@/components/charts/DonutCard.vue'
import RadialProgressCard from '@/components/charts/RadialProgressCard.vue'
import { useAuthStore } from '@/store/auth'
import { RefreshCcw, LogOut, PhoneIncoming, PhoneCall, Users } from 'lucide-vue-next'

const { data, isLoading, refetch, isFetching } = useKpis()
const kpis = computed(() => data.value ?? null)

const auth = useAuthStore()
const router = useRouter()
const handleLogout = async () => {
  await auth.logout()
  router.replace({ name: 'login' })
}

const donutSeries = computed<number[]>(() => [
  Number(kpis.value?.answered_today ?? 0),
  Number(kpis.value?.waiting_now ?? 0),
])
const donutLabels = ['Contestadas hoy', 'En espera ahora']

const waitingDelta = computed<number | null>(() =>
  kpis.value ? Math.max(-5, Math.min(5, (kpis.value.waiting_now ?? 0) - 2)) : null
)
const answeredDelta = computed<number | null>(() =>
  kpis.value ? Math.max(-20, Math.min(20, (kpis.value.answered_today ?? 0) - 100)) : null
)
const agentsDelta = computed<number | null>(() =>
  kpis.value ? Math.max(-5, Math.min(5, (kpis.value.agents_online ?? 0) - 8)) : null
)
</script>

<template>
  <div class="min-h-dvh bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
    <!-- Header minimalista -->
    <header class="border-b border-neutral-100">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 py-5">
        <div class="flex items-center gap-4">
          <img src="/eurosur-logo.svg" alt="Grupo Eurosur" class="h-7 w-auto opacity-90" />
          <div class="hidden sm:flex items-center gap-3">
            <div class="h-4 w-px bg-[#0261F4]/20"></div>
            <h1 class="text-lg font-medium text-neutral-900">Panel de llamadas</h1>
            <span class="rounded-full bg-[#0261F4]/10 px-2.5 py-0.5 text-xs font-medium text-[#0261F4]">
              Grupo Eurosur
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="group inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium
                   text-neutral-700 transition-all duration-200 hover:bg-[#0261F4]/5 hover:text-[#0261F4]
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0261F4]/20"
            @click="refetch()"
            :disabled="isFetching"
            :aria-busy="isFetching"
          >
            <RefreshCcw 
              class="h-4 w-4 transition-transform duration-300" 
              :class="isFetching ? 'animate-spin' : 'group-hover:rotate-90'" 
              aria-hidden="true" 
            />
            <span class="hidden sm:inline">{{ isFetching ? 'Actualizando' : 'Refrescar' }}</span>
          </button>

          <button
            class="inline-flex items-center gap-2 rounded-lg bg-[#0261F4] px-3.5 py-2 text-sm font-medium text-white
                   transition-all duration-200 hover:bg-[#0251D4] hover:shadow-lg hover:shadow-[#0261F4]/30
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0261F4]/50 active:scale-95"
            @click="handleLogout"
          >
            <LogOut class="h-4 w-4" aria-hidden="true" />
            <span class="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido -->
    <main class="mx-auto max-w-7xl w-full px-6 lg:px-8 py-8 sm:py-12">
      <!-- Título sección -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-neutral-900">Actividad en tiempo real</h2>
      </div>

      <!-- Stats minimalistas -->
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12">
        <StatPanel
          title="Llamadas en espera"
          :value="kpis?.waiting_now"
          :loading="isLoading"
          :hint="kpis ? 'Ahora mismo' : undefined"
          :icon="PhoneIncoming"
          :delta="waitingDelta"
          delta-label="últ. 30 min"
          :positive-is-good="false"
        />
        <StatPanel
          title="Contestadas hoy"
          :value="kpis?.answered_today"
          :loading="isLoading"
          :hint="kpis ? 'Desde las 00:00' : undefined"
          :icon="PhoneCall"
          :delta="answeredDelta"
          delta-label="vs. objetivo"
          :positive-is-good="true"
        />
        <StatPanel
          title="Agentes activos"
          :value="kpis?.agents_online"
          :loading="isLoading"
          :hint="kpis ? 'Conectados' : undefined"
          :icon="Users"
          :delta="agentsDelta"
          delta-label="vs. turno"
          :positive-is-good="true"
        />
      </div>

      <!-- Gráficos con más espacio -->
      <section class="grid gap-6 md:grid-cols-2 mb-12">
        <DonutCard
          title="Distribución de llamadas"
          subtitle="Resumen del día"
          :labels="['Contestadas hoy','En espera ahora']"
          :series="[Number(kpis?.answered_today ?? 0), Number(kpis?.waiting_now ?? 0)]"
        />
        <RadialProgressCard
          title="Disponibilidad de agentes"
          :value="Number(kpis?.agents_online ?? 0)"
        />
      </section>

      <!-- Tabla futura con diseño más limpio -->
      <section class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div class="border-b border-neutral-100 px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-neutral-900">Historial de llamadas</h3>
              <p class="text-sm text-neutral-500 mt-0.5">Registro completo de actividad</p>
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-[#0261F4]/10 px-3 py-1 text-xs font-medium text-[#0261F4]">
              <span class="h-1.5 w-1.5 rounded-full bg-[#0261F4] animate-pulse"></span>
              Próximamente
            </span>
          </div>
        </div>
        
        <div class="px-6 py-16 text-center">
          <div class="mx-auto max-w-sm">
            <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0261F4]/10">
              <PhoneCall class="h-6 w-6 text-[#0261F4]" />
            </div>
            <p class="text-sm text-neutral-600 mb-1">Tabla de llamadas en desarrollo</p>
            <p class="text-xs text-neutral-500">
              Incluirá filtros por fecha, estado, agente y exportación CSV
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>