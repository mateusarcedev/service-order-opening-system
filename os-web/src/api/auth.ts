import { api } from './client';
export type LoginInput = { email: string; password: string };
export async function login(data: LoginInput) {
  const res = await api.post('/auth/login', data);
  return res.data as { accessToken: string };
}
