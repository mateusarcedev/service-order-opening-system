import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ServiceOrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
