<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value?: number | string
  loading?: boolean
  hint?: string
  icon?: Component
  delta?: number | null
  deltaLabel?: string
  positiveIsGood?: boolean
}>()
</script>

<template>
  <section
    class="group relative rounded-xl border border-neutral-200 bg-white p-6 shadow-sm 
           transition-all duration-200 hover:shadow-md hover:border-neutral-300"
    role="status"
    aria-live="polite"
  >
    <!-- Header con label e ícono -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <p class="text-sm font-medium text-neutral-600">{{ label }}</p>
      </div>
      
      <!-- Ícono opcional -->
      <div 
        v-if="icon"
        class="rounded-lg bg-[#0261F4]/10 p-2 transition-colors duration-200 
               group-hover:bg-[#0261F4]/15"
      >
        <component :is="icon" class="h-5 w-5 text-[#0261F4]" aria-hidden="true" />
      </div>
    </div>

    <!-- Valor principal -->
    <div class="mb-2">
      <div v-if="!loading" class="text-4xl font-bold text-neutral-900 tabular-nums tracking-tight">
        {{ value ?? '—' }}
      </div>
      <div v-else class="flex items-center gap-2">
        <div class="h-10 w-24 rounded-lg bg-neutral-100 animate-pulse"></div>
      </div>
    </div>

    <!-- Hint y delta -->
    <div class="flex items-center justify-between gap-2">
      <p v-if="hint" class="text-xs text-neutral-500">
        {{ hint }}
      </p>

      <!-- Delta indicator -->
      <div 
        v-if="delta !== null && delta !== undefined && !loading"
        class="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
        :class="[
          delta > 0 
            ? positiveIsGood 
              ? 'bg-emerald-50 text-emerald-700' 
              : 'bg-red-50 text-red-700'
            : delta < 0
              ? positiveIsGood
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-50 text-emerald-700'
              : 'bg-neutral-100 text-neutral-600'
        ]"
      >
        <svg 
          v-if="delta !== 0"
          class="h-3 w-3" 
          :class="delta < 0 && 'rotate-180'"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        <span>{{ delta > 0 ? '+' : '' }}{{ delta }}</span>
        <span v-if="deltaLabel" class="opacity-70">{{ deltaLabel }}</span>
      </div>
    </div>

    <!-- Barra de progreso sutil en hover (opcional decorativa) -->
    <div class="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
      <div class="h-full bg-gradient-to-r from-[#0261F4]/20 via-[#0261F4]/40 to-[#0261F4]/20"></div>
    </div>
  </section>
</template>