import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { CreateUserDto } from './dtos/create-user.dto'
import { UserResponseDto } from './dtos/user-response.dto'
import { UsersService } from './users.service'

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) { }

  @Post()
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.users.create(dto)
    return UserResponseDto.fromEntity(user)
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: UserResponseDto })
  async me(@CurrentUser() user: any): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(user)
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: UserResponseDto })
  async getById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.users.findById(id)
    return UserResponseDto.fromEntity(user)
  }
}
