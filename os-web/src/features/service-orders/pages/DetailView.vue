<script setup lang="ts">
import { getServiceOrder, updateServiceOrder, type ServiceOrder } from '@/api/service-orders'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
const route = useRoute()
const id = route.params.id as string
const qc = useQueryClient()

const q = useQuery({
  queryKey: ['service-order', id],
  queryFn: () => getServiceOrder(id),
  staleTime: 5_000,
})

const so = computed<ServiceOrder | null>(() => q.data?.value ?? null)

function nextStatus(s: ServiceOrder['status']): ServiceOrder['status'] {
  if (s === 'OPEN') return 'IN_PROGRESS'
  if (s === 'IN_PROGRESS') return 'DONE'
  return 'DONE'
}

const mut = useMutation({
  mutationFn: (status: ServiceOrder['status']) => updateServiceOrder(id, { status }),
  onSuccess: () => {
    toast.success('Status atualizado')
    qc.invalidateQueries({ queryKey: ['service-orders'] })
    qc.invalidateQueries({ queryKey: ['service-order', id] })
  },
  onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Falha ao atualizar status'),
})

</script>

<template>
  <div class="p-6" v-if="so">
    <div class="rounded-xl border p-4 max-w-3xl">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ so.title }}</h2>
        <div class="text-sm">Status: <b>{{ so.status }}</b></div>
      </div>

      <p class="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{{ so.description }}</p>

      <div class="mt-4 flex gap-2">
        <button class="px-3 py-2 rounded-md border" @click="$router.push({ name: 'os.edit', params: { id: so.id } })">Editar</button>
        <button
          class="px-3 py-2 rounded-md bg-black text-white"
          :disabled="so.status === 'DONE' || mut.isPending.value"
          @click="mut.mutate(nextStatus(so.status))"
        >
          {{ so.status === 'DONE' ? 'Concluída' : (mut.isPending.value ? 'Atualizando…' : 'Avançar Status') }}
        </button>
        <button class="px-3 py-2 rounded-md border" @click="$router.push({ name: 'os.list' })">Voltar</button>
      </div>

      <div class="mt-6 grid sm:grid-cols-2 gap-3">
        <button class="px-3 py-2 rounded-md border" @click="$router.push({ name: 'os.detail', params: { id: so.id } })">Resumo</button>
        <button class="px-3 py-2 rounded-md border" @click="$router.push(`/service-orders/${so.id}/checklist`)">Checklist</button>
        <button class="px-3 py-2 rounded-md border" @click="$router.push(`/service-orders/${so.id}/photos`)">Fotos</button>
      </div>
    </div>
  </div>
</template>
