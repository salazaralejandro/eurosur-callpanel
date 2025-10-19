<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Settings, Save, ArrowLeft, AlertTriangle, Bell, Volume2 } from 'lucide-vue-next'
import { useConfigStore } from '@/store/config'

const router = useRouter()
const configStore = useConfigStore()

const umbralAlerta = ref(configStore.umbralAlerta)
const umbralCritico = ref(configStore.umbralCritico)
const sonidoHabilitado = ref(configStore.sonidoHabilitado)

const guardando = ref(false)
const mensaje = ref('')
const errorMensaje = ref('')

// Validación
const errores = computed(() => {
  const e: Record<string, string> = {}
  if (umbralAlerta.value <= umbralCritico.value) {
    e.umbral = 'El umbral de alerta debe ser mayor que el umbral crítico.'
  }
  if (umbralAlerta.value < 0 || umbralCritico.value < 0) {
    e.negativo = 'Los valores no pueden ser negativos.'
  }
  return e
})

const formularioValido = computed(() => Object.keys(errores.value).length === 0)

// Guardar configuración
const guardarConfig = async () => {
  if (!formularioValido.value) {
    errorMensaje.value = errores.value.umbral || errores.value.negativo || 'Hay errores en el formulario.'
    setTimeout(() => { errorMensaje.value = '' }, 3000)
    return
  }
  
  guardando.value = true
  mensaje.value = ''
  errorMensaje.value = ''
  
  try {
    configStore.updateConfig({
      umbralAlerta: umbralAlerta.value,
      umbralCritico: umbralCritico.value,
      sonidoHabilitado: sonidoHabilitado.value,
    })
    
    mensaje.value = 'Configuración guardada correctamente.'
    setTimeout(() => { mensaje.value = '' }, 3000)
    
  } catch (error) {
    errorMensaje.value = 'Error al guardar la configuración.'
    setTimeout(() => { errorMensaje.value = '' }, 3000)
  } finally {
    guardando.value = false
  }
}

// === Clases dinámicas para Inputs (para limpieza de template) ===
const baseInputClass = "w-full rounded-lg bg-white transition-colors duration-150 border-2 focus:outline-none focus:ring-4"
const normalInputClass = "border-slate-200 focus:border-blue-500 focus:ring-blue-600/10"
const errorInputClass = "border-red-500 focus:border-red-500 focus:ring-red-600/10"

</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    
    <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <div class="flex items-center gap-4">
            <button
              @click="router.push('/')"
              class="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Volver al inicio"
            >
              <ArrowLeft class="h-5 w-5" />
            </button>
            <div class="flex items-center gap-3">
              <Settings class="h-6 w-6 text-blue-600" />
              <h1 class="text-xl font-semibold text-slate-900">Configuración</h1>
            </div>
          </div>

          <button
            type="button"
            @click="guardarConfig"
            :disabled="!formularioValido || guardando"
            class="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold
                   hover:bg-blue-700 transition-colors text-sm
                   disabled:opacity-50 disabled:cursor-not-allowed
                   inline-flex items-center gap-2"
          >
            <Save class="h-4 w-4" />
            {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div v-if="mensaje" class="mb-6 p-4 rounded-lg bg-emerald-50 text-emerald-700">
        {{ mensaje }}
      </div>
      <div v-if="errorMensaje" class="mb-6 p-4 rounded-lg bg-red-50 text-red-700">
        {{ errorMensaje }}
      </div>

      <div class="space-y-8">
        
        <section class="bg-white rounded-xl border border-slate-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <AlertTriangle class="h-5 w-5 text-amber-500" />
            <h2 class="text-lg font-semibold text-slate-800">Umbrales de Alerta de Gasoil</h2>
          </div>
          
          <div class="space-y-6">
            <div class="grid md:grid-cols-3 gap-4 items-start">
              <div class="md:col-span-1">
                <label for="umbralAlerta" class="font-medium">Umbral de Alerta</label>
                <p class="text-sm text-slate-500 mt-1">Advertencia cuando el nivel de un depósito sea inferior a este valor (en litros).</p>
              </div>
              <div class="md:col-span-2">
                <input
                  id="umbralAlerta"
                  v-model.number="umbralAlerta"
                  type="number" min="0" step="50"
                  :class="[baseInputClass, errores.umbral ? errorInputClass : normalInputClass]"
                />
              </div>
            </div>

            <div class="grid md:grid-cols-3 gap-4 items-start">
              <div class="md:col-span-1">
                <label for="umbralCritico" class="font-medium">Umbral Crítico</label>
                <p class="text-sm text-slate-500 mt-1">Alerta crítica (con animación y sonido) cuando el nivel sea inferior.</p>
              </div>
              <div class="md:col-span-2">
                <input
                  id="umbralCritico"
                  v-model.number="umbralCritico"
                  type="number" min="0" step="50"
                  :class="[baseInputClass, errores.umbral ? errorInputClass : normalInputClass]"
                />
              </div>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-xl border border-slate-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <Bell class="h-5 w-5 text-blue-600" />
            <h2 class="text-lg font-semibold text-slate-800">Notificaciones</h2>
          </div>
          
          <div class="space-y-6">
            <div class="grid md:grid-cols-3 gap-4 items-start">
              <div class="md:col-span-1">
                <label class="font-medium">Sonido de alerta</label>
                <p class="text-sm text-slate-500 mt-1">Reproducir un sonido cuando un depósito alcance el nivel crítico.</p>
              </div>
              <div class="md:col-span-2">
                <button
                  type="button"
                  @click="sonidoHabilitado = !sonidoHabilitado"
                  :class="sonidoHabilitado ? 'bg-blue-600' : 'bg-slate-200'"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  role="switch"
                  :aria-checked="sonidoHabilitado"
                >
                  <span
                    :class="sonidoHabilitado ? 'translate-x-5' : 'translate-x-0'"
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  ></span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>