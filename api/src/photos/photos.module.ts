import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { S3Module } from '../infra/storage/s3.module';
import { PhotosController } from './photos.controller';
import { PHOTOS_REPOSITORY, PrismaPhotosRepository } from './photos.repository';
import { PhotosService } from './photos.service';

@Module({
  imports: [
    PrismaModule,
    S3Module,
    MulterModule.register({ storage: undefined }),
  ],
  controllers: [PhotosController],
  providers: [
    PhotosService,
    { provide: PHOTOS_REPOSITORY, useClass: PrismaPhotosRepository },
  ],
})
export class PhotosModule { }
