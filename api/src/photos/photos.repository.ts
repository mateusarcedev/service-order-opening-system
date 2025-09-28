// src/photos/photos.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import type { PhotoEntity } from './entities/photo.entity';

export const PHOTOS_REPOSITORY = Symbol('PHOTOS_REPOSITORY');

export interface PhotosRepository {
  create(data: Omit<PhotoEntity, 'id' | 'takenAt'>): Promise<any>;
  listByServiceOrder(serviceOrderId: string): Promise<any[]>;
  countByServiceOrder(serviceOrderId: string): Promise<number>;
  getServiceOrderCreator(serviceOrderId: string): Promise<{ createdById: string } | null>;
}

@Injectable()
export class PrismaPhotosRepository implements PhotosRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: Omit<PhotoEntity, 'id' | 'takenAt'>) {
    return this.prisma.serviceOrderPhoto.create({
      data: {
        serviceOrderId: data.serviceOrderId,
        url: data.key,
        takenAt: new Date(),
      },
    });
  }

  async listByServiceOrder(serviceOrderId: string) {
    return this.prisma.serviceOrderPhoto.findMany({
      where: { serviceOrderId },
      orderBy: { takenAt: 'desc' },
    });
  }

  async countByServiceOrder(serviceOrderId: string) {
    return this.prisma.serviceOrderPhoto.count({ where: { serviceOrderId } });
  }

  async getServiceOrderCreator(serviceOrderId: string) {
    const so = await this.prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      select: { createdById: true },
    });
    return so ?? null;
  }
}
