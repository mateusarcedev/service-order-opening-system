<script setup lang="ts">
import { api } from '@/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

type Template = { id: string; name: string }

const router = useRouter()
const qc = useQueryClient()

const form = reactive({
  title: '',
  description: '',
  mode: 'existing' as 'existing' | 'new',
  templateId: '' as string,
  newChecklistName: '',
  items: [] as Array<{ id: string; label: string; required: boolean }>,
})

const isValidTitle = computed(() => form.title.trim().length >= 3)
const isValidTemplateExisting = computed(() => form.mode === 'existing' ? !!form.templateId : true)
const isValidTemplateNew = computed(() =>
  form.mode === 'new' ? form.newChecklistName.trim().length >= 3 && form.items.length > 0 && form.items.every(i => i.label.trim().length > 0) : true,
)
const canSubmit = computed(() => isValidTitle.value && isValidTemplateExisting.value && isValidTemplateNew.value)

const tplQuery = useQuery({
  queryKey: ['checklist-templates'],
  queryFn: async (): Promise<Template[]> => {
    const { data } = await api.get('/checklist/templates')
    return data ?? []
  },
  staleTime: 60_000,
})

function addItem() {
  form.items.push({ id: crypto.randomUUID(), label: '', required: false })
}
function removeItem(idx: number) {
  form.items.splice(idx, 1)
}

const createMut = useMutation({
  mutationFn: async () => {
    const payload: any = {
      title: form.title.trim(),
      description: form.description?.trim() || '',
    }
    if (form.mode === 'existing') {
      payload.templateId = form.templateId
    } else {
      payload.newChecklist = {
        name: form.newChecklistName.trim(),
        items: form.items.map(i => ({ label: i.label.trim(), required: !!i.required })),
      }
    }
    const { data } = await api.post('/service-orders', payload)
    return data
  },
  onSuccess: (so) => {
    toast.success('Ordem de Serviço criada!')
    qc.invalidateQueries({ queryKey: ['service-orders'] })
    router.push({ name: 'os.list', params: { id: so.id } })
  },
  onError: (e: any) => {
    const msg = e?.response?.data?.message || e?.message || 'Falha ao criar OS'
    toast.error(msg)
  },
})

</script>

<template>
  <div class="p-6">
    <div class="max-w-4xl mx-auto">
      <div class="rounded-2xl overflow-hidden shadow-sm border bg-white">
        <div class="text-black px-6 py-5">
          <div class="flex items-center gap-3">
            <div class="h-7 w-7 rounded-lg bg-white/15 flex items-center justify-center">✓</div>
            <div>
              <h1 class="text-xl font-semibold">Nova Ordem de Serviço</h1>
              <p class="text-white/80 text-sm">Preencha os detalhes da nova OS</p>
            </div>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <div>
            <label class="text-sm font-medium">Título *</label>
            <input
              v-model.trim="form.title"
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex.: Instalação inicial"
            />
            <p v-if="!isValidTitle" class="text-xs text-red-600 mt-1">Informe pelo menos 3 caracteres.</p>
          </div>

          <div>
            <label class="text-sm font-medium">Descrição</label>
            <textarea
              v-model.trim="form.description"
              rows="4"
              class="mt-1 w-full border rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva os detalhes da ordem de serviço…"
            />
          </div>

          <div class="rounded-xl border">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-xl flex items-center gap-2">
              <span class="text-sm font-medium">Opções de Checklist</span>
            </div>

            <div class="p-4 space-y-6">
              <div class="flex flex-wrap items-center gap-6">
                <label class="flex items-center gap-2">
                  <input type="radio" value="existing" v-model="form.mode" />
                  <span class="text-sm">Usar checklist existente</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="radio" value="new" v-model="form.mode" />
                  <span class="text-sm">Criar novo checklist</span>
                </label>
              </div>

              <div v-if="form.mode === 'existing'" class="space-y-2">
                <label class="text-sm font-medium">Selecione o Checklist</label>
                <select
                  v-model="form.templateId"
                  class="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione…</option>
                  <option v-for="tpl in tplQuery.data?.value ?? []" :key="tpl.id" :value="tpl.id">
                    {{ tpl.name }}
                  </option>
                </select>
                <div v-if="(tplQuery.data?.value?.length ?? 0) === 0" class="text-xs text-amber-600">
                  Nenhum template cadastrado.
                </div>
                <p v-if="!isValidTemplateExisting" class="text-xs text-red-600">Selecione um template.</p>
              </div>

              <div v-else class="space-y-4">
                <div>
                  <label class="text-sm font-medium">Nome do checklist *</label>
                  <input
                    v-model.trim="form.newChecklistName"
                    placeholder="Ex.: Checklist Padrão"
                    class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium">Itens</label>
                    <button type="button" class="px-3 py-1.5 rounded-md border hover:bg-gray-50" @click="addItem">
                      + Adicionar item
                    </button>
                  </div>

                  <div v-if="form.items.length === 0" class="text-sm text-muted-foreground">
                    Nenhum item ainda. Clique em “Adicionar item”.
                  </div>

                  <div v-for="(it, idx) in form.items" :key="it.id" class="rounded-lg border p-3">
                    <div class="grid gap-3 md:grid-cols-[1fr_auto]">
                      <input
                        v-model.trim="it.label"
                        class="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex.: Validar ambiente/equipamentos"
                      />
                      <div class="flex items-center gap-4">
                        <label class="inline-flex items-center gap-2 text-sm">
                          <input type="checkbox" v-model="it.required" />
                          Obrigatório
                        </label>
                        <button type="button" class="text-red-600 text-sm hover:underline" @click="removeItem(idx)">
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>

                  <p v-if="!isValidTemplateNew" class="text-xs text-red-600">
                    Dê um nome ao checklist e inclua pelo menos 1 item (sem rótulos vazios).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              class="px-3 py-2 rounded-md border"
              @click="$router.back()"
              :disabled="createMut.isPending.value"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              :disabled="!canSubmit || createMut.isPending.value"
              @click="createMut.mutate()"
            >
              {{ createMut.isPending.value ? 'Criando…' : 'Criar OS' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="tplQuery.isLoading.value" class="text-sm text-muted-foreground mt-3">Carregando templates…</div>
      <div v-if="tplQuery.isError.value" class="text-sm text-red-600 mt-3">
        Falha ao carregar templates.
      </div>
    </div>
  </div>
</template>
