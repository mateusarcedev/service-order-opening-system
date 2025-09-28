import { useAuthStore } from '@/stores/auth';
import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/features/auth/pages/LoginView.vue') },
    { path: '/', name: 'home', component: () => import('@/features/service-orders/pages/ListView.vue'), meta: { requiresAuth: true } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth) {
    if (!auth.token) return { name: 'login', query: { redirect: to.fullPath } };
    if (!auth.user) {
      try { await auth.fetchMe(); } catch { auth.logout(); return { name: 'login', query: { redirect: to.fullPath } }; }
    }
  }
});
