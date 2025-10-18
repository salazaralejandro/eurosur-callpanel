<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/features/auth/useAuth'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

// ENV flags (build-time)
const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE as 'disabled'|'mock'|'real') || 'disabled'
const REQUIRE_LOGIN = import.meta.env.VITE_REQUIRE_LOGIN === '1'

// UI state
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref<string | null>(null)

// Mostrar botón de demo si el modo no es "real" o no se requiere login
const showDemoButton = computed(() => AUTH_MODE !== 'real' || !REQUIRE_LOGIN)

// Helpers
function validate(): string | null {
  if (!email.value.trim()) return 'El correo es obligatorio.'
  // validación simple de email
  if (!/^\S+@\S+\.\S+$/.test(email.value)) return 'Introduce un correo válido.'
  if (!password.value.trim()) return 'La contraseña es obligatoria.'
  return null
}

async function onSubmit() {
  errorMsg.value = null
  const v = validate()
  if (v) {
    errorMsg.value = v
    return
  }
  loading.value = true
  try {
    await login(email.value.trim(), password.value)
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch (err: any) {
    errorMsg.value = err?.message || 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}

async function enterDemo() {
  errorMsg.value = null
  loading.value = true
  try {
    // Cualquier credencial “dummy” servirá en modos disabled/mock
    await login('demo@eurosur.com', 'demo')
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch (err: any) {
    errorMsg.value = err?.message || 'No se pudo iniciar el modo demo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh grid md:grid-cols-2">
    <!-- LADO IZQUIERDO (branding) -->
    <aside
      class="hidden md:flex flex-col justify-between p-8 text-white"
      style="background: radial-gradient(120% 120% at 0% 0%, #2B7BFF 0%, #0261F4 45%, #0B2C67 100%);"
    >
      <header class="flex items-center gap-3">
        <img src="/eurosur-logo.svg" alt="Grupo Eurosur" class="h-8 w-auto" />
      </header>

      <div class="max-w-md">
        <h1 class="text-3xl font-semibold leading-tight">Panel de llamadas</h1>
        <p class="mt-3 text-white/85">
          Gestiona y monitorea todas las llamadas de tu equipo en tiempo real con métricas actualizadas.
        </p>
      </div>

      <footer class="text-sm text-white/70">
        © 2025 Grupo Eurosur. Todos los derechos reservados.
      </footer>
    </aside>

    <!-- LADO DERECHO (formulario) -->
    <main class="flex items-center justify-center p-6 md:p-10">
      <div class="w-full max-w-md">
        <div class="mb-8">
          <h2 class="text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
          <p class="mt-2 text-sm text-neutral-500">
            Accede a tu panel de control
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit" novalidate>
          <!-- Correo -->
          <div class="space-y-1.5">
            <label for="email" class="block text-sm font-medium">Correo electrónico</label>
            <input
              id="email"
              v-model="email"
              type="email"
              inputmode="email"
              autocomplete="username"
              placeholder="nombre@eurosur.com"
              class="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#0261F4] focus:border-[#0261F4]"
              :disabled="loading"
            />
          </div>

          <!-- Contraseña -->
          <div class="space-y-1.5">
            <label for="password" class="block text-sm font-medium">Contraseña</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Ingresa tu contraseña"
                class="w-full rounded-xl border border-neutral-300 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-[#0261F4] focus:border-[#0261F4]"
                :disabled="loading"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm text-neutral-500 hover:text-neutral-800"
                @click="showPassword = !showPassword"
                :aria-pressed="showPassword"
                :disabled="loading"
              >
                {{ showPassword ? 'Ocultar' : 'Ver' }}
              </button>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-neutral-400">¿Olvidaste tu contraseña?</span>
            </div>
          </div>

          <!-- Error -->
          <p v-if="errorMsg" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {{ errorMsg }}
          </p>

          <!-- Botón iniciar sesión -->
          <button
            type="submit"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0261F4] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#0251D4] disabled:opacity-60"
            :disabled="loading"
          >
            <span v-if="!loading">Iniciar sesión</span>
            <span v-else>Cargando…</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center gap-3">
          <div class="h-px flex-1 bg-neutral-200"></div>
          <span class="text-xs text-neutral-400">o</span>
          <div class="h-px flex-1 bg-neutral-200"></div>
        </div>

        <!-- Botón Demo / Bypass -->
        <button
          v-if="showDemoButton"
          type="button"
          @click="enterDemo"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
          :disabled="loading"
          title="Entrar sin autenticar (modo demo)"
        >
          Entrar en modo demo
        </button>

        <!-- Nota de acceso -->
        <p class="mt-6 text-center text-xs text-neutral-400">
          Acceso exclusivo para personal autorizado de Grupo Eurosur.
        </p>
      </div>
    </main>
  </div>
</template>
