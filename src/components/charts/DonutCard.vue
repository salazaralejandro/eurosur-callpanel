<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  title: string
  labels: string[]
  series: number[]
  height?: number
  subtitle?: string
}>(), { height: 280, subtitle: '' })

const total = computed(() => props.series.reduce((a, b) => a + b, 0))

// Calcular porcentajes
const percentages = computed(() => 
  props.series.map(value => total.value > 0 ? Math.round((value / total.value) * 100) : 0)
)

const options = computed(() => ({
  chart: {
    type: 'donut',
    toolbar: { show: false },
    animations: { 
      enabled: true,
      easing: 'easeinout', 
      speed: 400,
      animateGradually: { enabled: true, delay: 150 },
      dynamicAnimation: { enabled: true, speed: 350 }
    },
    fontFamily: 'Inter, ui-sans-serif, system-ui',
  },
  colors: ['#0261F4', '#60A5FA', '#93C5FD', '#DBEAFE'],
  labels: props.labels,
  legend: {
    show: false,
  },
  dataLabels: {
    enabled: false,
    dropShadow: { enabled: false },
  },
  stroke: { 
    width: 2,
    colors: ['#ffffff']
  },
  grid: { padding: { top: 0, right: 0, bottom: 0, left: 0 } },
  plotOptions: {
    pie: {
      expandOnClick: false,
      donut: {
        size: '75%',
        background: 'transparent',
        labels: {
          show: true,
          name: { 
            show: true, 
            offsetY: 20, 
            color: '#6B7280', 
            fontSize: '13px',
            fontWeight: 500
          },
          value: {
            show: true,
            fontSize: '32px',
            fontWeight: 700,
            color: '#0261F4',
            offsetY: -10,
            formatter: (v: string) => v
          },
          total: {
            show: true,
            label: props.subtitle || 'Total',
            fontSize: '13px',
            color: '#6B7280',
            fontWeight: 500,
            formatter: () => String(total.value)
          }
        }
      }
    }
  },
  tooltip: {
    theme: 'light',
    style: {
      fontSize: '13px',
      fontFamily: 'Inter, ui-sans-serif, system-ui'
    },
    y: {
      formatter: (val: number) => `${val} llamadas`
    }
  },
  states: {
    hover: {
      filter: {
        type: 'darken',
        value: 0.15,
      }
    },
    active: {
      filter: {
        type: 'none',
      }
    }
  },
  responsive: [
    { 
      breakpoint: 640, 
      options: { 
        plotOptions: { 
          pie: { 
            donut: { 
              size: '70%',
              labels: {
                value: { fontSize: '28px' }
              }
            } 
          } 
        },
        dataLabels: { enabled: false } 
      } 
    }
  ]
}))
</script>

<template>
  <section class="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-neutral-300">
    <!-- Header -->
    <div class="mb-1 flex items-start justify-between">
      <div class="flex-1">
        <h3 class="text-base font-semibold text-neutral-900">{{ title }}</h3>
        <p v-if="subtitle" class="text-sm text-neutral-500 mt-0.5">{{ subtitle }}</p>
      </div>
      <div class="rounded-lg bg-[#0261F4]/10 p-2 transition-colors duration-200 group-hover:bg-[#0261F4]/15">
        <TrendingUp class="h-5 w-5 text-[#0261F4]" aria-hidden="true" />
      </div>
    </div>

    <!-- Gráfico -->
    <div class="my-4">
      <apexchart
        type="donut"
        :height="height"
        :options="options"
        :series="series"
        aria-label="Gráfico de distribución de llamadas"
      />
    </div>

    <!-- Leyenda mejorada -->
    <div class="space-y-3 pt-4 border-t border-neutral-100">
      <div 
        v-for="(label, i) in labels" 
        :key="label" 
        class="flex items-center justify-between gap-3 group/item"
      >
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <span 
            class="h-3 w-3 rounded-full flex-shrink-0 ring-2 ring-offset-1 transition-all duration-200 group-hover/item:ring-offset-2" 
            :style="{ 
              background: options.colors[i],
              ringColor: options.colors[i] + '40'
            }"
          ></span>
          <span class="text-sm text-neutral-700 font-medium truncate">{{ label }}</span>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <span class="text-sm font-semibold text-neutral-900 tabular-nums">{{ series[i] }}</span>
          <span 
            class="text-xs font-medium tabular-nums px-2 py-0.5 rounded-full"
            :style="{ 
              background: options.colors[i] + '15',
              color: options.colors[i]
            }"
          >
            {{ percentages[i] }}%
          </span>
        </div>
      </div>
    </div>

    <!-- Barra decorativa en hover -->
    <div class="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
      <div class="h-full bg-gradient-to-r from-[#0261F4]/20 via-[#0261F4]/40 to-[#0261F4]/20"></div>
    </div>
  </section>
</template>