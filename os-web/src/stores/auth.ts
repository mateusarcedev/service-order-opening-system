import { api } from '@/api/client';
import { defineStore } from 'pinia';

export type Me = { id: string; name: string; email: string; role?: string | null }

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: (localStorage.getItem('token') as string | null) ?? null,
    user: ((): Me | null => {
      const raw = localStorage.getItem('user')
      return raw ? (JSON.parse(raw) as Me) : null
    })(),
  }),
  actions: {
    setToken(token: string | null) {
      this.token = token
      if (token) localStorage.setItem('token', token)
      else localStorage.removeItem('token')
    },
    async fetchMe() {
      const { data } = await api.get<Me>('/auth/me')
      this.user = data
      localStorage.setItem('user', JSON.stringify(data))
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})
