// src/features/auth/useAuth.ts
import { computed, ref } from 'vue'

type User = { email: string }

const STORAGE_KEY = 'eurosur_auth_v1'
const DEMO_EMAIL  = 'hola@grupoeurosur.es'
const DEMO_PASS   = '123123*'

const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE as 'disabled' | 'mock' | 'real') || 'disabled'
// Si quieres que el login sea obligatorio para acceder al panel,
// usa VITE_REQUIRE_LOGIN=1 (se aplica en el guard del router).
const REQUIRE_LOGIN = import.meta.env.VITE_REQUIRE_LOGIN === '1'

// --- Estado singleton (compartido por toda la app) ---
const user = ref<User | null>(null)
const token = ref<string | null>(null)

// Restaurar sesión si existe
const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
if (saved) {
  try {
    const parsed = JSON.parse(saved)
    user.value  = parsed.user ?? null
    token.value = parsed.token ?? null
  } catch { /* ignore */ }
}

// Helpers persistencia
function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: user.value, token: token.value }))
}
function clear() {
  localStorage.removeItem(STORAGE_KEY)
}

// API pública del composable
export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const normalized = email.trim().toLowerCase()

    if (AUTH_MODE === 'disabled') {
      // Sin auth real: permitir siempre (modo demo general)
      user.value  = { email: normalized || 'demo@eurosur.com' }
      token.value = 'demo-token'
      persist()
      return
    }

    if (AUTH_MODE === 'mock') {
      // Solo credenciales fijadas
      if (normalized === DEMO_EMAIL && password === DEMO_PASS) {
        user.value  = { email: DEMO_EMAIL }
        token.value = 'mock-token-eurosur'
        persist()
        return
      }
      throw new Error('Credenciales inválidas')
    }

    if (AUTH_MODE === 'real') {
      // Aquí integrarás tu API real (fetch/axios):
      // const res = await fetch('/api/login', { method:'POST', body: JSON.stringify({ email, password }) })
      // if (!res.ok) throw new Error('No se pudo iniciar sesión')
      // const { accessToken, user: profile } = await res.json()
      // user.value  = profile
      // token.value = accessToken
      // persist()
      throw new Error('Auth REAL no implementada todavía')
    }

    throw new Error('Modo de autenticación no válido')
  }

  function logout() {
    user.value  = null
    token.value = null
    clear()
  }

  return {
    // estado
    user,
    token,
    isAuthenticated,
    // config útil para vistas/guards
    AUTH_MODE,
    REQUIRE_LOGIN,
    // acciones
    login,
    logout,
  }
}

