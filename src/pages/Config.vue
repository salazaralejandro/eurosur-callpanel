<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Settings, Save, ArrowLeft, AlertTriangle, Bell } from 'lucide-vue-next'
import { useConfigStore } from '@/store/config'

const router = useRouter()
const configStore = useConfigStore()

// Estados locales del formulario
const umbralAlerta = ref(configStore.umbralAlerta)
const umbralCritico = ref(configStore.umbralCritico)
const sonidoHabilitado = ref(configStore.sonidoHabilitado)
const notificacionesSMS = ref(configStore.notificacionesSMS)
const telefonosNotificacion = ref(configStore.telefonosNotificacion.join(', '))

const guardando = ref(false)
const mensaje = ref('')

// Validación
const errores = computed(() => {
  const e: Record<string, string> = {}
  
  if (umbralAlerta.value <= umbralCritico.value) {
    e.umbral = 'El umbral de alerta debe ser mayor que el umbral crítico'
  }
  
  if (umbralAlerta.value < 0 || umbralCritico.value < 0) {
    e.negativo = 'Los valores no pueden ser negativos'
  }
  
  if (notificacionesSMS.value && !telefonosNotificacion.value.trim()) {
    e.telefonos = 'Debe especificar al menos un teléfono para las notificaciones'
  }
  
  return e
})

const formularioValido = computed(() => Object.keys(errores.value).length === 0)

