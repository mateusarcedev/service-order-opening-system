// src/photos/photos.controller.ts
import { Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PhotosService } from './photos.service';

@ApiTags('photos')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('service-orders/:id/photos')
export class PhotosController {
  constructor(private readonly service: PhotosService) { }

  @Get()
  @ApiOkResponse({
    schema: {
      example: [
        {
          id: 'uuid-photo',
          serviceOrderId: 'uuid-os',
          url: 'os/uuid-os/xxx.jpg',
          takenAt: '2025-09-27T12:00:00.000Z',
          presignedUrl: 'http://localhost:9000/os-photos/os/uuid-os/xxx.jpg?...',
        },
      ],
    },
  })
  async list(@Param('id') serviceOrderId: string) {
    return this.service.list(serviceOrderId);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: Number(process.env.PHOTO_MAX_SIZE_MB || 5) * 1024 * 1024 } }))
  async upload(@Param('id') serviceOrderId: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.service.upload(serviceOrderId, file, { id: user.id, role: user.role });
  }
}
