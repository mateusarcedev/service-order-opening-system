import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChecklistModule } from './checklist/checklist.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { S3Module } from './infra/storage/s3.module';
import { PhotosModule } from './photos/photos.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ServiceOrdersModule,
    ChecklistModule,
    PhotosModule,
    S3Module,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
