<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuth } from '@/features/auth/useAuth'

const route = useRoute()
const router = useRouter()
const { logout, user } = useAuth()

/** Nav items centralizados (fácil de extender) */
const nav = [
  { to: '/', label: 'Inicio', exact: true },
  { to: '/calls', label: 'Llamadas' },
  { to: '/gasoil', label: 'Gasoil' }
]

/** Helpers de estado */
const mobileOpen = ref(false)
const userOpen = ref(false)
const userInitial = computed(() => user.value?.email?.[0]?.toUpperCase() ?? 'U')

function handleLogout () {
  logout()
  router.replace('/login')
}

/** Cerrar menús en navegación y clic fuera */
function closeAll() {
  mobileOpen.value = false
  userOpen.value = false
}

/** Accesibilidad: ESC para cerrar menús */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeAll()
}

/** Atajos de teclado: g c (calls), g g (gasoil) */
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

/** Clases de enlace (activo/inactivo) accesibles */
function linkClasses(isActive: boolean) {
  return [
    'rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500',
    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  ].join(' ')
}

/** Mostrar/ocultar separador activo en desktop */
function isPathActive(to: string, exact = false) {
  return exact ? route.path === to : route.path.startsWith(to)
}
</script>

<template>
  <header class="sticky top-0 z-20 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
    <div class="mx-auto max-w-[1800px] px-4 sm:px-6">
      <div class="flex h-16 items-center justify-between gap-4">
        
        <div class="flex items-center gap-4">
          <RouterLink to="/" class="inline-flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">
            <img src="/eurosur-logo.svg" class="h-9 w-auto" alt="Grupo Eurosur" />
            <span class="hidden md:inline text-lg font-medium text-slate-700">Panel de control</span>
          </RouterLink>
        </div>

        <nav class="hidden md:flex items-center gap-2"> <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            custom
            v-slot="{ href, navigate, isActive }"
          >
            <a
              :href="href"
              @click="navigate"
              :class="linkClasses(isActive)"
              :aria-current="isActive ? 'page' : undefined"
            >
              {{ item.label }}
            </a>
          </RouterLink>
        </nav>

        <div class="flex items-center gap-2">
          
          <div class="hidden lg:block text-xs text-slate-400 mr-2 select-none" title="Atajos: g c (Llamadas), g g (Gasoil)">
            Atajos: <kbd class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">g</kbd><kbd class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 ml-0.5">c</kbd>,
            <kbd class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 ml-1">g</kbd><kbd class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 ml-0.5">g</kbd>
          </div>

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
                to="/"
                class="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700"
                role="menuitem"
                @click="closeAll"
              >
                Ir al inicio
              </RouterLink>
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

          <button
            class="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600
                   hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div
        v-show="mobileOpen"
        id="mobile-nav"
        class="md:hidden pb-3"
      >
        <nav class="mt-1 grid gap-1">
          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="rounded-lg px-4 py-2 text-base font-semibold"
            :class="isPathActive(item.to, item.exact) ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'"
            :aria-current="isPathActive(item.to, item.exact) ? 'page' : undefined"
            @click="mobileOpen = false"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </div>
  </header>
</template>