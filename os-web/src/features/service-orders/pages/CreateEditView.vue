<script setup lang="ts">
import { createServiceOrder, getServiceOrder, updateServiceOrder } from '@/api/service-orders'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const qc = useQueryClient()

const isEdit = computed(() => !!route.params.id)
const id = computed(() => route.params.id as string | undefined)

const title = ref('')
const description = ref('')

const detail = useQuery({
  enabled: isEdit,
  queryKey: ['service-order', id],
  queryFn: () => getServiceOrder(id.value!),
  staleTime: 5_000,
})

onMounted(() => {
  if (detail.data?.value) {
    title.value = detail.data.value.title
    description.value = detail.data.value.description ?? ''
  }
})

const createMut = useMutation({
  mutationFn: () => createServiceOrder({ title: title.value.trim(), description: description.value.trim() || undefined }),
  onSuccess: (so) => {
    toast.success('OS criada')
    qc.invalidateQueries({ queryKey: ['service-orders'] })
    router.replace({ name: 'os.detail', params: { id: so.id } })
  },
  onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Falha ao criar'),
})

const updateMut = useMutation({
  mutationFn: () => updateServiceOrder(id.value!, { title: title.value.trim(), description: description.value.trim() || undefined }),
  onSuccess: (so) => {
    toast.success('OS atualizada')
    qc.invalidateQueries({ queryKey: ['service-orders'] })
    qc.invalidateQueries({ queryKey: ['service-order', id.value] })
    router.replace({ name: 'os.detail', params: { id: so.id } })
  },
  onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Falha ao atualizar'),
})

function save() {
  if (!title.value.trim()) return toast.error('Título é obrigatório')
  isEdit.value ? updateMut.mutate() : createMut.mutate()
}
</script>

<template>
  <div class="p-6">
    <div class="rounded-xl border p-4 max-w-xl">
      <h2 class="text-lg font-semibold mb-4">{{ isEdit ? 'Editar OS' : 'Nova OS' }}</h2>

      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium">Título</label>
          <input class="mt-1 w-full border rounded-md px-3 py-2" v-model="title" placeholder="Ex.: Instalação inicial" />
        </div>
        <div>
          <label class="text-sm font-medium">Descrição</label>
          <textarea class="mt-1 w-full border rounded-md px-3 py-2" rows="3" v-model="description" placeholder="Detalhes..."></textarea>
        </div>
      </div>

      <div class="mt-4 flex gap-2">
        <button class="px-4 py-2 rounded-md bg-black text-white" :disabled="createMut.isPending.value || updateMut.isPending.value" @click="save">
          {{ isEdit ? (updateMut.isPending.value ? 'Salvando…' : 'Salvar') : (createMut.isPending.value ? 'Criando…' : 'Criar') }}
        </button>
        <button class="px-4 py-2 rounded-md border" @click="$router.back()">Cancelar</button>
      </div>
    </div>
  </div>
</template>
