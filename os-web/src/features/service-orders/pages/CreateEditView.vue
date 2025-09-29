<script setup lang="ts">
import { api } from '@/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

type Template = { id: string; name: string }
type ListTplResp = Template[]
type CreatePayload =
  | { title: string; description?: string; templateId: string }
  | { title: string; description?: string; newChecklist: { name: string; items: { label: string; required?: boolean }[] } }

const router = useRouter()
const qc = useQueryClient()

const title = ref('')
const description = ref('')

const mode = ref<'existing' | 'new'>('existing')
const selectedTemplateId = ref<string>('')

const newChecklist = reactive({
  name: '',
  items: [{ label: '', required: true }] as { label: string; required: boolean }[],
})

const qTemplates = useQuery({
  queryKey: ['checklist-templates'],
  queryFn: async () => (await api.get<ListTplResp>('/checklist-templates')).data,
})

const canSubmit = computed(() => {
  if (!title.value.trim()) return false
  if (mode.value === 'existing') return !!selectedTemplateId.value
  if (!newChecklist.name.trim()) return false
  if (newChecklist.items.length === 0) return false
  return newChecklist.items.every(i => i.label.trim().length > 0)
})

function addItem() {
  newChecklist.items.push({ label: '', required: false })
}
function removeItem(idx: number) {
  newChecklist.items.splice(idx, 1)
}

const mCreate = useMutation({
  mutationFn: async (payload: CreatePayload) => (await api.post('/service-orders', payload)).data,
  onSuccess: async () => {
    toast.success('OS criada')
    await qc.invalidateQueries({ queryKey: ['service-orders'] })
    router.replace({ name: 'os.list' })
  },
  onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Falha ao criar OS'),
})

function submit() {
  if (!canSubmit.value) return
  const base = {
    title: title.value.trim(),
    description: description.value?.trim() || undefined,
  }

  const payload: CreatePayload =
    mode.value === 'existing'
      ? { ...base, templateId: selectedTemplateId.value }
      : {
          ...base,
          newChecklist: {
            name: newChecklist.name.trim(),
            items: newChecklist.items.map(i => ({ label: i.label.trim(), required: !!i.required })),
          },
        }

  mCreate.mutate(payload)
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-3xl rounded-xl border p-4">
      <h1 class="text-lg font-semibold mb-4">Nova OS</h1>

      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium">Título</label>
          <input class="mt-1 w-full border rounded-md px-3 py-2" placeholder="Ex.: Instalação inicial" v-model="title" />
        </div>

        <div>
          <label class="text-sm font-medium">Descrição</label>
          <textarea class="mt-1 w-full border rounded-md px-3 py-2 min-h-[120px]" placeholder="Detalhes..." v-model="description" />
        </div>

        <div class="pt-2">
          <div class="flex gap-4">
            <label class="flex items-center gap-2">
              <input type="radio" value="existing" v-model="mode" />
              <span class="text-sm">Usar checklist existente</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" value="new" v-model="mode" />
              <span class="text-sm">Criar novo checklist</span>
            </label>
          </div>
        </div>

        <!-- Existing -->
        <div v-if="mode === 'existing'" class="space-y-2">
          <label class="text-sm font-medium">Checklist</label>
          <select class="mt-1 w-full border rounded-md px-3 py-2" v-model="selectedTemplateId">
            <option value="" disabled>Selecione...</option>
            <option v-for="t in qTemplates.data?.value ?? []" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
          <p v-if="qTemplates.isLoading.value" class="text-xs text-muted-foreground">Carregando templates…</p>
          <p v-else-if="(qTemplates.data?.value?.length ?? 0) === 0" class="text-xs text-muted-foreground">
            Nenhum template cadastrado.
          </p>
        </div>

        <!-- New -->
        <div v-else class="space-y-3">
          <div>
            <label class="text-sm font-medium">Nome do checklist</label>
            <input class="mt-1 w-full border rounded-md px-3 py-2" placeholder="Ex.: Checklist de Instalação"
              v-model="newChecklist.name" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-sm font-medium">Itens</label>
              <button class="px-2 py-1 rounded-md border text-xs" @click="addItem">Adicionar item</button>
            </div>

            <div class="space-y-2">
              <div v-for="(it, idx) in newChecklist.items" :key="idx" class="flex items-start gap-2">
                <input class="w-full border rounded-md px-3 py-2" placeholder="Descrição do item" v-model="it.label" />
                <label class="text-xs flex items-center gap-1 px-2">
                  <input type="checkbox" v-model="it.required" />
                  obrigatório
                </label>
                <button class="px-2 py-1 rounded-md border text-xs" @click="removeItem(idx)" :disabled="newChecklist.items.length === 1">
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-2 flex gap-2">
          <button class="px-4 py-2 rounded-md bg-black text-white" :disabled="!canSubmit || mCreate.isPending.value" @click="submit">
            {{ mCreate.isPending.value ? 'Criando…' : 'Criar' }}
          </button>
          <button class="px-4 py-2 rounded-md border" @click="$router.back()">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>
