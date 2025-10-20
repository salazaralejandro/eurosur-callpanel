<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuth } from '@/features/auth/useAuth'

const route = useRoute()
const router = useRouter()
const { logout, user } = useAuth()

/** ÚNICO flyout: Paneles */
const panels = [
  { to: '/calls',  label: 'Panel de llamadas', description: 'KPIs, histórico y agentes' },
  { to: '/gasoil', label: 'Panel de gasoil',   description: 'Depósitos, niveles y suministros' },
]

/** Estado UI */
const mobileOpen = ref(false)
const userOpen = ref(false)
const flyoutOpen = ref(false)
const userInitial = computed(() => user.value?.email?.[0]?.toUpperCase() ?? 'U')

function handleLogout () {
  logout()
  router.replace('/login')
}
function closeAll() {
  mobileOpen.value = false
  userOpen.value = false
  flyoutOpen.value = false
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeAll()
}

/** Atajos: g c (calls), g g (gasoil) */
let sequence = ''
function shortcuts(e: KeyboardEvent) {
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
  sequence += e.key.toLowerCase()
  setTimeout(() => { sequence = '' }, 600)
  if (sequence.endsWith('gc')) router.push('/calls')
  if (sequence.endsWith('gg')) router.push('/gasoil')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('keydown', shortcuts)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('keydown', shortcuts)
})

/** Helpers */
function linkClasses(isActive: boolean) {
  return [
    'rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500',
    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
  ].join(' ')
}
function isCurrent(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-slate-200"
          style="background-color: var(--color-slate-50)">
    <div class="mx-auto max-w-[1800px] px-4 sm:px-6">
      <div class="flex h-16 items-center justify-center relative">
        <!-- Logo centrado -->
        <RouterLink 
          to="/"
          class="absolute left-1/2 -translate-x-1/2 inline-flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
          aria-label="Ir al inicio"
        >
          <img src="/eurosur-logo.svg" class="h-9 w-auto" alt="Grupo Eurosur" />
        </RouterLink>

        <!-- Navegación izquierda con ÚNICO flyout -->
        <nav class="absolute left-0 hidden md:flex items-stretch gap-1">
          <!-- Botón Paneles -->
          <div class="relative" @mouseleave="flyoutOpen = false">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900
                     focus:outline-none focus:ring-2 focus:ring-blue-500 inline-flex items-center gap-2"
              @mouseenter="flyoutOpen = true"
              @focus="flyoutOpen = true"
              @click="flyoutOpen = !flyoutOpen"
              :aria-expanded="flyoutOpen"
              aria-haspopup="menu"
            >
              Paneles
              <svg class="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
              </svg>
            </button>

            <!-- Flyout -->
            <transition
              enter-active-class="transition ease-out duration-150"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-100"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-if="flyoutOpen"
                class="absolute left-0 mt-2 w-[340px] rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 p-2"
                role="menu"
                @mouseenter="flyoutOpen = true"
                @mouseleave="flyoutOpen = false"
              >
                <ul class="grid gap-1">
                  <li v-for="item in panels" :key="item.to">
                    <RouterLink :to="item.to" custom v-slot="{ href, navigate }">
                      <a
                        :href="href"
                        @click="navigate"
                        class="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        role="menuitem"
                        :class="isCurrent(item.to) ? 'bg-blue-50 ring-1 ring-blue-100' : ''"
                      >
                        <div class="mt-0.5 h-2.5 w-2.5 rounded-full"
                             :class="isCurrent(item.to) ? 'bg-blue-500' : 'bg-slate-300'"></div>
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-slate-800 truncate">{{ item.label }}</p>
                          <p v-if="item.description" class="text-xs text-slate-500 truncate">{{ item.description }}</p>
                        </div>
                      </a>
                    </RouterLink>
                  </li>
                </ul>
              </div>
            </transition>
          </div>
        </nav>

        <!-- Menú usuario a la derecha -->
        <div class="absolute right-0 flex items-center gap-2">
          <div class="relative">
            <button
              class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700
                     hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="userOpen = !userOpen"
              :aria-expanded="userOpen"
              aria-haspopup="menu"
              aria-label="Menú de usuario"
            >
              {{ userInitial }}
            </button>

            <div
              v-if="userOpen"
              class="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 overflow-hidden"
              role="menu"
            >
              <div class="px-4 py-3 text-sm">
                <p class="font-medium text-slate-800">Sesión</p>
                <p class="mt-0.5 text-slate-500 truncate">{{ user?.email ?? '—' }}</p>
              </div>
              <div class="h-px bg-slate-200"></div>
              <RouterLink
                to="/config"
                class="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700"
                role="menuitem"
                @click="closeAll"
              >
                Configuración
              </RouterLink>
              <div class="h-px bg-slate-200"></div>
              <button
                class="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                role="menuitem"
                @click="handleLogout"
              >
                Salir
              </button>
            </div>
          </div>

          <!-- Hamburguesa -->
          <button
            class="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-700
                   hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="mobileOpen = !mobileOpen"
            :aria-expanded="mobileOpen"
            aria-controls="mobile-nav"
            aria-label="Abrir menú"
          >
            <svg v-if="!mobileOpen" class="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile nav -->
      <div v-show="mobileOpen" id="mobile-nav" class="md:hidden pb-3">
        <nav class="mt-1 grid gap-1">
          <span class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paneles</span>
          <RouterLink
            v-for="item in panels"
            :key="item.to"
            :to="item.to"
            class="rounded-lg px-4 py-2 text-base font-semibold text-slate-800 hover:bg-slate-100 hover:text-slate-900"
            :class="isCurrent(item.to) ? 'bg-blue-50 text-blue-700' : ''"
            @click="mobileOpen = false"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </div>
  </header>
</template>
