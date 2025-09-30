import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ChecklistService } from './checklist.service'
import { PatchChecklistAnswersDto } from './dtos/checklist.dto'
import { StartChecklistDto } from './dtos/start-checklist.dto'


@ApiTags('checklist')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('checklist')
export class ChecklistController {
  constructor(private readonly service: ChecklistService) { }

  @Get('templates')
  async listTemplates() {
    return this.service.listTemplates()
  }

  @Post('service-orders/:id/start')
  async startChecklist(
    @Param('id') serviceOrderId: string,
    @Body() dto: StartChecklistDto,
    @CurrentUser() user: any,
  ) {
    return this.service.startChecklist(serviceOrderId, dto.templateId, {
      id: user.id,
      role: user.role,
    })
  }

  @Get('service-orders/:id')
  async getDetail(@Param('id') serviceOrderId: string) {
    return this.service.getDetailForSO(serviceOrderId)
  }

  @Patch('service-orders/:id/answers')
  @ApiOkResponse({
    schema: {
      example: [
        {
          id: 'answer-id',
          soChecklistId: 'checklist-id',
          itemId: 'item-id',
          boolValue: true,
          textValue: null,
          note: 'ok',
        },
      ],
    },
  })
  async patchAnswers(
    @Param('id') serviceOrderId: string,
    @Body() body: PatchChecklistAnswersDto,
    @CurrentUser() user: any,
  ) {
    return this.service.patchAnswers(serviceOrderId, body.inputs, {
      id: user.id,
      role: user.role,
    })
  }

  @Post('service-orders/:id/finish')
  async finish(@Param('id') serviceOrderId: string, @CurrentUser() user: any) {
    return this.service.finishChecklist(serviceOrderId, {
      id: user.id,
      role: user.role,
    })
  }
}
