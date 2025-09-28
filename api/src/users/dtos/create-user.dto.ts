import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator'

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

  @ApiPropertyOptional({ enum: Role, example: Role.TECH })
  @IsEnum(Role)
  role: Role
}
