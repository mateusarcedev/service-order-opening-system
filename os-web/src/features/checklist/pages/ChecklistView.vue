<script setup lang="ts">
import { api } from '@/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

type TemplateItem = { id: string; label: string; required: boolean }
type Template = { id: string; name: string; items: TemplateItem[] }

async function listTemplates(): Promise<Template[]> {
  const { data } = await api.get('/checklist-templates')
  return data
}
async function startChecklist(osId: string, templateId: string) {
  const { data } = await api.post(`/service-orders/${osId}/checklist/start`, { templateId })
  return data
}
async function patchAnswers(osId: string, answers: { itemId: string; boolValue?: boolean; textValue?: string; note?: string }[]) {
  const { data } = await api.patch(`/service-orders/${osId}/checklist/answers`, { answers })
  return data
}
async function finishChecklist(osId: string) {
  const { data } = await api.post(`/service-orders/${osId}/checklist/finish`)
  return data
}

const route = useRoute()
const osId = route.params.id as string

const qc = useQueryClient()
const selectedTemplateId = ref<string>('')
const form = ref<Record<string, { boolValue?: boolean; textValue?: string; note?: string }>>({})

const templatesQ = useQuery({
  queryKey: ['checklist-templates'],
  queryFn: listTemplates,
  staleTime: 30_000,
})

const templates = computed(() => templatesQ.data?.value ?? [])
const selectedTemplate = computed<Template | null>(() => templates.value.find(t => t.id === selectedTemplateId.value) ?? null)

watch(selectedTemplate, (tpl) => {
  form.value = {}
  if (!tpl) return
  for (const it of tpl.items ?? []) {
    form.value[it.id] = { boolValue: undefined, textValue: '' }
  }
})


const startMut = useMutation({
  mutationFn: () => startChecklist(osId, selectedTemplateId.value),
  onSuccess: () => {
    toast.success('Checklist iniciado')
    qc.invalidateQueries({ queryKey: ['service-order', osId] })
  },
  onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Falha ao iniciar checklist'),
})

const saveMut = useMutation({
  mutationFn: () => {
    const answers = Object.entries(form.value).map(([itemId, v]) => ({
      itemId,
      boolValue: v.boolValue === undefined ? undefined : !!v.boolValue,
      textValue: v.textValue?.trim() ? v.textValue.trim() : undefined,
      note: v.note?.trim() ? v.note.trim() : undefined,
    }))
    return patchAnswers(osId, answers)
  },
  onSuccess: () => {
    toast.success('Respostas salvas')
  },
  onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Falha ao salvar respostas'),
})

const finishMut = useMutation({
  mutationFn: () => finishChecklist(osId),
  onSuccess: () => {
    toast.success('Checklist finalizado')
    qc.invalidateQueries({ queryKey: ['service-order', osId] })
  },
  onError: (e: any) => {
    const msg = e?.response?.data?.message ?? 'Falha ao finalizar'
    toast.error(msg)
  },
})

function canFinish(): boolean {
  const tpl = selectedTemplate.value
  if (!tpl) return false
  for (const it of tpl.items ?? []) {
    if (!it.required) continue
    const v = form.value[it.id] || {}
    const ok = v.boolValue === true || (!!v.textValue && v.textValue.trim().length > 0)
    if (!ok) return false
  }
  return true
}
</script>

<template>
  <div class="p-6">
    <div class="rounded-xl border p-4 max-w-3xl space-y-4">
      <h2 class="text-lg font-semibold">Checklist da OS</h2>

      <div class="space-y-2">
        <label class="text-sm font-medium">Template</label>
        <select
          class="mt-1 w-full border rounded-md px-3 py-2"
          v-model="selectedTemplateId"
          :disabled="startMut.isPending.value || saveMut.isPending.value || finishMut.isPending.value"
        >
          <option value="" disabled>Selecione...</option>
          <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
        </select>

        <div class="flex gap-2">
          <button
            class="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
            :disabled="!selectedTemplateId || startMut.isPending.value"
            @click="startMut.mutate()"
          >
            {{ startMut.isPending.value ? 'Iniciando...' : 'Iniciar' }}
          </button>
          <button class="px-4 py-2 rounded-md border" @click="$router.back()">Voltar</button>
        </div>
      </div>

      <div v-if="selectedTemplate" class="mt-4 space-y-3">
        <h3 class="font-medium">Itens</h3>
        <div v-if="(selectedTemplate.items ?? []).length === 0" class="text-sm text-muted-foreground">
          Este template não possui itens.
        </div>

        <div
          v-for="item in selectedTemplate.items"
          :key="item.id"
          class="border rounded-md p-3 space-y-2"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-medium">
                {{ item.label }}
                <span v-if="item.required" class="text-red-600">*</span>
              </p>
              <p class="text-xs text-muted-foreground break-all">ItemID: {{ item.id }}</p>
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <label class="inline-flex items-center gap-2">
              <input type="checkbox" v-model="form[item.id].boolValue" />
              <span>Concluído</span>
            </label>
            <input
              class="border rounded-md px-3 py-2 w-full"
              placeholder="Texto (opcional ou obrigatório, conforme item)"
              v-model="form[item.id].textValue"
            />
          </div>

          <textarea
            class="border rounded-md px-3 py-2 w-full"
            rows="2"
            placeholder="Nota (opcional)"
            v-model="form[item.id].note"
          />
        </div>

        <div class="flex items-center gap-2">
          <button
            class="px-4 py-2 rounded-md border disabled:opacity-50"
            :disabled="saveMut.isPending.value"
            @click="saveMut.mutate()"
          >
            {{ saveMut.isPending.value ? 'Salvando…' : 'Salvar respostas' }}
          </button>

          <button
            class="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
            :disabled="!canFinish() || finishMut.isPending.value"
            @click="finishMut.mutate()"
          >
            {{ finishMut.isPending.value ? 'Finalizando…' : 'Finalizar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
