<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  value?: number | string
  hint?: string
  loading?: boolean
  icon: Component          // p.ej. PhoneIncoming de lucide-vue-next
  delta?: number | null    // variación (ej. +5, -2). Si no hay, no se muestra
  deltaLabel?: string      // “vs. ayer”, “últ. 30 min”, etc.
  positiveIsGood?: boolean // por defecto true: verde si delta>0
}>(), {
  loading: false,
  delta: null,
  deltaLabel: '',
  positiveIsGood: true,
})

const fmt = (v?: number | string) => v ?? '—'
const deltaClass = () => {
  if (props.delta == null) return ''
  const up = props.delta > 0
  const good = props.positiveIsGood ? up : !up
  return good ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
              : 'text-red-600 bg-red-50 border-red-200'
}
</script>

<template>
  <section
    class="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
    role="status"
    aria-live="polite"
  >
    <div class="flex items-center gap-3">
      <div class="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 bg-neutral-50">
        <component :is="icon" class="h-5 w-5 text-neutral-700" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h3 class="truncate text-sm font-medium text-neutral-600">{{ title }}</h3>
        <p v-if="hint" class="text-xs text-neutral-400">{{ hint }}</p>
      </div>
      <div class="ml-auto text-3xl font-semibold tabular-nums tracking-tight">
        <span v-if="!loading">{{ fmt(value) }}</span>
        <span v-else class="inline-block animate-pulse">···</span>
      </div>
    </div>

    <div v-if="delta !== null" class="mt-3">
      <span class="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs"
            :class="deltaClass()">
        <span>{{ delta > 0 ? '▲' : (delta < 0 ? '▼' : '•') }}</span>
        <span>{{ delta }}</span>
        <span v-if="deltaLabel" class="text-neutral-500">· {{ deltaLabel }}</span>
      </span>
    </div>
  </section>
</template>
