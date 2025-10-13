<template>
  <div class="card">
    <VueApexCharts
      ref="apexRef"
      type="radialBar"
      :options="chartOptions"
      :series="[percent]"
      :height="cHeight"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'

const props = defineProps<{
  value: number
  max?: number
  height?: number
  unit?: string
}>()

const apexRef = ref<InstanceType<typeof VueApexCharts> | null>(null)
const cHeight = computed(() => props.height ?? 260)
const isDark = ref<boolean>(document.documentElement.classList.contains('dark'))
let mo: MutationObserver | null = null

const maxV = computed(() => props.max ?? Math.max(props.value, 10))
const percent = computed(() => {
  const p = (props.value / maxV.value) * 100
  return Number.isFinite(p) ? Math.max(0, Math.min(100, Math.round(p))) : 0
})

const chartOptions = reactive<ApexOptions>({
  chart: { background: 'transparent', sparkline: { enabled: true } },
  plotOptions: {
    radialBar: {
      hollow: { size: '70%' },
      track: { background: isDark.value ? '#1f2937' : '#f3f4f6' },
      dataLabels: {
        name: { show: false },
        value: {
          formatter: (val: number) => `${Math.round(val)}${props.unit ?? '%'}`,
        },
      },
    },
  },
  tooltip: { enabled: false },
  theme: { mode: isDark.value ? 'dark' : 'light' },
})

const updateTheme = () => {
  apexRef.value?.updateOptions?.({
    theme: { mode: isDark.value ? 'dark' : 'light' },
    plotOptions: {
      radialBar: {
        track: { background: isDark.value ? '#1f2937' : '#f3f4f6' },
      },
    },
  } as ApexOptions, false, true)
}

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
onBeforeUnmount(() => mo?.disconnect())
</script>
