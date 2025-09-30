<script setup lang="ts">
import { login } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)

async function submit() {
  errorMsg.value = null
  loading.value = true
  try {
    const { accessToken } = await login({ email: email.value, password: password.value })
    auth.setToken(accessToken)
    await auth.fetchMe().catch(() => {})
    router.replace((route.query.redirect as string) || '/')
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message ?? 'Falha no login'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/20 p-4">
    <Card class="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse o sistema de OS</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="submit">
          <div class="space-y-2">
            <Label for="email">E-mail</Label>
            <Input id="email" v-model="email" type="email" placeholder="admin@example.com" />
          </div>
          <div class="space-y-2">
            <Label for="password">Senha</Label>
            <Input id="password" v-model="password" type="password" placeholder="••••••••" />
          </div>
          <p v-if="errorMsg" class="text-sm text-destructive">{{ errorMsg }}</p>
          <Button class="w-full" type="submit" :disabled="loading">
            <span v-if="loading">Entrando…</span>
            <span v-else>Entrar</span>
          </Button>
          <div class="text-sm text-muted-foreground text-center mt-2">
            Não tem conta?
            <RouterLink class="underline" to="/signup">Criar conta</RouterLink>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
