<script setup lang="ts">
import { deleteServiceOrder, listServiceOrders, type ServiceOrder, type Status } from '@/api/service-orders'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const router = useRouter()
const qc = useQueryClient()

const q = ref('')
const uiStatus = ref<'ALL' | Status>('ALL')
const page = ref(1)
const limit = ref(10)

const statusForApi = computed<Status | undefined>(() => (uiStatus.value === 'ALL' ? undefined : uiStatus.value))

const query = useQuery({
  queryKey: ['service-orders', q, statusForApi, page, limit],
  queryFn: () => listServiceOrders({ q: q.value, status: statusForApi.value, page: page.value, limit: limit.value }),
  placeholderData: (prev) => prev,
  staleTime: 5_000,
})

const rows = computed<ServiceOrder[]>(() => query.data?.value?.data ?? [])
const total = computed<number>(() => query.data?.value?.total ?? 0)
const hasEmpty = computed(() => !query.isLoading.value && rows.value.length === 0)
const errorMsg = computed(() => (query.error?.value as any)?.response?.data?.message || (query.error?.value as any)?.message || 'Erro ao carregar lista.')

function aplicar() {
  page.value = 1
  query.refetch()
}

const del = useMutation({
  mutationFn: (id: string) => deleteServiceOrder(id),
  onSuccess: () => {
    toast.success('OS removida')
    qc.invalidateQueries({ queryKey: ['service-orders'] })
  },
  onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Falha ao remover'),
})

function goDetail(id: string) {
  router.push({ name: 'os.detail', params: { id } })
}
function goNew() {
  router.push({ name: 'os.new' })
}
function onDelete(id: string) {
  if (confirm('Remover esta OS?')) del.mutate(id)
}
</script>

<template>
  <div class="p-6">
    <div class="rounded-xl border p-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h2 class="text-lg font-semibold">Ordens de Serviço</h2>
          <p class="text-sm text-muted-foreground">Filtre por status e busca textual.</p>
        </div>
        <button class="px-3 py-2 rounded-md bg-black text-white" @click="goNew">Nova OS</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4">
        <div>
          <label class="text-sm font-medium">Buscar</label>
          <input class="mt-1 w-full border rounded-md px-3 py-2" placeholder="título/descrição" v-model="q" />
        </div>
        <div>
          <label class="text-sm font-medium">Status</label>
          <select class="mt-1 w-full border rounded-md px-3 py-2" v-model="uiStatus">
            <option value="ALL">Todos</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium">Por página</label>
          <select class="mt-1 w-full border rounded-md px-3 py-2" v-model.number="limit">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
        <div class="md:justify-self-start">
          <button class="px-4 py-2 rounded-md bg-black text-white" @click="aplicar">Aplicar</button>
        </div>
      </div>

      <p v-if="query.isError.value" class="text-red-600 text-sm mb-2">{{ errorMsg }}</p>
      <p v-else-if="query.isLoading.value">Carregando…</p>
      <p v-else-if="hasEmpty" class="text-sm text-muted-foreground">Nenhum registro.</p>

      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left border-b">
            <th class="py-2">Título</th>
            <th class="py-2">Status</th>
            <th class="py-2">Criada em</th>
            <th class="py-2 w-40"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-b">
            <td class="py-2">
              <a class="text-blue-600 hover:underline cursor-pointer" @click="goDetail(row.id)">{{ row.title }}</a>
            </td>
            <td class="py-2">{{ row.status }}</td>
            <td class="py-2">{{ new Date(row.createdAt).toLocaleString() }}</td>
            <td class="py-2">
              <div class="flex gap-2">
                <button class="px-3 py-1 rounded border" @click="$router.push({ name:'os.edit', params:{ id: row.id }})">Editar</button>
                <button class="px-3 py-1 rounded border text-red-600" @click="onDelete(row.id)" :disabled="del.isPending.value">
                  {{ del.isPending.value ? '...' : 'Excluir' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!hasEmpty" class="mt-3 flex items-center gap-2">
        <button class="px-3 py-1 rounded border" :disabled="page <= 1" @click="page--">Anterior</button>
        <span>Página {{ page }}</span>
        <button class="px-3 py-1 rounded border" :disabled="rows.length < limit" @click="page++">Próxima</button>
        <span class="ml-auto text-xs text-muted-foreground">Total: {{ total }}</span>
      </div>
    </div>
  </div>
</template>
