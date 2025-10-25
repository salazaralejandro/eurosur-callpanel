<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useCallsKpis } from '@/features/calls/useCalls'
import { Hourglass, PhoneCall, Users } from 'lucide-vue-next'

/* === Config del endpoint (sin SWITCH_KEY) === */
const SWITCH_URL = import.meta.env.VITE_SWITCH_URL || '/api/switch-flow'

type SwitchMode = 'day' | 'night'
type SwitchResponse = {
  ok: boolean
  mode: SwitchMode
  flow_id?: string
  results?: Array<{ pbx_id: string; success: boolean; error?: string }>
  error?: string
}

/* === Estado del interruptor === */
const isNight = ref<boolean>(false)            // false=day, true=night (UI)
const isSwitching = ref<boolean>(false)
const switchMessage = ref<string>('')
const switchError = ref<string>('')
const pbxTarget = ref<string>('')              // opcional: PBX concreta

// Carga estado persistido
onMounted(() => {
  const saved = localStorage.getItem('flow_mode') // 'day' | 'night'
  if (saved === 'night') isNight.value = true
})

async function applyFlow(target: 'day' | 'night') {
  // Petición GET al backend (sin key)
  const params = new URLSearchParams({ mode: target })
  if (pbxTarget.value.trim()) params.set('pbx', pbxTarget.value.trim())

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)

  const res = await fetch(`${SWITCH_URL}?${params.toString()}`, {
    method: 'GET',
    signal: controller.signal,
    headers: { Accept: 'application/json' }
  })
  clearTimeout(timer)

  let data: SwitchResponse | null = null
  try { data = await res.json() } catch { data = { ok: res.ok, mode: target } }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Error ${res.status} ${res.statusText}`)
  }
  return data
}

// Maneja el cambio del switch con optimismo+rollback en error
async function onToggleSwitch() {
  if (isSwitching.value) return
  switchMessage.value = ''
  switchError.value = ''
  isSwitching.value = true

  const wantNight = isNight.value
  const target: SwitchMode = wantNight ? 'night' : 'day'
  const prev = !wantNight

  try {
    await applyFlow(target)
    localStorage.setItem('flow_mode', target)
    const scope = pbxTarget.value.trim() ? `PBX ${pbxTarget.value.trim()}` : 'todas las PBX'
    switchMessage.value = `Flujo de ${target === 'day' ? 'Día' : 'Noche'} aplicado correctamente a ${scope}.`
  } catch (e: any) {
    isNight.value = prev // rollback
    switchError.value = e?.message || 'No se pudo cambiar el desvío.'
  } finally {
    isSwitching.value = false
  }
}

/* === Panel de llamadas (igual que tenías) === */
const REFRESH_MS = 60_000
const { data: calls, refetch: refetchCalls } = useCallsKpis(REFRESH_MS, 60, 10)
const waitingNow    = computed(() => calls.value?.waiting_now ?? 0)
const answeredToday = computed(() => calls.value?.answered_today ?? 0)
const agentsOnline  = computed(() => calls.value?.agents_online ?? 0)

const lastUpdated = ref<Date | null>(null)
watch(calls, () => (lastUpdated.value = new Date()))

/* Reloj */
const clock = ref(new Date())
let clockId: number | null = null
onMounted(() => {
  clockId = window.setInterval(() => (clock.value = new Date()), 1000)
  refetchCalls()
})
onBeforeUnmount(() => clockId && clearInterval(clockId))
const fmtTime = (d: Date) => d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})
const fmtTimeWithSeconds = (d: Date) => d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-900">
    <main class="mx-auto max-w-[1800px] px-4 sm:px-8 py-8">
      <header class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-4xl font-bold text-slate-800">Panel de Llamadas</h1>
          <p class="mt-2 text-sm text-slate-600">
            Modo actual: <span class="font-medium">{{ isNight ? 'Noche' : 'Día' }}</span>
          </p>
        </div>
        <div class="text-right">
          <div class="text-4xl font-bold text-slate-900 tabular-nums">{{ fmtTimeWithSeconds(clock) }}</div>
          <p class="text-lg text-slate-500 mt-1">Actualizado: {{ lastUpdated ? fmtTime(lastUpdated) : '—' }}</p>
        </div>
      </header>

      <!-- Switch Día/Noche -->
      <section class="mb-8 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm">
        <header class="flex flex-wrap items-center justify-between gap-4">
          <h2 class="text-2xl font-semibold text-slate-800">Flujo operativo</h2>

          <div class="flex items-center gap-4">
            <!-- PBX concreta (opcional) -->
            <input
              v-model="pbxTarget"
              type="text"
              inputmode="numeric"
              placeholder="PBX concreta (opcional)"
              class="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <!-- Switch accesible -->
            <label class="inline-flex items-center gap-3 select-none">
              <span class="text-sm text-slate-600">Día</span>
              <button
                type="button"
                role="switch"
                :aria-checked="isNight"
                :disabled="isSwitching"
                @click="isNight = !isNight; onToggleSwitch()"
                class="relative h-7 w-14 rounded-full transition
                       disabled:opacity-60 disabled:cursor-not-allowed
                       outline-none ring-0 border border-slate-300
                       bg-slate-200 data-[on=true]:bg-slate-900"
                :data-on="isNight"
              >
                <span
                  class="absolute top-1/2 -translate-y-1/2 left-1
                         h-5 w-5 rounded-full bg-white shadow
                         transition-transform data-[on=true]:translate-x-7"
                  :data-on="isNight"
                />
              </button>
              <span class="text-sm text-slate-600">Noche</span>
            </label>
          </div>
        </header>

        <!-- Mensajes -->
        <div class="mt-4">
          <p v-if="switchMessage" class="rounded-lg bg-emerald-50 text-emerald-700 px-4 py-2 text-sm border border-emerald-200">
            {{ switchMessage }}
          </p>
          <p v-if="switchError" class="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm border border-red-200">
            {{ switchError }}
          </p>
          <p v-if="!switchMessage && !switchError" class="text-slate-500 text-sm">
            Vacía el campo PBX para aplicar el cambio a todas las centralitas configuradas en el backend.
          </p>
        </div>
      </section>

      <!-- KPIs -->
      <section class="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="text-2xl font-medium text-slate-600">En espera</div>
            <div class="bg-blue-100 text-blue-600 rounded-lg p-3"><Hourglass class="h-8 w-8" /></div>
          </div>
          <div class="mt-4 text-8xl font-bold text-slate-900 tabular-nums leading-none">{{ waitingNow }}</div>
          <div class="text-xl text-slate-500 mt-2">Ahora mismo</div>
        </div>

        <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="text-2xl font-medium text-slate-600">Contestadas</div>
            <div class="bg-blue-100 text-blue-600 rounded-lg p-3"><PhoneCall class="h-8 w-8" /></div>
          </div>
          <div class="mt-4 text-8xl font-bold text-slate-900 tabular-nums leading-none">{{ answeredToday }}</div>
          <div class="text-xl text-slate-500 mt-2">Desde las 00:00</div>
        </div>

        <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="text-2xl font-medium text-slate-600">Agentes activos</div>
            <div class="bg-blue-100 text-blue-600 rounded-lg p-3"><Users class="h-8 w-8" /></div>
          </div>
          <div class="mt-4 text-8xl font-bold text-slate-900 tabular-nums leading-none">{{ agentsOnline }}</div>
          <div class="text-xl text-slate-500 mt-2">Últimos 10 min</div>
        </div>
      </section>

      <section class="mt-8 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <header class="p-4 border-b border-slate-200">
          <h3 class="text-2xl font-semibold text-slate-800">Actividad en espera</h3>
        </header>
        <div class="p-4">
          <div class="h-[250px] flex items-center justify-center text-slate-500 text-lg">
            Gráfico temporalmente desactivado.
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.tabular-nums { font-variant-numeric: tabular-nums; }
button[role="switch"] { transition: background-color .2s ease; }
button[role="switch"][data-on="true"] { background-color: #0f172a; }
button[role="switch"] span[data-on="true"] { transform: translateX(28px); }
</style>
