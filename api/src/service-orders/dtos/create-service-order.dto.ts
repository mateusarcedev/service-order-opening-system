import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateServiceOrderDto {
  @ApiProperty({ example: 'Instalação inicial' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({ example: 'Preparar ambiente e validar acesso.' })
  @IsOptional()
  @IsString()
  description?: string;
}
