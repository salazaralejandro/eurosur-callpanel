import { api } from '@/utils/api'
import { defineStore } from 'pinia'
import { isDevAuth } from '@/utils/mock'

type User = { id: number; name: string; email: string; roles?: string[] }
const LS_KEY = 'dev_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
  },
  actions: {
    async bootstrap() {
      if (isDevAuth()) {
        const raw = localStorage.getItem(LS_KEY)
        this.user = raw ? JSON.parse(raw) : null
        this.initialized = true
        return
      }
      try {
        const me = await api.get('me').json<User>()
        this.user = me
      } catch {
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    async login(email: string, _password: string) {
      if (isDevAuth()) {
        const fake: User = { id: 1, name: email.split('@')[0] || 'Usuario', email, roles: ['admin'] }
        localStorage.setItem(LS_KEY, JSON.stringify(fake))
        this.user = fake
        return
      }
      await api.post('login', { json: { email, password: _password } }).json()
      await this.bootstrap()
    },

    async logout() {
      try {
        if (isDevAuth()) {
          localStorage.removeItem(LS_KEY)
        } else {
          await api.post('logout').json().catch(() => {})
        }
      } finally {
        this.user = null
      }
    },
  },
})
