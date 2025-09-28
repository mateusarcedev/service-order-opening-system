import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateServiceOrderDto {
  @ApiPropertyOptional({ example: 'Instalação fase 2' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional({ example: 'Ajustes finais' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Status, example: Status.IN_PROGRESS })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
