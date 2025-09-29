import { Status } from '@prisma/client'

export type ServiceOrderEntity = {
  id: string
  title: string
  description: string
  status: Status
  createdById: string
  createdAt: Date
  updatedAt: Date
}
