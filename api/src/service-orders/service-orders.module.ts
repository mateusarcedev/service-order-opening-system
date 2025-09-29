import { Module } from '@nestjs/common';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { ServiceOrdersController } from './service-orders.controller';
import {
  PrismaServiceOrdersRepository,
  SERVICE_ORDERS_REPOSITORY,
} from './service-orders.repository';
import { ServiceOrdersService } from './service-orders.service';
import { ChecklistModule } from 'src/checklist/checklist.module';

@Module({
  imports: [PrismaModule, ChecklistModule],
  controllers: [ServiceOrdersController],
  providers: [
    ServiceOrdersService,
    { provide: SERVICE_ORDERS_REPOSITORY, useClass: PrismaServiceOrdersRepository },
  ],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule { }
