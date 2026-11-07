import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto } from '../common/api-error.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Проверка соединения с базой данных' })
  @ApiResponse({ status: 200, description: 'База данных доступна' })
  @ApiResponse({ status: 503, type: ApiErrorDto, description: 'База данных недоступна' })
  check(): Promise<{ status: string }> {
    return this.service.check();
  }
}
