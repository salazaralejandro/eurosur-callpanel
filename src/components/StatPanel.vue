<script setup lang="ts">
import { computed, defineProps } from 'vue'
import type { Component } from 'vue'

const props = defineProps<{
  title: string
  value: number | string | null | undefined
  loading?: boolean
  hint?: string
  icon?: Component
  delta?: number | null
  deltaLabel?: string
  positiveIsGood?: boolean
  size?: 'default' | 'tv'
}>()

const size = computed(() => props.size ?? 'default')

const numberClass = computed(() =>
  size.value === 'tv'
    ? 'text-[clamp(3rem,10vw,10rem)]'
    : 'text-[clamp(2.5rem,6vw,5rem)]'
)

const trend = computed(() => {
  if (props.delta == null) return null
  if (props.delta === 0) return 'neutral'
  const good = props.positiveIsGood ?? true
  const positive = props.delta > 0
  return positive === good ? 'good' : 'bad'
})

const chipClass = computed(() => {
  if (!trend.value) return 'bg-white/10 text-white/70 dark:bg-white/10 dark:text-white/70'
  if (trend.value === 'good') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
  return 'bg-red-500/15 text-red-600 dark:text-red-300'
})

const displayValue = computed(() => (props.loading ? '–' : props.value ?? '–'))
</script>

<template>
  <div
    class="rounded-[1.2vw] ring-1 p-[1.6vw]
           bg-white ring-neutral-200 shadow-sm
           dark:bg-white/5 dark:ring-white/10"
  >
    <div class="flex items-center justify-between mb-[0.8vw]">
      <div class="flex items-center gap-[0.6vw]">
        <div class="rounded-[0.8vw] bg-[#0261F4]/20 p-[0.7vw]">
          <component v-if="icon" :is="icon" class="h-[1.6vw] w-[1.6vw] text-[#0261F4]" />
        </div>
        <h3 class="text-[1vw] font-medium text-neutral-900 dark:text-white/80">
          {{ title }}
        </h3>
      </div>

      <span v-if="delta != null"
        class="text-[0.85vw] px-[0.6vw] py-[0.25vw] rounded-full select-none"
        :class="chipClass"
      >
        {{ delta > 0 ? `+${delta}` : `${delta}` }}
        <template v-if="deltaLabel"> · {{ deltaLabel }}</template>
      </span>
    </div>

    <div class="leading-none tracking-tight">
      <span class="block font-bold tabular-nums" :class="numberClass">
        {{ displayValue }}
      </span>
    </div>

    <p v-if="hint" class="mt-[0.6vw] text-[0.95vw] text-neutral-500 dark:text-white/60">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.tabular-nums { font-variant-numeric: tabular-nums; }
</style>
