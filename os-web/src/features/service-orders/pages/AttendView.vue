<script setup lang="ts">
import { api } from '@/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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

type SavedPhoto = { id: string; presignedUrl: string }
type PhotoListItem = { id: string; presignedUrl?: string }

type ChecklistItem = { id: string; label: string; required: boolean }
type ChecklistVMItem = ChecklistItem & { checked: boolean; note?: string | null; textValue?: string | null }
type ChecklistVM = { templateName: string; items: ChecklistVMItem[] }
type ChecklistInput = { itemId: string; boolValue?: boolean; textValue?: string | null; note?: string | null }

type LocalPreview = { id: string; url: string; file: File }

const route = useRoute()
const router = useRouter()
const qc = useQueryClient()
const id = route.params.id as string

async function fetchServiceOrder(soId: string): Promise<ServiceOrderDetail> {
  const { data } = await api.get(`/service-orders/${soId}`)
  return data
}
async function updateServiceOrderStatus(soId: string, status: Status): Promise<ServiceOrderDetail> {
  const { data } = await api.put(`/service-orders/${soId}`, { status })
  return data
}

async function listPhotosRaw(soId: string): Promise<PhotoListItem[]> {
  const { data } = await api.get(`/service-orders/${soId}/photos`)
  return (data ?? []) as PhotoListItem[]
}
async function deletePhoto(soId: string, pid: string) {
  await api.delete(`/service-orders/${soId}/photos/${pid}`)
}
async function uploadOne(soId: string, f: File) {
  const form = new FormData()
  form.append('file', f)
  return api.post(`/service-orders/${soId}/photos`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

async function patchChecklistInputs(soId: string, inputs: ChecklistInput[]) {
  await api.patch(`/checklist/service-orders/${soId}/answers`, { inputs })
}
async function finishChecklist(soId: string) {
  await api.post(`/checklist/service-orders/${soId}/finish`, {})
}

const soQuery = useQuery({ queryKey: ['service-order', id], queryFn: () => fetchServiceOrder(id) })

const isDone = computed(() => soQuery.data?.value?.status === 'DONE')
const statusBadge = computed(() => {
  const s = soQuery.data?.value?.status
  if (s === 'OPEN') return 'bg-blue-100 text-blue-700 border border-blue-200'
  if (s === 'IN_PROGRESS') return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  if (s === 'DONE') return 'bg-green-100 text-green-700 border border-green-200'
  return 'bg-gray-100 text-gray-700 border border-gray-200'
})
const actionLabel = computed(() => {
  const s = soQuery.data?.value?.status
  if (s === 'OPEN') return 'Iniciar atendimento'
  if (s === 'IN_PROGRESS') return 'Concluir OS'
  return 'Concluída'
})
const actionDisabled = computed(() => isDone.value)

function normalizeEmbeddedChecklist(so: ServiceOrderDetail | undefined | null): ChecklistVM | null {
  const c = so?.checklist
  if (!c || !c.template) return null
  const ans: Record<string, { boolValue: boolean | null; textValue: string | null; note: string | null }> = {}
  for (const a of c.answers ?? []) ans[a.itemId] = { boolValue: a.boolValue, textValue: a.textValue, note: a.note }
  return {
    templateName: c.template.name,
    items: (c.template.items ?? []).map(i => ({
      id: i.id,
      label: i.label,
      required: !!i.required,
      checked: !!ans[i.id]?.boolValue,
      note: ans[i.id]?.note ?? null,
      textValue: ans[i.id]?.textValue ?? null,
    })),
  }
}

const checklist = reactive<{ data: ChecklistVM | null }>({ data: null })
async function loadChecklist() { checklist.data = normalizeEmbeddedChecklist(soQuery.data?.value) }

let t: any = null
const saving = ref(false)
function triggerAutosave() {
  if (isDone.value || !checklist.data) return
  if (t) clearTimeout(t)
  saving.value = true
  t = setTimeout(async () => {
    try {
      const inputs: ChecklistInput[] = checklist.data!.items.map(i => ({
        itemId: i.id,
        boolValue: !!i.checked,
        textValue: i.textValue ?? null,
        note: i.note ?? null,
      }))
      await patchChecklistInputs(id, inputs)
      toast.success('Checklist salvo')
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Falha ao salvar checklist'
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      saving.value = false
    }
  }, 500)
}

const saved = useQuery({
  queryKey: ['service-order', id, 'photos'],
  queryFn: async (): Promise<SavedPhoto[]> => {
    const items = await listPhotosRaw(id)
    return (items ?? [])
      .filter(p => !!p.presignedUrl)
      .map(p => ({ id: p.id, presignedUrl: p.presignedUrl! }))
  },
})

const localPreviews = ref<LocalPreview[]>([] as LocalPreview[])
const objectUrls = new Set<string>()
function rememberUrl(u: string) { objectUrls.add(u); return u }
function revokeAll() { for (const u of objectUrls) URL.revokeObjectURL(u); objectUrls.clear() }

const sending = ref(false)
async function onSelectFiles(ev: Event) {
  if (isDone.value) return
  const input = ev.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  for (const f of Array.from(files)) {
    const url = rememberUrl(URL.createObjectURL(f))
    localPreviews.value.push({ id: `local-${Date.now()}-${Math.random()}`, url, file: f })
  }
  input.value = ''
}
function removeLocalPreview(pid: string) {
  const idx = localPreviews.value.findIndex(p => p.id === pid)
  if (idx < 0) return

  const item = localPreviews.value[idx]
  if (!item) return

  const { url } = item
  try {
    URL.revokeObjectURL(url)
  } catch {}
  objectUrls.delete(url)

  localPreviews.value.splice(idx, 1)
}

async function removeSavedPhoto(pid: string) {
  if (isDone.value) return
  if (!confirm('Remover esta foto?')) return
  try {
    await deletePhoto(id, pid)
    qc.invalidateQueries({ queryKey: ['service-order', id, 'photos'] })
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'Falha ao remover'
    toast.error(Array.isArray(msg) ? msg.join(', ') : msg)
  }
}

const progressing = ref(false)
const mutateAdvance = useMutation({
  mutationFn: async () => {
    const cur = soQuery.data?.value
    if (!cur) return

    if (cur.status === 'OPEN') {
      return updateServiceOrderStatus(id, 'IN_PROGRESS')
    }

    if (cur.status === 'IN_PROGRESS') {
      progressing.value = true
      try {
        if (t) { clearTimeout(t); t = null }
        if (checklist.data) {
          const inputs: ChecklistInput[] = checklist.data.items.map(i => ({
            itemId: i.id,
            boolValue: !!i.checked,
            textValue: i.textValue ?? null,
            note: i.note ?? null,
          }))
          await patchChecklistInputs(id, inputs)
        }

        await finishChecklist(id)

        for (const p of localPreviews.value) {
          await uploadOne(id, p.file)
        }

        await updateServiceOrderStatus(id, 'DONE')

        toast.success('OS concluída')
        localPreviews.value.forEach(lp => { URL.revokeObjectURL(lp.url); objectUrls.delete(lp.url) })
        localPreviews.value = []
        qc.invalidateQueries({ queryKey: ['service-order', id] })
        qc.invalidateQueries({ queryKey: ['service-order', id, 'photos'] })
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Não foi possível concluir'
        toast.error(Array.isArray(msg) ? msg.join(', ') : msg)
        throw e
      } finally {
        progressing.value = false
      }
    }

    return null
  },
  onSuccess: () => {
    if (soQuery.data?.value?.status === 'OPEN') {
      toast.success('Atendimento iniciado')
      qc.invalidateQueries({ queryKey: ['service-order', id] })
    }
  },
  onError: () => {},
})

function goBack() { router.back() }

onMounted(() => { loadChecklist() })
watch(() => soQuery.data?.value, () => { loadChecklist() })
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
        <div class="h-8 w-8 rounded-full flex items-center justify-center"
             :class="(saved.data?.value?.length ?? 0) + (localPreviews.length) > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'">2</div>
        <div>
          <p class="text-sm font-medium">Uploads</p>
          <p class="text-xs text-muted-foreground">Fotos e anexos</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="h-8 w-8 rounded-full flex items-center justify-center"
             :class="soQuery.data?.value?.status === 'DONE' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'">3</div>
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
        <button class="px-3 py-2 rounded-md bg-black text-white disabled:opacity-50"
                :disabled="actionDisabled || progressing"
                @click="mutateAdvance.mutate()">
          {{ progressing ? 'Concluindo…' : actionLabel }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="rounded-xl border p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold">Checklist</h3>
          <div class="text-xs text-muted-foreground" v-if="!checklist.data">Nenhum item no template.</div>
        </div>

        <div v-if="checklist.data">
          <p class="text-sm text-muted-foreground mb-3">
            Template: <span class="font-medium">{{ checklist.data.templateName }}</span>
          </p>

          <div class="space-y-2">
            <label v-for="item in checklist.data.items" :key="item.id"
                   class="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/40">
              <input type="checkbox" class="mt-0.5"
                     v-model="(item as any).checked"
                     :disabled="isDone"
                     @change="triggerAutosave" />
              <div class="grow">
                <div class="flex items-center gap-2">
                  <span class="text-sm">{{ item.label }}</span>
                  <span v-if="item.required" class="text-red-600 text-xs">*</span>
                </div>
                <input class="mt-2 w-full rounded border px-2 py-1 text-sm"
                       :disabled="isDone"
                       v-model="(item as any).note"
                       placeholder="Observação (opcional)"
                       @input="triggerAutosave" />
              </div>
            </label>
          </div>

          <div class="mt-3 text-xs text-muted-foreground" v-if="saving">salvando…</div>
        </div>
      </div>

      <div class="rounded-xl border p-4">
        <h3 class="font-semibold mb-3">Fotos</h3>

        <label class="block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer"
               :class="isDone ? 'opacity-50 cursor-not-allowed' : 'border-muted-foreground/30 hover:bg-muted/40'">
          <input type="file" class="hidden" accept="image/png,image/jpeg" multiple
                 :disabled="isDone || sending" @change="onSelectFiles" />
          <div class="text-sm">
            <strong>Escolher arquivo</strong>
            <span class="text-muted-foreground"> ou arraste aqui</span>
            <div class="text-xs mt-1 text-muted-foreground">PNG/JPG até 10MB</div>
          </div>
        </label>

        <div class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div v-for="p in saved.data?.value ?? []" :key="'sv-'+p.id" class="relative group rounded-lg overflow-hidden border">
            <img :src="p.presignedUrl" class="w-full h-32 object-cover" />
            <button v-if="!isDone"
                    class="absolute top-1 right-1 text-xs bg-white/90 border rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 transition"
                    @click="removeSavedPhoto(p.id)">
              Remover
            </button>
          </div>

          <div v-for="p in localPreviews" :key="p.id" class="relative group rounded-lg overflow-hidden border">
            <img :src="p.url" class="w-full h-32 object-cover" />
            <span class="absolute bottom-1 left-1 text-[10px] bg-white/80 px-1 rounded">pré-visualização</span>
            <button class="absolute top-1 right-1 text-xs bg-white/90 border rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 transition"
                    @click="removeLocalPreview(p.id)">
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
