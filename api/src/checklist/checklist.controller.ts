// src/checklist/checklist.controller.ts
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChecklistService } from './checklist.service';
import { PatchAnswersDto } from './dtos/answer-checklist.dto';
import { ChecklistInstanceResponseDto } from './dtos/checklist-response.dto';
import { StartChecklistDto } from './dtos/start-checklist.dto';

@ApiTags('checklist')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller()
export class ChecklistController {
  constructor(private readonly service: ChecklistService) { }

  // Listar templates
  @Get('checklist-templates')
  @ApiOkResponse({
    schema: {
      example: [{ id: 'uuid-template', name: 'Checklist Padrão' }],
    },
  })
  listTemplates() {
    return this.service.listTemplates();
  }

  // Iniciar checklist para uma OS
  @Post('service-orders/:id/checklist/start')
  @ApiOkResponse({ type: ChecklistInstanceResponseDto })
  start(@Param('id') serviceOrderId: string, @Body() dto: StartChecklistDto, @CurrentUser() user: any) {
    return this.service.startChecklist(serviceOrderId, dto.templateId, { id: user.id, role: user.role });
  }

  // Responder itens (patch)
  @Patch('service-orders/:id/checklist/answers')
  @ApiOkResponse({
    schema: {
      example: [
        { id: 'uuid-answer', soChecklistId: 'uuid-checklist', itemId: 'uuid-item', boolValue: true, textValue: null, note: null },
      ],
    },
  })
  patchAnswers(@Param('id') serviceOrderId: string, @Body() dto: PatchAnswersDto, @CurrentUser() user: any) {
    return this.service.patchAnswers(serviceOrderId, dto.answers, { id: user.id, role: user.role });
  }

  // Finalizar checklist
  @Post('service-orders/:id/checklist/finish')
  @ApiOkResponse({ type: ChecklistInstanceResponseDto })
  finish(@Param('id') serviceOrderId: string, @CurrentUser() user: any) {
    return this.service.finishChecklist(serviceOrderId, { id: user.id, role: user.role });
  }
}
