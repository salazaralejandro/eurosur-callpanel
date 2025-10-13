<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

defineProps<{
  title: string
  subtitle?: string
  labels: string[]
  series: number[]
  height?: number
}>()

const apexRef = ref<InstanceType<typeof VueApexCharts> | null>(null)
const isDark = ref<boolean>(document.documentElement.classList.contains('dark'))
let mo: MutationObserver | null = null

onMounted(() => {
  mo = new MutationObserver(() => {
    const nowDark = document.documentElement.classList.contains('dark')
    if (nowDark !== isDark.value) {
      isDark.value = nowDark
      updateTheme()
    }
  })
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => { mo?.disconnect() })

const state = reactive({
  options: {
    chart: {
      type: 'donut',
      background: 'transparent',
      toolbar: { show: false }
    },
    theme: { mode: isDark.value ? 'dark' : 'light' },
    labels: [] as string[],
    legend: {
      position: 'right',
      fontSize: '16px',
      labels: { colors: undefined },
      markers: { radius: 12 },
      itemMargin: { vertical: 8 }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${Math.round(val)}%`,
      style: { fontSize: '16px' }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: { show: true, fontSize: '18px' },
            value: { show: true, fontSize: '28px', formatter: (v: string) => v },
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              formatter: (w: any) => {
                const s = w.globals.seriesTotals?.reduce((a: number, b: number) => a + b, 0) || 0
                return String(s)
              }
            }
          }
        }
      }
    },
    colors: ['#0261F4', '#A3A3A3', '#10B981', '#F59E0B'],
    stroke: { width: 2 }
  } as any,
  seriesInternal: [] as number[]
})

const updateTheme = () => {
  state.options = {
    ...state.options,
    theme: { mode: isDark.value ? 'dark' : 'light' },
    legend: {
      ...state.options.legend,
      labels: { colors: isDark.value ? '#E5E7EB' : '#374151' }
    }
  }
}

watch(isDark, updateTheme, { immediate: true })
</script>

<template>
  <div
    class="rounded-[1.2vw] ring-1 p-[1.2vw]
           bg-white ring-neutral-200 shadow-sm
           dark:bg-white/5 dark:ring-white/10"
  >
    <div class="flex items-baseline justify-between mb-[0.8vw]">
      <div>
        <h3 class="text-[1.2vw] font-semibold text-neutral-900 dark:text-white">{{ title }}</h3>
        <p v-if="subtitle" class="text-[0.95vw] text-neutral-500 dark:text-white/60">{{ subtitle }}</p>
      </div>
    </div>

    <VueApexCharts
      ref="apexRef"
      type="donut"
      :options="{ ...state.options, labels }"
      :series="series"
      :height="height ?? 420"
    />
  </div>
</template>
