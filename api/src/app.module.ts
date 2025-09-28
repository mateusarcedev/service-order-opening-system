import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChecklistModule } from './checklist/checklist.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ServiceOrdersModule,
    ChecklistModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
