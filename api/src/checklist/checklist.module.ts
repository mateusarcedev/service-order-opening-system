import { Module } from '@nestjs/common';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { ChecklistController } from './checklist.controller';
import { CHECKLIST_REPOSITORY, PrismaChecklistRepository } from './checklist.repository';
import { ChecklistService } from './checklist.service';

@Module({
  imports: [PrismaModule],
  controllers: [ChecklistController],
  providers: [
    ChecklistService,
    { provide: CHECKLIST_REPOSITORY, useClass: PrismaChecklistRepository },
  ],
  exports: [ChecklistService],
})
export class ChecklistModule { }
