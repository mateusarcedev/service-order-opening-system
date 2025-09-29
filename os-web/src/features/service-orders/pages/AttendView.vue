<script setup lang="ts">
import { api } from '@/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

type Status = 'OPEN' | 'IN_PROGRESS' | 'DONE'

type ServiceOrderBase = {
  id: string
  title: string
  description: string | null
  status: Status
  createdAt: string
  updatedAt: string
  createdById: string
}

type ChecklistDetail = {
  id: string
  startedAt: string | null
  finishedAt: string | null
  template: {
    id: string
    name: string
    items: Array<{ id: string; label: string; required: boolean }>
  }
  answers: Array<{ itemId: string; boolValue: boolean | null; textValue: string | null; note: string | null }>
}

type ServiceOrderDetail = ServiceOrderBase & { checklist: ChecklistDetail | null }

type Photo = { id: string; url: string }
type ChecklistItem = { id: string; label: string; required: boolean }
type ChecklistVM = {
  templateName: string
  items: (ChecklistItem & { checked: boolean; note?: string | null; textValue?: string | null })[]
}
type ChecklistAnswerInput = { itemId: string; boolValue?: boolean; textValue?: string | null; note?: string | null }

const route = useRoute()
const router = useRouter()
const qc = useQueryClient()
const id = route.params.id as string
const openAsDetails = computed(() => route.name === 'os.detail')

async function fetchServiceOrder(soId: string): Promise<ServiceOrderDetail> {
  const { data } = await api.get(`/service-orders/${soId}`)
  return data
}
async function updateServiceOrderStatus(soId: string, status: Status): Promise<ServiceOrderDetail> {
  const { data } = await api.put(`/service-orders/${soId}`, { status })
  return data
}

async function fetchChecklistFallback(soId: string): Promise<ChecklistVM | null> {
  const { data } = await api.get(`/checklist/service-orders/${soId}`)
  if (!data) return null
  if (Array.isArray(data.items) && data.templateName) {
    return {
      templateName: data.templateName,
      items: data.items.map((i: any) => ({
        id: i.id,
        label: i.label,
        required: !!i.required,
        checked: !!i.checked,
        note: i.note ?? null,
        textValue: i.textValue ?? null,
      })),
    }
  }
  if (data.template && Array.isArray(data.template.items)) {
    const tplName = data.template.name ?? 'Checklist'
    const answers: Record<string, any> = {}
    for (const a of data.answers ?? []) answers[a.itemId] = a
    return {
      templateName: tplName,
      items: data.template.items.map((i: any) => ({
        id: i.id,
        label: i.label,
        required: !!i.required,
        checked: !!answers[i.id]?.boolValue,
        note: answers[i.id]?.note ?? null,
        textValue: answers[i.id]?.textValue ?? null,
      })),
    }
  }
  if (Array.isArray(data.items)) {
    return {
      templateName: data.templateName ?? 'Checklist',
      items: data.items.map((i: any) => ({
        id: i.id,
        label: i.label,
        required: !!i.required,
        checked: !!i.checked,
        note: i.note ?? null,
        textValue: i.textValue ?? null,
      })),
    }
  }
  return null
}

async function sendChecklistAnswers(soId: string, inputs: ChecklistAnswerInput[]) {
  await api.patch(`/checklist/service-orders/${soId}/answers`, { inputs })
}


async function listPhotosMeta(soId: string): Promise<{ id: string; url?: string }[]> {
  const { data } = await api.get(`/service-orders/${soId}/photos`)
  return (data ?? []).map((p: any) => ({ id: p.id, url: p.url }))
}
async function fetchPhotoPreviewUrl(soId: string, photoId: string): Promise<string> {
  try {
    const { data } = await api.get(`/service-orders/${soId}/photos/${photoId}/file`, { responseType: 'blob' })
    return URL.createObjectURL(data)
  } catch {
    const { data } = await api.get(`/service-orders/${soId}/photos/${photoId}`, { responseType: 'blob' })
    return URL.createObjectURL(data)
  }
}

const soQuery = useQuery({
  queryKey: ['service-order', id],
  queryFn: () => fetchServiceOrder(id),
  staleTime: 10_000,
})

const isDone = computed(() => soQuery.data?.value?.status === 'DONE')
const readOnly = computed(() => openAsDetails.value || isDone.value)

const statusBadge = computed(() => {
  const s = soQuery.data?.value?.status
  if (s === 'OPEN') return 'bg-blue-100 text-blue-700 border border-blue-200'
  if (s === 'IN_PROGRESS') return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  if (s === 'DONE') return 'bg-green-100 text-green-700 border border-green-200'
  return 'bg-gray-100 text-gray-700 border border-gray-200'
})

const checklist = ref<ChecklistVM | null>(null)
function normalizeEmbeddedChecklist(so: ServiceOrderDetail | undefined | null): ChecklistVM | null {
  const c = so?.checklist
  if (!c || !c.template) return null
  const ans: Record<string, { boolValue: boolean | null; textValue: string | null; note: string | null }> = {}
  for (const a of c.answers ?? []) ans[a.itemId] = { boolValue: a.boolValue, textValue: a.textValue, note: a.note }
  return {
    templateName: c.template.name,
    items: (c.template.items ?? []).map((i) => ({
      id: i.id,
      label: i.label,
      required: !!i.required,
      checked: !!ans[i.id]?.boolValue,
      note: ans[i.id]?.note ?? null,
      textValue: ans[i.id]?.textValue ?? null,
    })),
  }
}
async function loadChecklist() {
  const so = soQuery.data?.value
  const embedded = normalizeEmbeddedChecklist(so)
  if (embedded) {
    checklist.value = embedded
    return
  }
  try {
    checklist.value = await fetchChecklistFallback(id)
  } catch (e: any) {
    checklist.value = null
    toast.error(e?.response?.data?.message ?? 'Erro ao carregar checklist')
  }
}

const requiredOk = computed(() => {
  if (!checklist.value) return true
  const reqs = checklist.value.items.filter((i) => i.required)
  if (reqs.length === 0) return true
  return reqs.every((i) => !!i.checked || !!(i.textValue && i.textValue.trim()))
})

const primaryActionLabel = computed(() => {
  const s = soQuery.data?.value?.status
  if (s === 'OPEN') return 'Iniciar atendimento'
  if (s === 'IN_PROGRESS') return 'Concluir OS'
  return 'Concluída'
})
const primaryDisabled = computed(() => {
  const s = soQuery.data?.value?.status
  if (s === 'DONE') return true
  if (s === 'IN_PROGRESS') return !requiredOk.value
  return false
})

const mutAdvanceStatus = useMutation({
  mutationFn: async () => {
    const cur = soQuery.data?.value
    if (!cur) return

    if (cur.status === 'OPEN') {
      await updateServiceOrderStatus(id, 'IN_PROGRESS')
      return
    }

    if (cur.status === 'IN_PROGRESS') {
      if (!requiredOk.value) {
        toast.error('Preencha todos os itens obrigatórios do checklist.')
        return
      }

      if (checklist.value) {
        const inputs: ChecklistAnswerInput[] = checklist.value.items.map((i) => ({
          itemId: i.id,
          boolValue: !!i.checked,
          note: i.note ?? null,
          textValue: i.textValue ?? null,
        }))

        try {
          await sendChecklistAnswers(id, inputs)
        } catch (e: any) {
          const msg =
            e?.response?.data?.message ??
            e?.message ??
            'Falha ao salvar respostas do checklist'
          toast.error(Array.isArray(msg) ? msg.join('\n') : msg)
          throw e
        }
      }

      await updateServiceOrderStatus(id, 'DONE')
      return
    }
  },
  onSuccess: () => {
    toast.success('Status atualizado')
    qc.invalidateQueries({ queryKey: ['service-order', id] })
    qc.invalidateQueries({ queryKey: ['service-orders'] })
    loadChecklist()
  },
  onError: (e: any) => {
    const msg =
      e?.response?.data?.message ??
      e?.message ??
      'Falha ao atualizar status'
    toast.error(Array.isArray(msg) ? msg.join('\n') : msg)
  },
})


const objectUrls = new Set<string>()
function rememberUrl(u: string) { objectUrls.add(u); return u }
function revokeAll() { for (const u of objectUrls) URL.revokeObjectURL(u); objectUrls.clear() }

const photosQuery = useQuery({
  queryKey: ['service-order', id, 'photos'],
  queryFn: async (): Promise<Photo[]> => {
    const metas = await listPhotosMeta(id)
    const results: Photo[] = []
    for (const m of metas) {
      try {
        const url = m.url ? m.url : await fetchPhotoPreviewUrl(id, m.id)
        results.push({ id: m.id, url: rememberUrl(url) })
      } catch {}
    }
    return results
  },
  staleTime: 10_000,
})

async function reloadPhoto(photoId: string, index: number) {
  try {
    const newUrl = rememberUrl(await fetchPhotoPreviewUrl(id, photoId))
    const arr = photosQuery.data?.value ?? []
    if (arr[index]) arr[index].url = newUrl
  } catch {}
}

