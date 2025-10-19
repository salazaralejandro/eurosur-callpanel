<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const showHeader = computed(() => route.meta?.hideHeader !== true)
</script>

<template>
  <div class="min-h-dvh w-full bg-slate-50 text-slate-900">
    <AppHeader v-if="showHeader" />
    <RouterView />
  </div>
</template>
