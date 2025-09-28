import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Status } from '@prisma/client';
import { CreateServiceOrderDto } from './dtos/create-service-order.dto';
import { ListServiceOrdersDto } from './dtos/list-service-orders.dto';
import { UpdateServiceOrderDto } from './dtos/update-service-order.dto';
import { ServiceOrderEntity } from './entitites/service-order.entity';
import * as serviceOrdersRepository from './service-orders.repository';

const FLOW: Record<Status, number> = { OPEN: 0, IN_PROGRESS: 1, DONE: 2 };

@Injectable()
export class ServiceOrdersService {
  constructor(
    @Inject(serviceOrdersRepository.SERVICE_ORDERS_REPOSITORY)
    private readonly repo: serviceOrdersRepository.ServiceOrdersRepository,
  ) { }

  async list(query: ListServiceOrdersDto, _userId?: string) {
    return this.repo.list({
      status: query.status,
      q: query.q,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    });
  }

  async getById(id: string): Promise<ServiceOrderEntity> {
    const so = await this.repo.findById(id);
    if (!so) throw new NotFoundException('Service order not found');
    return so;
  }

  async create(input: CreateServiceOrderDto, createdById: string) {
    return this.repo.create({
      title: input.title.trim(),
      description: (input.description ?? '').trim(),
      createdById,
    });
  }

  async update(id: string, dto: UpdateServiceOrderDto, actor: { id: string; role?: string }) {
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundException('Service order not found');

    const isOwnerOrAdmin = actor.role === 'ADMIN' || current.createdById === actor.id;
    if (!isOwnerOrAdmin) throw new ForbiddenException('Not allowed');

    if (dto.status) {
      if (FLOW[dto.status] < FLOW[current.status]) {
        throw new BadRequestException('Status regression not allowed');
      }
    }

    return this.repo.update(id, {
      title: dto.title?.trim(),
      description: dto.description?.trim(),
      status: dto.status,
    });
  }

  async remove(id: string, actor: { id: string; role?: string }) {
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundException('Service order not found');

    const isOwnerOrAdmin = actor.role === 'ADMIN' || current.createdById === actor.id;
    if (!isOwnerOrAdmin) throw new ForbiddenException('Not allowed');

    await this.repo.remove(id);
  }
}