// Guardar configuración
const guardarConfig = async () => {
  if (!formularioValido.value) return
  
  guardando.value = true
  mensaje.value = ''
  
  try {
    // Parsear teléfonos
    const telefonos = telefonosNotificacion.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
    
    // Actualizar store
    configStore.updateConfig({
      umbralAlerta: umbralAlerta.value,
      umbralCritico: umbralCritico.value,
      sonidoHabilitado: sonidoHabilitado.value,
      notificacionesSMS: notificacionesSMS.value,
      telefonosNotificacion: telefonos
    })
    
    mensaje.value = 'Configuración guardada correctamente'
    
    setTimeout(() => {
      mensaje.value = ''
    }, 3000)
    
  } catch (error) {
    mensaje.value = 'Error al guardar la configuración'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">
    <!-- Header -->
    <header class="border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              @click="router.push('/')"
              class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowLeft class="h-5 w-5" />
            </button>
            
            <div class="flex items-center gap-3">
              <Settings class="h-6 w-6 text-[#0261F4]" />
              <h1 class="text-2xl font-semibold">Configuración del Sistema</h1>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Mensaje de estado -->
      <div
        v-if="mensaje"
        class="mb-6 p-4 rounded-lg"
        :class="mensaje.includes('Error') 
          ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
          : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'"
      >
        {{ mensaje }}
      </div>

      <!-- Formulario -->
      <form @submit.prevent="guardarConfig" class="space-y-8">
        <!-- Sección: Umbrales de Combustible -->
        <section class="bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10 p-6">
          <div class="flex items-center gap-3 mb-6">
            <AlertTriangle class="h-5 w-5 text-amber-600" />
            <h2 class="text-lg font-semibold">Umbrales de Combustible</h2>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <!-- Umbral de Alerta -->
            <div>
              <label for="umbralAlerta" class="block text-sm font-medium mb-2">
                Umbral de Alerta (litros)
              </label>
              <input
                id="umbralAlerta"
                v-model.number="umbralAlerta"
                type="number"
                min="0"
                step="50"
                class="w-full rounded-lg border-2 border-neutral-200 dark:border-white/20 
                       bg-white dark:bg-white/5 px-4 py-2.5
                       focus:border-[#0261F4] focus:outline-none focus:ring-4 focus:ring-[#0261F4]/10
                       dark:focus:border-[#4A8CFF] dark:focus:ring-[#4A8CFF]/10"
                :class="errores.umbral && 'border-red-500 dark:border-red-400'"
              />
              <p class="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                Se mostrará advertencia cuando queden menos de {{ umbralAlerta }}L
              </p>
            </div>

            <!-- Umbral Crítico -->
            <div>
              <label for="umbralCritico" class="block text-sm font-medium mb-2">
                Umbral Crítico (litros)
              </label>
              <input
                id="umbralCritico"
                v-model.number="umbralCritico"
                type="number"
                min="0"
                step="50"
                class="w-full rounded-lg border-2 border-neutral-200 dark:border-white/20 
                       bg-white dark:bg-white/5 px-4 py-2.5
                       focus:border-[#0261F4] focus:outline-none focus:ring-4 focus:ring-[#0261F4]/10
                       dark:focus:border-[#4A8CFF] dark:focus:ring-[#4A8CFF]/10"
                :class="errores.umbral && 'border-red-500 dark:border-red-400'"
              />
              <p class="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                Alerta crítica con animación cuando queden menos de {{ umbralCritico }}L
              </p>
            </div>
          </div>

          <!-- Mensaje de error -->
          <p v-if="errores.umbral" class="mt-3 text-sm text-red-600 dark:text-red-400">
            {{ errores.umbral }}
          </p>
        </section>

        <!-- Sección: Notificaciones -->
        <section class="bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10 p-6">
          <div class="flex items-center gap-3 mb-6">
            <Bell class="h-5 w-5 text-[#0261F4]" />
            <h2 class="text-lg font-semibold">Notificaciones</h2>
          </div>

          <div class="space-y-6">
            <!-- Sonido de alerta -->
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="sonidoHabilitado"
                type="checkbox"
                class="w-4 h-4 rounded border-neutral-300 dark:border-white/30
                       text-[#0261F4] focus:ring-[#0261F4]/20"
              />
              <div>
                <span class="font-medium">Sonido de alerta</span>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  Reproducir sonido cuando se detecte nivel crítico
                </p>
              </div>
            </label>

            <!-- Notificaciones SMS -->
            <div>
              <label class="flex items-center gap-3 cursor-pointer mb-3">
                <input
                  v-model="notificacionesSMS"
                  type="checkbox"
                  class="w-4 h-4 rounded border-neutral-300 dark:border-white/30
                         text-[#0261F4] focus:ring-[#0261F4]/20"
                />
                <div>
                  <span class="font-medium">Notificaciones por SMS</span>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    Enviar SMS cuando se detecte nivel crítico
                  </p>
                </div>
              </label>

              <!-- Teléfonos -->
              <div v-if="notificacionesSMS" class="ml-7">
                <label for="telefonos" class="block text-sm font-medium mb-2">
                  Teléfonos de notificación
                </label>
                <input
                  id="telefonos"
                  v-model="telefonosNotificacion"
                  type="text"
                  placeholder="600123456, 600654321"
                  class="w-full rounded-lg border-2 border-neutral-200 dark:border-white/20 
                         bg-white dark:bg-white/5 px-4 py-2.5
                         focus:border-[#0261F4] focus:outline-none focus:ring-4 focus:ring-[#0261F4]/10
                         dark:focus:border-[#4A8CFF] dark:focus:ring-[#4A8CFF]/10"
                  :class="errores.telefonos && 'border-red-500 dark:border-red-400'"
                />
                <p class="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                  Separar múltiples números con comas
                </p>
                <p v-if="errores.telefonos" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errores.telefonos }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Botones de acción -->
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            @click="router.push('/')"
            class="px-6 py-2.5 rounded-lg border-2 border-neutral-200 dark:border-white/20
                   hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors font-medium"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            :disabled="!formularioValido || guardando"
            class="px-6 py-2.5 rounded-lg bg-[#0261F4] text-white font-medium
                   hover:bg-[#0251D4] transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   inline-flex items-center gap-2"
          >
            <Save class="h-4 w-4" />
            {{ guardando ? 'Guardando...' : 'Guardar Configuración' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>