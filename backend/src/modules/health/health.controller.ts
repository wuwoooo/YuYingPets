import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async health() {
    const payload = await this.healthService.check();
    if (payload.status === 'ok') {
      return payload;
    }
    throw new ServiceUnavailableException(payload);
  }
}
