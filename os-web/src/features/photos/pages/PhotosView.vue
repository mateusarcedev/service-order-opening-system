<script setup lang="ts">
import { api } from '@/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

const route = useRoute()
const osId = route.params.id as string
const qc = useQueryClient()

type Photo = { id: string; key: string; presignedUrl: string; takenAt: string }

async function listPhotos(osId: string): Promise<Photo[]> {
  const { data } = await api.get(`/service-orders/${osId}/photos`)
  return data
}
async function uploadPhoto(osId: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post(`/service-orders/${osId}/photos`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

const photosQ = useQuery({
  queryKey: ['photos', osId],
  queryFn: () => listPhotos(osId),
  staleTime: 10_000,
  placeholderData: (prev) => prev,
})

const file = ref<File | null>(null)

const uploadMut = useMutation({
  mutationFn: () => {
    if (!file.value) throw new Error('Selecione um arquivo')
    return uploadPhoto(osId, file.value)
  },
  onSuccess: () => {
    toast.success('Foto enviada')
    file.value = null
    qc.invalidateQueries({ queryKey: ['photos', osId] })
  },
  onError: (e: any) => {
    toast.error(e?.response?.data?.message ?? 'Falha no upload')
  },
})

const photos = computed(() => photosQ.data?.value ?? [])
</script>

<template>
  <div class="p-6">
    <div class="rounded-xl border p-4">
      <h2 class="text-lg font-semibold mb-3">Fotos da OS</h2>

      <div class="flex items-center gap-3 mb-4">
        <input
          type="file"
          accept="image/jpeg,image/png"
          @change="(e:any) => (file = e.target.files?.[0] ?? null)"
        />
        <button
          class="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
          :disabled="!file || uploadMut.isPending.value"
          @click="uploadMut.mutate()"
        >
          {{ uploadMut.isPending.value ? 'Enviando…' : 'Enviar' }}
        </button>
      </div>

      <p v-if="photosQ.isError.value" class="text-red-600 text-sm mb-2">
        {{ (photosQ.error?.value as any)?.response?.data?.message || (photosQ.error?.value as any)?.message }}
      </p>
      <p v-else-if="photosQ.isLoading.value">Carregando…</p>
      <p v-else-if="photos.length === 0" class="text-sm text-muted-foreground">Nenhuma foto.</p>

      <div v-else class="grid sm:grid-cols-3 md:grid-cols-4 gap-3">
        <div v-for="p in photos" :key="p.id" class="border rounded-md p-2">
          <img :src="p.presignedUrl" alt="" class="w-full h-40 object-cover rounded" />
          <p class="text-xs text-muted-foreground mt-1">{{ new Date(p.takenAt).toLocaleString() }}</p>
        </div>
      </div>

      <div class="mt-4">
        <button class="px-4 py-2 rounded-md border" @click="$router.back()">Voltar</button>
      </div>
    </div>
  </div>
</template>
