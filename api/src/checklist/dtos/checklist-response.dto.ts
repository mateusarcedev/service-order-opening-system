import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChecklistInstanceResponseDto {
  @ApiProperty({ example: 'uuid-checklist' }) id: string;
  @ApiProperty({ example: 'uuid-so' }) serviceOrderId: string;
  @ApiProperty({ example: 'uuid-template' }) templateId: string;
  @ApiProperty() startedAt: Date;
  @ApiPropertyOptional() finishedAt?: Date | null;
}
