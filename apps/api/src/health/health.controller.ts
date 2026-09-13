import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOkResponse({ description: 'La API y PostgreSQL están disponibles.' })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no está disponible.' })
  async check(@Res({ passthrough: true }) response: Response) {
    const result = await this.health.check();
    if (result.status === 'error') response.status(HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }
}
