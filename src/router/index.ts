import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '@/features/auth/useAuth'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/pages/Login.vue'), meta: { hideHeader: true } },
  { path: '/', name: 'dashboard', component: () => import('@/pages/Dashboard.vue'), meta: { requiresAuth: true } },
  { path: '/calls', name: 'calls-dashboard', component: () => import('@/pages/CallsDashboard.vue'), meta: { requiresAuth: true } },
  { path: '/gasoil', name: 'gasoil-dashboard', component: () => import('@/pages/GasoilDashboard.vue'), meta: { requiresAuth: true } },
  { path: '/config', name: 'config', component: () => import('@/pages/Config.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const { isAuthenticated, REQUIRE_LOGIN } = useAuth()
  const needsAuth = to.meta.requiresAuth || REQUIRE_LOGIN
  if (needsAuth && !isAuthenticated.value && to.name !== 'login') {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && isAuthenticated.value) {
    return { path: (to.query.redirect as string) || '/' }
  }
  return true
})

export default router
