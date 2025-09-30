import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/features/auth/pages/LoginView.vue') },
    { path: '/', name: 'os.list', component: () => import('@/features/service-orders/pages/ListView.vue'), meta: { requiresAuth: true } },
    { path: '/service-orders/new', name: 'os.new', component: () => import('@/features/service-orders/pages/CreateEditView.vue'), meta: { requiresAuth: true } },
    { path: '/service-orders/:id', name: 'os.detail', component: () => import('@/features/service-orders/pages/DetailView.vue'), meta: { requiresAuth: true } },
    { path: '/service-orders/:id/edit', name: 'os.edit', component: () => import('@/features/service-orders/pages/CreateEditView.vue'), meta: { requiresAuth: true } },
    { path: '/service-orders/:id/attend', name: 'os.attend', component: () => import('@/features/service-orders/pages/AttendView.vue'), meta: { requiresAuth: true } },
    { path: '/signup', name: 'signup', component: () => import('@/features/auth/pages/SignupView.vue'), meta: { public: true }, }
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.name === 'login') return true
  if (to.meta.requiresAuth) {
    if (!auth.token) return { name: 'login', query: { redirect: to.fullPath } }
    if (!auth.user) {
      try { await auth.fetchMe() } catch { auth.logout(); return { name: 'login', query: { redirect: to.fullPath } } }
    }
  }
  return true
})
