<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <header class="w-full bg-white border-b px-6 py-3 flex items-center justify-between">
    <h1 class="text-lg font-semibold">OS System</h1>

    <div v-if="auth.user" class="flex items-center gap-4">
      <div class="text-sm text-gray-700">
        {{ auth.user.name }} ({{ auth.user.role ?? 'USER' }})
      </div>
      <button
        class="px-3 py-1 rounded-md border hover:bg-gray-100"
        @click="handleLogout"
      >
        Sair
      </button>
    </div>
  </header>
</template>
