<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Settings, Save, ArrowLeft, AlertTriangle, Bell, Volume2, RotateCcw, Circle } from 'lucide-vue-next'
import { useConfigStore } from '@/store/config'

const router = useRouter()
const configStore = useConfigStore()

// Snapshot inicial
const initial = {
  umbralAlerta: configStore.umbralAlerta,
  umbralCritico: configStore.umbralCritico,
  sonidoHabilitado: configStore.sonidoHabilitado,
}

// Estado local
const umbralAlerta = ref<number>(initial.umbralAlerta)
const umbralCritico = ref<number>(initial.umbralCritico)
const sonidoHabilitado = ref<boolean>(initial.sonidoHabilitado)

// UI state
const guardando = ref(false)
const mensaje = ref('')
const errorMensaje = ref('')

// Validación
const errores = computed(() => {
  const e: Record<string, string> = {}
  if (umbralAlerta.value < 0 || umbralCritico.value < 0) e.negativo = 'Los valores no pueden ser negativos.'
  if (umbralAlerta.value <= umbralCritico.value) e.umbral = 'El umbral de alerta debe ser mayor que el crítico.'
  return e
})
const formularioValido = computed(() => Object.keys(errores.value).length === 0)
const hasChanges = computed(() =>
  umbralAlerta.value !== initial.umbralAlerta ||
  umbralCritico.value !== initial.umbralCritico ||
  sonidoHabilitado.value !== initial.sonidoHabilitado
)

// Guardar
async function guardarConfig() {
  if (!formularioValido.value) {
    errorMensaje.value = errores.value.umbral || errores.value.negativo || 'Hay errores en el formulario.'
    setTimeout(() => (errorMensaje.value = ''), 3000)
    return
  }
  guardando.value = true
  try {
    configStore.updateConfig({
      umbralAlerta: umbralAlerta.value,
      umbralCritico: umbralCritico.value,
      sonidoHabilitado: sonidoHabilitado.value,
    })
    initial.umbralAlerta = umbralAlerta.value
    initial.umbralCritico = umbralCritico.value
    initial.sonidoHabilitado = sonidoHabilitado.value
    mensaje.value = 'Configuración guardada correctamente.'
    setTimeout(() => (mensaje.value = ''), 2500)
  } catch {
    errorMensaje.value = 'Error al guardar la configuración.'
    setTimeout(() => (errorMensaje.value = ''), 3000)
  } finally {
    guardando.value = false
  }
}

// Por defecto -> crítico 400 L
const DEFAULTS = { umbralAlerta: 900, umbralCritico: 400, sonidoHabilitado: true }
function restaurarPorDefecto() {
  umbralAlerta.value = DEFAULTS.umbralAlerta
  umbralCritico.value = DEFAULTS.umbralCritico
  sonidoHabilitado.value = DEFAULTS.sonidoHabilitado
}

// Probar sonido
let testAudio: HTMLAudioElement | null = null
async function probarSonido() {
  try {
    const beep = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAZGF0YQAAAAA='
    if (!testAudio) testAudio = new Audio(beep)
    await testAudio.play()
  } catch {
    errorMensaje.value = 'El navegador ha bloqueado el audio (permite el sonido o haz una interacción previa).'
    setTimeout(() => (errorMensaje.value = ''), 3000)
  }
}

// Clases
const baseInputClass = 'w-full rounded-lg bg-white transition-colors duration-150 border-2 focus:outline-none focus:ring-4 text-base sm:text-sm'
const normalInputClass = 'border-slate-200 focus:border-blue-500 focus:ring-blue-600/10'
const errorInputClass  = 'border-red-500 focus:border-red-500 focus:ring-red-600/10'
</script>

