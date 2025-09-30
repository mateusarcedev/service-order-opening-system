<script setup lang="ts">
import { api } from '@/api/client'
import { useQuery } from '@tanstack/vue-query'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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

type PhotoFromList = { id: string; presignedUrl?: string; url?: string }
type Photo = { id: string; url: string }

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

async function fetchSO(soId: string): Promise<ServiceOrderDetail> {
  const { data } = await api.get(`/service-orders/${soId}`)
  return data
}

async function listPhotosRaw(soId: string): Promise<PhotoFromList[]> {
  const { data } = await api.get(`/service-orders/${soId}/photos`)
  return (data ?? []) as PhotoFromList[]
}

async function fetchPhotoBlob(soId: string, pid: string): Promise<string> {
  const { data } = await api.get(`/service-orders/${soId}/photos/${pid}`, { responseType: 'blob' })
  return URL.createObjectURL(data)
}

const gallery = ref<Photo[]>([])
const objectUrls = new Set<string>()
function rememberUrl(u: string) { objectUrls.add(u); return u }
function revokeAll() { for (const u of objectUrls) URL.revokeObjectURL(u); objectUrls.clear() }

async function loadPhotos() {
  try {
    const items = await listPhotosRaw(id)
    const photos: Photo[] = await Promise.all(
      items.map(async (p) => {
        const direct = p.presignedUrl || p.url
        if (direct) return { id: p.id, url: direct }
        try {
          const u = rememberUrl(await fetchPhotoBlob(id, p.id))
          return { id: p.id, url: u }
        } catch {
          return { id: p.id, url: '' }
        }
      }),
    )
    gallery.value = photos.filter(p => !!p.url)
  } catch {
    gallery.value = []
  }
}

const so = useQuery({
  queryKey: ['service-order', id],
  queryFn: () => fetchSO(id),
})

watch(
  () => so.isSuccess.value,
  (ok) => {
    if (ok) loadPhotos()
  },
  { immediate: true }
)

const badge = computed(() => {
  const s = so.data?.value?.status
  if (s === 'OPEN') return 'bg-blue-100 text-blue-700 border border-blue-200'
  if (s === 'IN_PROGRESS') return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  if (s === 'DONE') return 'bg-green-100 text-green-700 border border-green-200'
  return 'bg-gray-100 text-gray-700 border border-gray-200'
})

const startedAt = computed(() => so.data?.value?.checklist?.startedAt || null)
const finishedAt = computed(() => so.data?.value?.checklist?.finishedAt || null)
const duration = computed(() => {
  const s = startedAt.value ? new Date(startedAt.value) : null
  const f = finishedAt.value ? new Date(finishedAt.value) : null
  if (!s || !f) return null
  const ms = f.getTime() - s.getTime()
  if (ms <= 0) return '—'
  const mins = Math.floor(ms / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
})

onBeforeUnmount(() => revokeAll())
function goBack() { router.back() }
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Detalhes da OS</h1>
      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium" :class="badge">
        {{ so.data?.value?.status }}
      </span>
    </div>

    <div class="rounded-xl border p-4">
      <h2 class="text-lg font-semibold mb-1">{{ so.data?.value?.title }}</h2>
      <p class="text-sm text-muted-foreground">{{ so.data?.value?.description }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="rounded-xl border p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold">Checklist</h3>
            <div class="text-xs text-muted-foreground" v-if="!so.data?.value?.checklist">Sem checklist.</div>
          </div>

          <template v-if="so.data?.value?.checklist">
            <div class="text-sm text-muted-foreground mb-3">
              Template: <span class="font-medium">{{ so.data?.value?.checklist?.template.name }}</span>
            </div>

            <div class="space-y-2">
              <div
                v-for="it in so.data?.value?.checklist?.template.items"
                :key="it.id"
                class="p-3 rounded-md border"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="h-4 w-4 rounded-sm border flex items-center justify-center"
                    :class="(so.data?.value?.checklist?.answers?.some(a => a.itemId === it.id && a.boolValue)) ? 'bg-green-600 border-green-600' : 'bg-gray-100 border-gray-300'"
                  >
                    <span class="text-[10px] text-white">✓</span>
                  </div>
                  <div class="text-sm">
                    {{ it.label }}
                    <span v-if="it.required" class="text-red-600 text-xs">*</span>
                  </div>
                </div>
                <div
                  class="text-xs text-muted-foreground mt-1"
                  v-if="so.data?.value?.checklist?.answers?.find(a => a.itemId === it.id)?.note"
                >
                  {{ so.data?.value?.checklist?.answers?.find(a => a.itemId === it.id)?.note }}
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="rounded-xl border p-4">
          <h3 class="font-semibold mb-3">Fotos do atendimento</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div v-for="p in gallery" :key="p.id" class="rounded-lg overflow-hidden border">
              <img :src="p.url" alt="" class="w-full h-32 object-cover" />
            </div>
            <div v-if="gallery.length === 0" class="text-sm text-muted-foreground">
              Nenhuma foto disponível.
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-xl border p-4">
          <h3 class="font-semibold mb-3">Dados do atendimento</h3>
          <div class="text-sm space-y-2">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Início</span>
              <span>{{ startedAt ? new Date(startedAt).toLocaleString() : '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Conclusão</span>
              <span>{{ finishedAt ? new Date(finishedAt).toLocaleString() : '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Tempo total</span>
              <span>{{ duration ?? '—' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <button class="px-3 py-2 rounded-md border" @click="goBack">Voltar</button>
    </div>
  </div>
</template>
