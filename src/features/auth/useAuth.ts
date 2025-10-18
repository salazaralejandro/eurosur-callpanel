// src/features/auth/useAuth.ts
import { computed, ref } from 'vue'

import { mundosmsApi } from '@/utils/api'

type Mode = 'disabled' | 'mock' | 'real'
const AUTH_MODE: Mode = (import.meta.env.VITE_AUTH_MODE as Mode) || 'disabled'
const REQUIRE_LOGIN = import.meta.env.VITE_REQUIRE_LOGIN === '1'

const userRef = ref<{ email: string } | null>(null)
const tokenRef = ref<string | null>(null)

export function useAuth() {
  const isAuthenticated = computed(() => {
    if (AUTH_MODE === 'disabled') return true
    return !!tokenRef.value || !!userRef.value
  })

  async function login(email: string, password: string) {
    if (AUTH_MODE === 'disabled') {
      userRef.value = { email: 'demo@eurosur.com' }
      return
    }
    if (AUTH_MODE === 'mock') {
      userRef.value = { email }
      tokenRef.value = 'mock-token'
      return
    }
    // real: aquí irá tu endpoint real de MundoSMS (cuando lo tengas)
    // Ejemplo hipotético:
    // const res = await mundosmsApi.post('auth/login', { json: { email, password } }).json<{ token: string }>()
    // tokenRef.value = res.token
    // userRef.value = { email }
    throw new Error('Auth real no disponible todavía')
  }

  function logout() {
    userRef.value = null
    tokenRef.value = null
  }

  return { isAuthenticated, user: userRef, token: tokenRef, login, logout, REQUIRE_LOGIN }
}
