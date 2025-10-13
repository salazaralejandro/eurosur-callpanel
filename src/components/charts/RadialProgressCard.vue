<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'

interface Props {
  title: string
  value: number
  max?: number
  height?: number
  unit?: string
  color?: string
  label?: string
  showPercentage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: 420,
  color: '#0261F4',
  label: 'Progreso',
  showPercentage: true
})

const apexRef = ref<InstanceType<typeof VueApexCharts> | null>(null)
const isDark = ref(document.documentElement.classList.contains('dark'))

let observer: MutationObserver | null = null

const maxValue = computed(() => props.max ?? Math.max(props.value, 10))
const percentage = computed(() => Math.min(100, Math.round((props.value / maxValue.value) * 100)))

const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'radialBar',
    background: 'transparent',
    toolbar: { show: false }
  },
  theme: {
    mode: isDark.value ? 'dark' : 'light'
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '65%'
      },
      track: {
        background: isDark.value ? 'rgba(255, 255, 255, 0.08)' : 'rgba(2, 97, 244, 0.08)',
        strokeWidth: '100%'
      },
      dataLabels: {
        name: {
          show: false
        },
        value: {
          show: props.showPercentage,
          fontSize: '48px',
          fontWeight: 700,
          color: isDark.value ? '#fff' : '#111827',
          offsetY: 8,
          formatter: (val: number) => `${Math.round(val)}%`
        }
      }
    }
  },
  labels: [props.label],
  colors: [props.color],
  stroke: {
    lineCap: 'round'
  }
}))

const series = computed(() => [percentage.value])

onMounted(() => {
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        isDark.value = document.documentElement.classList.contains('dark')
      }
    })
  })
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

watch(isDark, () => {
  apexRef.value?.updateOptions(chartOptions.value, false, true)
}, { flush: 'post' })
</script>

<template>
  <div
    class="rounded-[1.2vw] ring-1 p-[1.2vw] transition-colors duration-200
           bg-white ring-neutral-200 shadow-sm
           dark:bg-white/5 dark:ring-white/10"
  >
    <div class="flex items-baseline justify-between mb-[0.8vw]">
      <h3 class="text-[1.2vw] font-semibold text-neutral-900 dark:text-white truncate">
        {{ title }}
      </h3>
      <div class="text-[0.95vw] font-medium text-neutral-600 dark:text-white/70 whitespace-nowrap ml-2">
        {{ value.toLocaleString() }}<span v-if="unit" class="text-neutral-500 dark:text-white/50">&nbsp;{{ unit }}</span>
      </div>
    </div>

    <div class="relative">
      <VueApexCharts
        ref="apexRef"
        type="radialBar"
        :options="chartOptions"
        :series="series"
        :height="height"
      />
    </div>
  </div>
</template>