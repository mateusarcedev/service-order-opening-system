import type { Status } from '@prisma/client';

export type ServiceOrderEntity = {
  id?: string;
  title: string;
  description: string;
  status: Status;
  createdAt?: Date;
  updatedAt?: Date;
  createdById: string;
};
