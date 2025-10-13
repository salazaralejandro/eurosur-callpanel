<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, AlertCircle } from 'lucide-vue-next'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const onSubmit = async () => {
  loading.value = true
  error.value = null
  try {
    await auth.login(email.value, password.value)
    router.push((route.query.redirect as string) || '/')
  } catch {
    error.value = 'Credenciales inválidas'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh bg-white flex">
    <!-- Panel izquierdo - Branding -->
    <div class="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#0261F4] to-[#0251D4] relative overflow-hidden">
      <!-- Patrón decorativo -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>
      
      <!-- Contenido -->
      <div class="relative z-10 flex flex-col justify-between p-12 text-white">
        <div>
          <img src="/eurosur-logo.svg" alt="Grupo Eurosur" class="h-10 w-auto brightness-0 invert" />
        </div>
        
        <div class="max-w-md">
          <h2 class="text-4xl font-bold mb-4">
            Panel de llamadas
          </h2>
          <p class="text-lg text-blue-100">
            Gestiona y monitorea todas las llamadas de tu equipo en tiempo real con métricas actualizadas.
          </p>
        </div>
        
        <div class="text-sm text-blue-100">
          © 2025 Grupo Eurosur. Todos los derechos reservados.
        </div>
      </div>
    </div>

    <!-- Panel derecho - Formulario -->
    <div class="flex-1 flex items-center justify-center p-8 lg:p-12">
      <div class="w-full max-w-md">
        <!-- Logo móvil -->
        <div class="lg:hidden mb-8 flex justify-center">
          <img src="/eurosur-logo.svg" alt="Grupo Eurosur" class="h-8 w-auto" />
        </div>

        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-neutral-900 mb-2">
            Iniciar sesión
          </h1>
          <p class="text-neutral-600">
            Accede a tu panel de control
          </p>
        </div>

        <!-- Alert de error -->
        <div
          v-if="error"
          role="alert"
          class="mb-6 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4"
        >
          <AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div class="flex-1">
            <p class="text-sm font-medium text-red-900">Error de autenticación</p>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="onSubmit" class="space-y-6" aria-label="Formulario de acceso">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-neutral-900 mb-2">
              Correo electrónico
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-3 text-neutral-900
                     outline-none transition-colors duration-200
                     placeholder:text-neutral-400
                     hover:border-neutral-300
                     focus:border-[#0261F4] focus:ring-4 focus:ring-[#0261F4]/10
                     disabled:bg-neutral-50 disabled:cursor-not-allowed"
              placeholder="nombre@eurosur.com"
              :disabled="loading"
            />
          </div>

          <!-- Password -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="block text-sm font-medium text-neutral-900">
                Contraseña
              </label>
              <button 
                type="button"
                class="text-sm text-[#0261F4] hover:text-[#0251D4] font-medium transition-colors"
                disabled
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-3 text-neutral-900
                     outline-none transition-colors duration-200
                     placeholder:text-neutral-400
                     hover:border-neutral-300
                     focus:border-[#0261F4] focus:ring-4 focus:ring-[#0261F4]/10
                     disabled:bg-neutral-50 disabled:cursor-not-allowed"
              placeholder="Ingresa tu contraseña"
              :disabled="loading"
            />
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="loading"
            class="group w-full rounded-lg bg-[#0261F4] px-6 py-3.5 text-base font-semibold text-white
                   transition-all duration-200 flex items-center justify-center gap-2
                   hover:bg-[#0251D4] hover:shadow-xl hover:shadow-[#0261F4]/20
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0261F4]/20
                   disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#0261F4] disabled:hover:shadow-none
                   active:scale-[0.98]"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verificando credenciales...
            </span>
            <template v-else>
              <span>Iniciar sesión</span>
              <ArrowRight class="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </template>
          </button>
        </form>

        <!-- Footer info -->
        <div class="mt-8 pt-6 border-t border-neutral-200">
          <p class="text-sm text-neutral-500 text-center">
            Acceso exclusivo para personal autorizado de Grupo Eurosur
          </p>
        </div>
      </div>
    </div>
  </div>
</template>