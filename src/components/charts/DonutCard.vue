<template>
  <div class="card">
    <VueApexCharts
      ref="apexRef"
      type="donut"
      :options="chartOptions"
      :series="series"
      :height="cHeight"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref, watch, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'

const props = defineProps<{
  title?: string
  labels?: string[]
  series: number[]
  height?: number
}>()

const apexRef = ref<InstanceType<typeof VueApexCharts> | null>(null)
const cHeight = computed(() => props.height ?? 260)
const isDark = ref<boolean>(document.documentElement.classList.contains('dark'))
let mo: MutationObserver | null = null

const chartOptions = reactive<ApexOptions>({
  labels: props.labels ?? [],
  chart: { background: 'transparent' },
  legend: { position: 'bottom' },
  dataLabels: { enabled: true },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
  theme: { mode: isDark.value ? 'dark' : 'light' },
  stroke: { width: 0 },
})

const updateTheme = () => {
  apexRef.value?.updateOptions?.({
    theme: { mode: isDark.value ? 'dark' : 'light' },
    tooltip: { theme: isDark.value ? 'dark' : 'light' },
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

// Por si cambian labels desde fuera:
watch(() => props.labels, (labels) => {
  if (labels) apexRef.value?.updateOptions?.({ labels })
})
const series = computed(() => props.series)
</script>
