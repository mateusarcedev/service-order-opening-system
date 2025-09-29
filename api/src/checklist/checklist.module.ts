import { Module } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { ChecklistController } from './checklist.controller';
import { CHECKLIST_REPOSITORY, PrismaChecklistRepository } from './checklist.repository';
import { ChecklistService } from './checklist.service';

@Module({
  controllers: [ChecklistController],
  providers: [
    ChecklistService,
    PrismaService,
    { provide: CHECKLIST_REPOSITORY, useClass: PrismaChecklistRepository },
  ],
  exports: [ChecklistService],
})
export class ChecklistModule { }
