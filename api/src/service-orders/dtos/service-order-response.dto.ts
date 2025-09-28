import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { ServiceOrderEntity } from '../entitites/service-order.entity';


export class ServiceOrderResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Instalação inicial' })
  title: string;

  @ApiPropertyOptional({ example: 'Preparar ambiente e validar acesso.' })
  description?: string | null;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiProperty({ example: '2025-09-27T12:34:56.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-09-27T13:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'uuid-do-criador' })
  createdById: string;

  static fromEntity(e: ServiceOrderEntity): ServiceOrderResponseDto {
    return {
      id: e.id!,
      title: e.title,
      description: e.description ?? null,
      status: e.status,
      createdAt: e.createdAt!,
      updatedAt: e.updatedAt!,
      createdById: e.createdById,
    };
  }
}
