import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/store/auth'

const Login = () => import('@/pages/Login.vue')
const Dashboard = () => import('@/pages/Dashboard.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login, meta: { public: true } },
    { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) await auth.bootstrap() // intenta /api/me
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'dashboard' }
})

export default router
