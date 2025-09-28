import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateServiceOrderDto } from './dtos/create-service-order.dto';
import { ListServiceOrdersDto } from './dtos/list-service-orders.dto';
import { ServiceOrderResponseDto } from './dtos/service-order-response.dto';
import { UpdateServiceOrderDto } from './dtos/update-service-order.dto';
import { ServiceOrdersService } from './service-orders.service';

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
        total: 1,
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
    return this.service.list(query, user?.id);
  }

  @Post()
  @ApiCreatedResponse({ type: ServiceOrderResponseDto })
  async create(@Body() dto: CreateServiceOrderDto, @CurrentUser() user: any) {
    const so = await this.service.create(dto, user.id);
    return ServiceOrderResponseDto.fromEntity(so);
  }

  @Get(':id')
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  async get(@Param('id') id: string) {
    const so = await this.service.getById(id);
    return ServiceOrderResponseDto.fromEntity(so);
  }

  @Put(':id')
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceOrderDto,
    @CurrentUser() user: any,
  ) {
    const so = await this.service.update(id, dto, { id: user.id, role: user.role });
    return ServiceOrderResponseDto.fromEntity(so);
  }
}
