import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class ChecklistAnswerInput {
  @ApiProperty({ example: 'uuid-item' })
  @IsString()
  @IsUUID()
  itemId: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  boolValue?: boolean;

  @ApiPropertyOptional({ example: 'Observação livre' })
  @IsOptional()
  @IsString()
  textValue?: string;

  @ApiPropertyOptional({ example: 'Anotação interna' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class PatchAnswersDto {
  @ApiProperty({ type: [ChecklistAnswerInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistAnswerInput)
  answers: ChecklistAnswerInput[];
}
