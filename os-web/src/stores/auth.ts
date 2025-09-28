import { api } from '@/api/client';
import { defineStore } from 'pinia';

type Me = { id: string; name: string; email: string; role?: string | null };

export const useAuthStore = defineStore('auth', {
  state: () => ({ token: localStorage.getItem('token') as string | null, user: null as Me | null }),
  actions: {
    setToken(token: string | null) {
      this.token = token;
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    },
    async fetchMe() {
      const { data } = await api.get<Me>('/auth/me');
      this.user = data;
    },
    logout() { this.setToken(null); this.user = null; },
  },
});
