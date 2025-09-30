<script setup lang="ts">
import { register, type Role } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const role = ref<Role>('VIEWER')
const loading = ref(false)
const errorMsg = ref<string | null>(null)

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'TECH', label: 'Técnico' },
  { value: 'VIEWER', label: 'Leitor' },
]

async function submit() {
  errorMsg.value = null
  if (password.value !== confirm.value) {
    errorMsg.value = 'As senhas não conferem'
    return
  }
  loading.value = true
  try {
    const { accessToken } = await register({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      role: role.value,
    })
    auth.setToken(accessToken)
    await auth.fetchMe().catch(() => {})
    toast.success('Conta criada com sucesso')
    router.replace((route.query.redirect as string) || '/')
  } catch (e: any) {
    const msg = e?.response?.data?.message ?? 'Falha ao criar conta'
    errorMsg.value = Array.isArray(msg) ? msg.join(', ') : msg
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/20 p-4">
    <Card class="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Cadastre-se para acessar o sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="submit">
          <div class="space-y-2">
            <Label for="name">Nome</Label>
            <Input id="name" v-model="name" type="text" placeholder="Seu nome" />
          </div>

          <div class="space-y-2">
            <Label for="email">E-mail</Label>
            <Input id="email" v-model="email" type="email" placeholder="voce@exemplo.com" />
          </div>

          <div class="space-y-2">
            <Label for="role">Perfil</Label>
            <select id="role" v-model="role" class="w-full border rounded-md px-3 py-2 text-sm">
              <option v-for="opt in ROLE_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <p class="text-xs text-muted-foreground">Escolha o tipo de acesso (Admin não disponível aqui).</p>
          </div>

          <div class="space-y-2">
            <Label for="password">Senha</Label>
            <Input id="password" v-model="password" type="password" placeholder="••••••••" />
          </div>

          <div class="space-y-2">
            <Label for="confirm">Confirmar senha</Label>
            <Input id="confirm" v-model="confirm" type="password" placeholder="••••••••" />
          </div>

          <p v-if="errorMsg" class="text-sm text-destructive">{{ errorMsg }}</p>

          <Button class="w-full" type="submit" :disabled="loading">
            <span v-if="loading">Criando…</span>
            <span v-else>Criar conta</span>
          </Button>

          <div class="text-sm text-muted-foreground text-center mt-2">
            Já tem conta?
            <RouterLink class="underline" to="/login">Entrar</RouterLink>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
