// src/photos/photos.service.ts
import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { S3Service } from '../infra/storage/s3.service';
import * as photosRepository from './photos.repository';

const MAX_MB = Number(process.env.PHOTO_MAX_SIZE_MB || 5);
const MAX_BYTES = MAX_MB * 1024 * 1024;
const MAX_PER_OS = Number(process.env.PHOTO_MAX_PER_OS || 10);

@Injectable()
export class PhotosService {
  constructor(
    private readonly s3: S3Service,
    @Inject(photosRepository.PHOTOS_REPOSITORY) private readonly repo: photosRepository.PhotosRepository,
  ) { }

  async list(serviceOrderId: string) {
    const items = await this.repo.listByServiceOrder(serviceOrderId);
    // gera URL presignada por item
    const withUrls = await Promise.all(
      items.map(async (r) => {
        const url = await this.s3.getSignedUrl(r.url);
        return { ...r, presignedUrl: url };
      }),
    );
    return withUrls;
  }

  async upload(serviceOrderId: string, file: Express.Multer.File, actor: { id: string; role?: string }) {
    if (!file) throw new BadRequestException('File is required');
    if (file.size > MAX_BYTES) throw new BadRequestException(`Max file size ${MAX_MB}MB`);
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG/PNG allowed');
    }

    const so = await this.repo.getServiceOrderCreator(serviceOrderId);
    if (!so) throw new NotFoundException('Service order not found');
    const isOwnerOrAdmin = actor.role === 'ADMIN' || so.createdById === actor.id;
    if (!isOwnerOrAdmin) throw new ForbiddenException('Not allowed');

    const count = await this.repo.countByServiceOrder(serviceOrderId);
    if (count >= MAX_PER_OS) throw new BadRequestException('Photo limit reached');

    // garante bucket
    await this.s3.ensureBucket();

    // monta key
    const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const key = `os/${serviceOrderId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // upload p/ MinIO
    await this.s3.putObject(key, file.mimetype, file.buffer);

    // grava metadado no DB (url = key)
    const row = await this.repo.create({
      serviceOrderId,
      key,
      mimetype: file.mimetype,
      size: file.size,
    });

    // gera URL presignada p/ retorno
    const presignedUrl = await this.s3.getSignedUrl(key);
    return { ...row, presignedUrl };
  }
}
