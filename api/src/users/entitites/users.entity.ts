import { Role } from '@prisma/client'

export type UserEntity = {
  id?: string
  name: string
  email: string
  passwordHash: string
  role?: Role
}

export type PublicUser = {
  id: string
  name: string
  email: string
  role?: Role
}
