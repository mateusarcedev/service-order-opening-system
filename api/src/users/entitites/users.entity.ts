export type UserEntity = {
  id?: string
  name: string
  email: string
  passwordHash: string
  role?: string | null
}

export type PublicUser = {
  id: string
  name: string
  email: string
  role?: string | null
}
