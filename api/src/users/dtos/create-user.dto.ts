import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({ example: 'Fulano de Tal' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ example: 'admin@kodigos.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MinLength(6)
  password: string

  @ApiPropertyOptional({ example: 'ADMIN' })
  @IsOptional()
  @IsString()
  role?: string
}
