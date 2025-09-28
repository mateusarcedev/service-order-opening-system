import { api } from './client';

export async function listTemplates() {
  const { data } = await api.get('/checklist-templates')
  return data as { id: string; name: string }[]
}
export async function startChecklist(osId: string, templateId: string) {
  const { data } = await api.post(`/service-orders/${osId}/checklist/start`, { templateId })
  return data
}
export async function patchAnswers(osId: string, answers: { itemId: string; boolValue?: boolean; textValue?: string; note?: string }[]) {
  const { data } = await api.patch(`/service-orders/${osId}/checklist/answers`, { answers })
  return data
}
export async function finishChecklist(osId: string) {
  const { data } = await api.post(`/service-orders/${osId}/checklist/finish`)
  return data
}