<template>
  <div class="min-h-screen text-slate-900" style="background-color: var(--color-slate-50)">
    <!-- Header (mismo fondo, compacto, responsive) -->
    <header class="border-b border-slate-200" style="background-color: var(--color-slate-50)">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-14 items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <button
              @click="router.push('/')"
              class="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Volver al inicio"
            >
              <ArrowLeft class="h-5 w-5" />
            </button>
            <div class="flex items-center gap-2">
              <Settings class="h-5 w-5 text-blue-600 shrink-0" />
              <h1 class="text-base sm:text-lg font-semibold truncate">Configuración</h1>
            </div>
          </div>

          <div class="hidden sm:flex items-center gap-2">
            <span
              class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
              :class="hasChanges ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-300 bg-slate-100 text-slate-600'"
              aria-live="polite"
            >
              <Circle :class="hasChanges ? 'text-amber-500' : 'text-slate-400'" class="h-3 w-3" />
              {{ hasChanges ? 'Cambios sin guardar' : 'Sin cambios' }}
            </span>

            <button
              type="button"
              @click="restaurarPorDefecto"
              class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm inline-flex items-center gap-2"
              title="Restaurar valores por defecto"
            >
              <RotateCcw class="h-4 w-4" />
              Por defecto
            </button>

            <button
              type="button"
              @click="guardarConfig"
              :disabled="!formularioValido || !hasChanges || guardando"
              class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Save class="h-4 w-4" />
              {{ guardando ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Mensajes globales -->
      <div v-if="mensaje" class="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-emerald-50 text-emerald-700">{{ mensaje }}</div>
      <div v-if="errorMensaje" class="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-red-50 text-red-700">{{ errorMensaje }}</div>

      <div class="space-y-6 sm:space-y-8">
        <!-- Umbrales -->
        <section class="rounded-xl border border-slate-200 p-4 sm:p-6 bg-white/80 backdrop-blur">
          <div class="flex items-center gap-3 mb-4 sm:mb-6">
            <AlertTriangle class="h-5 w-5 text-amber-500 shrink-0" />
            <h2 class="text-lg font-semibold">Umbrales de Gasoil</h2>
          </div>

          <div class="space-y-5 sm:space-y-6">
            <!-- Alerta -->
            <div class="grid gap-3 md:grid-cols-3 md:gap-4 items-start">
              <div class="md:col-span-1">
                <label for="umbralAlerta" class="font-medium block">Umbral de alerta</label>
                <p class="text-sm text-slate-500 mt-1">Advertencia por debajo de este nivel (L).</p>
              </div>
              <div class="md:col-span-2">
                <div class="relative">
                  <input
                    id="umbralAlerta"
                    v-model.number="umbralAlerta"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    step="50"
                    :class="[baseInputClass, (errores.umbral || errores.negativo) ? errorInputClass : normalInputClass]"
                    :aria-invalid="!!errores.umbral || !!errores.negativo"
                  />
                  <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">L</span>
                </div>
                <p v-if="errores.umbral || errores.negativo" class="mt-2 text-sm text-red-600">
                  {{ errores.umbral || errores.negativo }}
                </p>
              </div>
            </div>

            <!-- Crítico -->
            <div class="grid gap-3 md:grid-cols-3 md:gap-4 items-start">
              <div class="md:col-span-1">
                <label for="umbralCritico" class="font-medium block">Umbral crítico</label>
                <p class="text-sm text-slate-500 mt-1">Activa alerta crítica (con sonido) por debajo de este nivel.</p>
              </div>
              <div class="md:col-span-2">
                <div class="relative">
                  <input
                    id="umbralCritico"
                    v-model.number="umbralCritico"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    step="50"
                    :class="[baseInputClass, (errores.umbral || errores.negativo) ? errorInputClass : normalInputClass]"
                    :aria-invalid="!!errores.umbral || !!errores.negativo"
                  />
                  <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">L</span>
                </div>
                <p v-if="errores.umbral || errores.negativo" class="mt-2 text-sm text-red-600">
                  {{ errores.umbral || errores.negativo }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Notificaciones -->
        <section class="rounded-xl border border-slate-200 p-4 sm:p-6 bg-white/80 backdrop-blur">
          <div class="flex items-center gap-3 mb-4 sm:mb-6">
            <Bell class="h-5 w-5 text-blue-600 shrink-0" />
            <h2 class="text-lg font-semibold">Notificaciones</h2>
          </div>

          <div class="grid gap-3 md:grid-cols-3 md:gap-4 items-start">
            <div class="md:col-span-1">
              <label class="font-medium block">Sonido de alerta</label>
              <p class="text-sm text-slate-500 mt-1">Se reproducirá cuando el nivel esté por debajo del crítico.</p>
            </div>

            <div class="md:col-span-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <!-- Switch -->
              <button
                type="button"
                @click="sonidoHabilitado = !sonidoHabilitado"
                :class="sonidoHabilitado ? 'bg-blue-600' : 'bg-slate-200'"
                class="relative inline-flex h-8 w-14 sm:h-6 sm:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                role="switch"
                :aria-checked="sonidoHabilitado"
                :aria-label="sonidoHabilitado ? 'Desactivar sonido' : 'Activar sonido'"
              >
                <span
                  :class="sonidoHabilitado ? 'translate-x-6 sm:translate-x-5' : 'translate-x-0'"
                  class="pointer-events-none inline-block h-7 w-7 sm:h-5 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                ></span>
              </button>

              <!-- Probar sonido -->
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 sm:px-3 sm:py-2 text-sm hover:bg-slate-50"
                @click="probarSonido"
              >
                <Volume2 class="h-4 w-4" />
                Probar sonido
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Barra flotante inferior (solo móvil) -->
    <div
      v-if="hasChanges"
      class="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-4 py-3"
      style="padding-bottom: max(env(safe-area-inset-bottom), 12px);"
      role="region"
      aria-label="Acciones de configuración"
    >
      <div class="mx-auto max-w-4xl flex items-center gap-3">
        <span class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 text-amber-700 px-2 py-0.5 text-xs">
          <Circle class="h-3 w-3 text-amber-500" />
          Cambios sin guardar
        </span>
        <div class="ml-auto flex items-center gap-2">
          <button
            type="button"
            @click="restaurarPorDefecto"
            class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm inline-flex items-center gap-2"
            title="Restaurar valores por defecto"
          >
            <RotateCcw class="h-4 w-4" />
            Por defecto
          </button>
          <button
            type="button"
            @click="guardarConfig"
            :disabled="!formularioValido || guardando"
            class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Save class="h-4 w-4" />
            {{ guardando ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Mejora UX móvil: evita zoom en iOS al enfocar número (opcional si usas meta viewport) */
input[type="number"] { font-size: 16px; }
@media (min-width: 640px) {
  input[type="number"] { font-size: 14px; }
}
</style>
