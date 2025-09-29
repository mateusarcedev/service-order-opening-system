import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator'

class NewChecklistItemDto {
  @ApiProperty({ example: 'Validar ambiente/equipamentos' })
  @IsString()
  @MinLength(2)
  label: string

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean
}

class NewChecklistDto {
  @ApiProperty({ example: 'Checklist Padrão' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ type: [NewChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewChecklistItemDto)
  items: NewChecklistItemDto[]
}

export class CreateServiceOrderDto {
  @ApiProperty({ example: 'Instalação inicial' })
  @IsString()
  @MinLength(2)
  title: string

  @ApiPropertyOptional({ example: 'Preparar ambiente e validar acesso.' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ format: 'uuid', description: 'Template já existente' })
  @IsOptional()
  @IsUUID()
  templateId?: string

  @ApiPropertyOptional({ type: NewChecklistDto, description: 'Criar template novo e vincular' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewChecklistDto)
  newChecklist?: NewChecklistDto
}
