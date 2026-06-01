import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '@/common/auth/public.decorator';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  async health() {
    const payload = await this.healthService.check();
    if (payload.status === 'ok') {
      return payload;
    }
    throw new ServiceUnavailableException(payload);
  }
}
