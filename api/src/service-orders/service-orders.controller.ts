import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { CreateServiceOrderDto } from './dtos/create-service-order.dto'
import { ListServiceOrdersDto } from './dtos/list-service-orders.dto'
import { ServiceOrderResponseDto } from './dtos/service-order-response.dto'
import { UpdateServiceOrderDto } from './dtos/update-service-order.dto'
import { ServiceOrdersService } from './service-orders.service'

@ApiTags('service-orders')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly service: ServiceOrdersService) { }

  @Get()
  @ApiOkResponse({
    schema: {
      example: {
        total: 2,
        data: [
          {
            id: 'uuid',
            title: 'Instalação inicial',
            description: 'Preparar ambiente',
            status: 'OPEN',
            createdAt: '2025-09-27T12:34:56.000Z',
            updatedAt: '2025-09-27T12:34:56.000Z',
            createdById: 'uuid-user',
          },
        ],
      },
    },
  })
  async list(@Query() query: ListServiceOrdersDto, @CurrentUser() user: any) {
    return this.service.list(query, user?.id)
  }

  @Post()
  @ApiCreatedResponse({ type: ServiceOrderResponseDto })
  async create(@Body() dto: CreateServiceOrderDto, @CurrentUser() user: any) {
    const so = await this.service.create(dto, user.id)
    return ServiceOrderResponseDto.fromEntity(so)
  }

  @Get(':id')
  @ApiOkResponse({
    schema: {
      example: {
        id: '8a8dfeaa-5bae-4420-9833-6cf618260b7b',
        title: 'Instalar whatsapp',
        description: 'Instalar whatsapp no celular do cliente',
        status: 'IN_PROGRESS',
        createdAt: '2025-09-28T22:46:07.994Z',
        updatedAt: '2025-09-28T22:50:07.994Z',
        createdById: '1d9b0454-f728-4975-a941-7ce3dc78c888',
        checklist: {
          id: 'c1f3b7f0-1111-2222-3333-444444444444',
          startedAt: '2025-09-28T22:46:10.000Z',
          finishedAt: null,
          template: {
            id: 'seed-template-1',
            name: 'Checklist Padrão',
            items: [
              { id: 'it-1', label: 'Registrar horário de início', required: true },
              { id: 'it-2', label: 'Validar ambiente/equipamentos', required: true },
              { id: 'it-3', label: 'Observações finais', required: false },
            ],
          },
          answers: [
            { itemId: 'it-1', boolValue: true, textValue: null, note: 'Iniciado 10:30' },
            { itemId: 'it-2', boolValue: true, textValue: null, note: 'OK' },
          ],
        },
      },
    },
  })
  async get(@Param('id') id: string) {
    return this.service.getById(id)
  }

  @Put(':id')
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceOrderDto,
    @CurrentUser() user: any,
  ) {
    const so = await this.service.update(id, dto, { id: user.id, role: user.role })
    return ServiceOrderResponseDto.fromEntity(so)
  }
}
