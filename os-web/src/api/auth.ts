import { api } from './client';

export type LoginInput = { email: string; password: string }
export type LoginOutput = { accessToken: string }
export type MeOutput = { id: string; name: string; email: string; role?: string | null }
export type Role = 'MANAGER' | 'TECH' | 'VIEWER'

export async function login(data: LoginInput): Promise<LoginOutput> {
  const res = await api.post('/auth/login', data)
  return res.data
}

export async function me(): Promise<MeOutput> {
  const res = await api.get('/auth/me')
  return res.data
}

export async function register(input: {
  name: string
  email: string
  password: string
  role?: Role
}) {
  const payload = { ...input, role: (input.role ?? 'VIEWER') as Role }
  const { data } = await api.post('/users', payload)
  return data as { accessToken: string }
}
