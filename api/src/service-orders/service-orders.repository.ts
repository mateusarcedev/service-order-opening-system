import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';
import { ServiceOrderEntity } from './entitites/service-order.entity';


export const SERVICE_ORDERS_REPOSITORY = Symbol('SERVICE_ORDERS_REPOSITORY');

export type ListParams = {
  status?: Status;
  q?: string;
  page: number;
  limit: number;
  createdById?: string;
};

export interface ServiceOrdersRepository {
  list(params: ListParams): Promise<{ data: ServiceOrderEntity[]; total: number }>;
  findById(id: string): Promise<ServiceOrderEntity | null>;
  create(data: Omit<ServiceOrderEntity, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ServiceOrderEntity>;
  update(
    id: string,
    data: Partial<Omit<ServiceOrderEntity, 'id' | 'createdById' | 'createdAt' | 'updatedAt'>>,
  ): Promise<ServiceOrderEntity>;
  remove(id: string): Promise<void>;
}

@Injectable()
export class PrismaServiceOrdersRepository implements ServiceOrdersRepository {
  constructor(private readonly prisma: PrismaService) { }

  async list(params: ListParams) {
    const { page, limit, q, status, createdById } = params;
    const where: any = {};
    if (status) where.status = status;
    if (createdById) where.createdById = createdById;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.serviceOrder.count({ where }),
      this.prisma.serviceOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, data: rows.map(this.map) };
  }

  async findById(id: string) {
    const so = await this.prisma.serviceOrder.findUnique({ where: { id } });
    return so ? this.map(so) : null;
  }

  async create(data: Omit<ServiceOrderEntity, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
    const so = await this.prisma.serviceOrder.create({
      data: {
        title: data.title,
        description: data.description,
        status: 'OPEN',
        createdById: data.createdById,
      },
    });
    return this.map(so);
  }

  async update(
    id: string,
    data: Partial<Omit<ServiceOrderEntity, 'id' | 'createdById' | 'createdAt' | 'updatedAt'>>,
  ) {
    const so = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status ?? undefined,
      },
    });
    return this.map(so);
  }

  async remove(id: string) {
    await this.prisma.serviceOrder.delete({ where: { id } });
  }

  private map = (r: any): ServiceOrderEntity => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    createdById: r.createdById,
  });
}
