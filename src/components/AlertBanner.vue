<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, X } from 'lucide-vue-next'
import type { EstadoDeposito } from '@/features/gasoil/schemas'

const props = defineProps<{
  depositos: EstadoDeposito[]
  onClose?: () => void
}>()

const depositosCriticos = computed(() => 
  props.depositos.filter(d => d.LITROS_ACTUALES < 200)
)

const severity = computed(() => {
  if (depositosCriticos.value.length > 0) return 'critical'
  return 'warning'
})

const alertClass = computed(() => {
  if (severity.value === 'critical') {
    return 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200'
  }
  return 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200'
})

const iconClass = computed(() => {
  if (severity.value === 'critical') {
    return 'text-red-600 dark:text-red-400'
  }
  return 'text-amber-600 dark:text-amber-400'
})
</script>

<template>
  <div
    v-if="depositos.length > 0"
    class="relative rounded-[1vw] border p-[1.2vw] mb-[1.6vw] transition-all duration-300"
    :class="alertClass"
    role="alert"
  >
    <div class="flex items-start gap-[1vw]">
      <!-- Icono -->
      <div class="flex-shrink-0">
        <AlertTriangle 
          class="h-[1.6vw] w-[1.6vw]"
          :class="iconClass"
        />
      </div>

      <!-- Contenido -->
      <div class="flex-1">
        <h3 class="text-[1.1vw] font-semibold mb-[0.4vw]">
          <template v-if="severity === 'critical'">
            ¡Alerta crítica de combustible!
          </template>
          <template v-else>
            Nivel bajo de combustible
          </template>
        </h3>
        
        <div class="space-y-[0.3vw]">
          <div
            v-for="deposito in depositos"
            :key="deposito.ID_DEPOSITO"
            class="text-[0.95vw]"
          >
            <span class="font-medium">{{ deposito.NOMBRE }}</span>:
            <span 
              class="font-bold tabular-nums"
              :class="deposito.LITROS_ACTUALES < 200 ? 'text-red-700 dark:text-red-300' : ''"
            >
              {{ deposito.LITROS_ACTUALES.toFixed(1) }}L
            </span>
            <span class="opacity-70">
              ({{ deposito.PORCENTAJE }}% de capacidad)
            </span>
            <span
              v-if="deposito.LITROS_ACTUALES < 200"
              class="ml-[0.5vw] text-[0.8vw] font-semibold uppercase tracking-wide"
            >
              CRÍTICO
            </span>
          </div>
        </div>

        <p class="mt-[0.6vw] text-[0.85vw] opacity-80">
          <template v-if="severity === 'critical'">
            Se requiere reposición urgente de combustible.
          </template>
          <template v-else>
            Considere programar reposición de combustible pronto.
          </template>
        </p>
      </div>

      <!-- Botón cerrar (opcional) -->
      <button
        v-if="onClose"
        @click="onClose"
        class="flex-shrink-0 rounded-[0.5vw] p-[0.3vw] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        :class="iconClass"
        aria-label="Cerrar alerta"
      >
        <X class="h-[1.2vw] w-[1.2vw]" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>