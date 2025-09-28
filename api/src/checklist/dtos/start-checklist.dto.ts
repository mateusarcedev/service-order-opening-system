import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class StartChecklistDto {
  @ApiProperty({ example: 'uuid-template' })
  @IsString()
  @IsUUID()
  templateId: string;
}
