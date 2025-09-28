import { api } from './client'

export type Status = 'OPEN' | 'IN_PROGRESS' | 'DONE'

export type ServiceOrder = {
  id: string
  title: string
  description: string | null
  status: Status
  createdAt: string
  updatedAt: string
  createdById: string
}

export type ListResponse<T> = { total: number; data: T[] }

export async function listServiceOrders(params: {
  q?: string
  status?: Status
  page?: number
  limit?: number
}) {
  const res = await api.get('/service-orders', {
    params: {
      q: params.q || undefined,
      status: params.status || undefined,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    },
  })
  return res.data as ListResponse<ServiceOrder>
}

export async function createServiceOrder(input: { title: string; description?: string }) {
  const res = await api.post('/service-orders', input)
  return res.data as ServiceOrder
}

export async function getServiceOrder(id: string) {
  const res = await api.get(`/service-orders/${id}`)
  return res.data as ServiceOrder
}

export async function updateServiceOrder(
  id: string,
  input: Partial<Pick<ServiceOrder, 'title' | 'description' | 'status'>>,
) {
  const res = await api.put(`/service-orders/${id}`, input)
  return res.data as ServiceOrder
}

export async function deleteServiceOrder(id: string) {
  const res = await api.delete(`/service-orders/${id}`)
  return res.data
}
