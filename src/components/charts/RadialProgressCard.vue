<script setup lang="ts">
import { computed } from 'vue'
import { Users, TrendingUp } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  title: string
  value: number
  maxValue?: number
  height?: number
  subtitle?: string
}>(), { 
  height: 280, 
  subtitle: '',
  maxValue: 10 
})

const percentage = computed(() => 
  Math.min(100, Math.round((props.value / props.maxValue) * 100))
)

const statusColor = computed(() => {
  if (percentage.value >= 80) return { color: '#10B981', bg: '#D1FAE5', label: 'Óptimo' }
  if (percentage.value >= 50) return { color: '#0261F4', bg: '#DBEAFE', label: 'Normal' }
  if (percentage.value >= 30) return { color: '#F59E0B', bg: '#FEF3C7', label: 'Bajo' }
  return { color: '#EF4444', bg: '#FEE2E2', label: 'Crítico' }
})

const options = computed(() => ({
  chart: {
    type: 'radialBar',
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350
      }
    },
    fontFamily: 'Inter, ui-sans-serif, system-ui',
  },
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      hollow: {
        margin: 0,
        size: '70%',
        background: 'transparent',
      },
      track: {
        background: '#F3F4F6',
        strokeWidth: '100%',
        margin: 0,
        dropShadow: {
          enabled: false
        }
      },
      dataLabels: {
        show: true,
        name: {
          show: true,
          fontSize: '14px',
          fontWeight: 500,
          color: '#6B7280',
          offsetY: 25
        },
        value: {
          show: true,
          fontSize: '36px',
          fontWeight: 700,
          color: statusColor.value.color,
          offsetY: -10,
          formatter: (val: number) => props.value.toString()
        }
      }
    }
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'horizontal',
      shadeIntensity: 0.5,
      gradientToColors: [statusColor.value.color],
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 0.8,
      stops: [0, 100]
    }
  },
  stroke: {
    lineCap: 'round'
  },
  labels: [props.subtitle || 'Agentes'],
  colors: [statusColor.value.color]
}))

const series = computed(() => [percentage.value])
</script>

<template>
  <section class="group relative rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-neutral-300">
    <!-- Header -->
    <div class="mb-1 flex items-start justify-between">
      <div class="flex-1">
        <h3 class="text-base font-semibold text-neutral-900">{{ title }}</h3>
        <p v-if="subtitle" class="text-sm text-neutral-500 mt-0.5">{{ subtitle }}</p>
      </div>
      <div class="rounded-lg bg-[#0261F4]/10 p-2 transition-colors duration-200 group-hover:bg-[#0261F4]/15">
        <Users class="h-5 w-5 text-[#0261F4]" aria-hidden="true" />
      </div>
    </div>

    <!-- Gráfico Radial -->
    <div class="my-4 flex justify-center">
      <apexchart
        type="radialBar"
        :height="height"
        :options="options"
        :series="series"
        aria-label="Gráfico de disponibilidad de agentes"
      />
    </div>

    <!-- Métricas detalladas -->
    <div class="space-y-3 pt-4 border-t border-neutral-100">
      <!-- Estado actual -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-neutral-600">Estado del equipo</span>
        <span 
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          :style="{ 
            background: statusColor.bg,
            color: statusColor.color
          }"
        >
          <span class="h-1.5 w-1.5 rounded-full animate-pulse" :style="{ background: statusColor.color }"></span>
          {{ statusColor.label }}
        </span>
      </div>

      <!-- Progreso visual -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-neutral-600">Disponibilidad</span>
          <span class="font-semibold text-neutral-900 tabular-nums">{{ percentage }}%</span>
        </div>
        <div class="h-2 rounded-full bg-neutral-100 overflow-hidden">
          <div 
            class="h-full rounded-full transition-all duration-500"
            :style="{ 
              width: `${percentage}%`,
              background: statusColor.color
            }"
          ></div>
        </div>
      </div>

      <!-- Desglose -->
      <div class="grid grid-cols-2 gap-3 pt-2">
        <div class="rounded-lg bg-neutral-50 p-3">
          <div class="flex items-center gap-2 mb-1">
            <div class="h-2 w-2 rounded-full bg-[#10B981]"></div>
            <span class="text-xs text-neutral-600">Activos</span>
          </div>
          <p class="text-lg font-bold text-neutral-900 tabular-nums">{{ value }}</p>
        </div>
        <div class="rounded-lg bg-neutral-50 p-3">
          <div class="flex items-center gap-2 mb-1">
            <div class="h-2 w-2 rounded-full bg-neutral-400"></div>
            <span class="text-xs text-neutral-600">Capacidad</span>
          </div>
          <p class="text-lg font-bold text-neutral-900 tabular-nums">{{ maxValue }}</p>
        </div>
      </div>
    </div>

    <!-- Barra decorativa en hover -->
    <div class="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
      <div class="h-full bg-gradient-to-r from-[#0261F4]/20 via-[#0261F4]/40 to-[#0261F4]/20"></div>
    </div>
  </section>
</template>