import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { CurrentUser } from './decorators/current-user.decorator'
import { LoginDto } from './dtos/login.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) { }

  @Post('login')
  @ApiOkResponse({
    schema: {
      example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validateUser(dto.email, dto.password)
    return this.auth.login({ id: user.id, role: (user as any).role })
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({
    schema: {
      example: {
        id: 'uuid',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    },
  })
  me(@CurrentUser() user: any) {
    return user
  }
}
