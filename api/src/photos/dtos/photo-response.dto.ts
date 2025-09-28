import { ApiProperty } from '@nestjs/swagger';

export class PhotoResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() serviceOrderId: string;
  @ApiProperty() key: string;
  @ApiProperty() url: string;
  @ApiProperty() takenAt: Date;
  @ApiProperty() mimetype: string;
  @ApiProperty() size: number;

  static fromRow(r: any, url: string): PhotoResponseDto {
    return {
      id: r.id,
      serviceOrderId: r.serviceOrderId,
      key: r.url || r.key,
      url,
      takenAt: r.takenAt,
      mimetype: r.mimetype ?? 'application/octet-stream',
      size: r.size ?? 0,
    };
  }
}
