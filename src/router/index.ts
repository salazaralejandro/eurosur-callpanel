// src/router/index.ts (ejemplo)
import { createRouter, createWebHistory } from 'vue-router'

import { useAuth } from '@/features/auth/useAuth'

const routes = [
  { path: '/login', component: () => import('@/pages/Login.vue') },
  { path: '/', component: () => import('@/pages/Dashboard.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to, _from, next) => {
  const { isAuthenticated, REQUIRE_LOGIN } = useAuth()
  if (to.meta.requiresAuth && REQUIRE_LOGIN) {
    if (!isAuthenticated.value) return next('/login')
  }
  next()
})

export default router
