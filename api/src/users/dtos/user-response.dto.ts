import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { PublicUser } from '../entitites/users.entity'

export class UserResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string

  @ApiProperty({ example: 'Admin' })
  name: string

  @ApiProperty({ example: 'admin@example.com' })
  email: string

  @ApiPropertyOptional({ example: 'ADMIN' })
  role?: string | null

  static fromEntity(u: PublicUser): UserResponseDto {
    return { id: u.id, name: u.name, email: u.email, role: u.role ?? null }
  }
}
