import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/infra/prisma/prisma.module'
import { UsersController } from './users.controller'
import { UsersFactory } from './users.factory'
import { USERS_REPOSITORY, UsersPrismaRepository } from './users.repository'
import { UsersService } from './users.service'

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersFactory,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersPrismaRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule { }
