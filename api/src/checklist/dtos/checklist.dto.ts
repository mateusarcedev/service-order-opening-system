import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class AnswerInputDto {
  @ApiProperty()
  @IsString()
  itemId!: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  boolValue?: boolean

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  textValue?: string | null

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  note?: string | null
}

export class PatchChecklistAnswersDto {
  @ApiProperty({ type: [AnswerInputDto] })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => AnswerInputDto)
  inputs!: AnswerInputDto[]
}

export class StartChecklistDto {
  @ApiProperty()
  @IsString()
  templateId!: string
}
