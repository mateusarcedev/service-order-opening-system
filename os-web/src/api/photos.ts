import { api } from './client';

export async function listPhotos(osId: string) {
  const { data } = await api.get(`/service-orders/${osId}/photos`)
  return data as { id: string; key: string; presignedUrl: string; takenAt: string }[]
}
export async function uploadPhoto(osId: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post(`/service-orders/${osId}/photos`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