const sending = ref(false)
async function onSelectFiles(ev: Event) {
  if (readOnly.value) return
  const input = ev.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  try {
    sending.value = true
    for (const f of Array.from(files)) {
      const form = new FormData()
      form.append('file', f)
      await api.post(`/service-orders/${id}/photos`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
    toast.success('Foto(s) enviada(s)')
    revokeAll()
    qc.invalidateQueries({ queryKey: ['service-order', id, 'photos'] })
  } catch (e: any) {
    toast.error(e?.response?.data?.message ?? 'Falha no upload')
  } finally {
    sending.value = false
    input.value = ''
  }
}
async function removePhoto(photoId: string) {
  if (readOnly.value) return
  if (!confirm('Remover esta foto?')) return
  try {
    await api.delete(`/service-orders/${id}/photos/${photoId}`)
    revokeAll()
    qc.invalidateQueries({ queryKey: ['service-order', id, 'photos'] })
  } catch (e: any) {
    toast.error(e?.response?.data?.message ?? 'Falha ao remover')
  }
}

function goBack() { router.back() }

onMounted(() => { loadChecklist() })
watch(() => soQuery.data?.value, () => loadChecklist())
onBeforeUnmount(() => { revokeAll() })
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="w-full bg-muted/40 rounded-xl p-4 grid grid-cols-3 gap-4">
      <div class="flex items-center gap-3">
        <div class="h-8 w-8 rounded-full flex items-center justify-center bg-blue-600 text-white font-semibold">1</div>
        <div>
          <p class="text-sm font-medium">Configuração</p>
          <p class="text-xs text-muted-foreground">Dados e checklist</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div
          class="h-8 w-8 rounded-full flex items-center justify-center"
          :class="(photosQuery.data?.value?.length ?? 0) > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'"
        >
          2
        </div>
        <div>
          <p class="text-sm font-medium">Uploads</p>
          <p class="text-xs text-muted-foreground">Fotos e anexos</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div
          class="h-8 w-8 rounded-full flex items-center justify-center"
          :class="soQuery.data?.value?.status === 'DONE' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'"
        >
          3
        </div>
        <div>
          <p class="text-sm font-medium">Finalização</p>
          <p class="text-xs text-muted-foreground">Encerrar OS</p>
        </div>
      </div>
    </div>

    <div class="rounded-xl border p-4 flex items-start justify-between">
      <div>
        <h2 class="text-xl font-semibold">{{ soQuery.data?.value?.title }}</h2>
        <p class="text-sm text-muted-foreground">{{ soQuery.data?.value?.description }}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium" :class="statusBadge">
          {{ soQuery.data?.value?.status }}
        </span>
        <button
          class="px-3 py-2 rounded-md bg-black text-white disabled:opacity-50"
          :disabled="primaryDisabled"
          @click="mutAdvanceStatus.mutate()"
        >
          {{ primaryActionLabel }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="rounded-xl border p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold">Checklist</h3>
          <div class="text-xs text-muted-foreground" v-if="!checklist">Nenhum item no template.</div>
        </div>

        <div v-if="checklist">
          <p class="text-sm text-muted-foreground mb-3">
            Template: <span class="font-medium">{{ checklist.templateName }}</span>
          </p>

          <div class="space-y-2">
            <label
              v-for="item in checklist.items"
              :key="item.id"
              class="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/40"
            >
              <input type="checkbox" class="mt-0.5" v-model="(item as any).checked" :disabled="readOnly" />
              <div class="grow">
                <div class="flex items-center gap-2">
                  <span class="text-sm">{{ item.label }}</span>
                  <span v-if="item.required" class="text-red-600 text-xs">*</span>
                </div>
                <input
                  v-model="(item as any).note"
                  :disabled="readOnly"
                  placeholder="Observação (opcional)"
                  class="mt-2 w-full rounded border px-2 py-1 text-sm"
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="rounded-xl border p-4">
        <h3 class="font-semibold mb-3">Fotos</h3>

        <label
          class="block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer"
          :class="readOnly ? 'opacity-50 cursor-not-allowed' : 'border-muted-foreground/30 hover:bg-muted/40'"
        >
          <input
            type="file"
            class="hidden"
            accept="image/png,image/jpeg"
            multiple
            :disabled="readOnly || sending"
            @change="onSelectFiles"
          />
          <div class="text-sm">
            <strong>Escolher arquivo</strong>
            <span class="text-muted-foreground"> ou arraste aqui</span>
            <div class="text-xs mt-1 text-muted-foreground">PNG/JPG até 10MB</div>
          </div>
        </label>

        <div class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="(p, idx) in (photosQuery.data?.value ?? [])"
            :key="p.id"
            class="relative group rounded-lg overflow-hidden border"
          >
            <img :src="p.url" class="w-full h-32 object-cover" @error="reloadPhoto(p.id, idx)" />
            <button
              v-if="!readOnly"
              class="absolute top-1 right-1 text-xs bg-white/90 border rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 transition"
              @click="removePhoto(p.id)"
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <button class="px-3 py-2 rounded-md border" @click="goBack">Voltar</button>
    </div>
  </div>
</template>
