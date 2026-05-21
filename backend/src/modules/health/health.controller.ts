import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    const checkedAt = new Date().toISOString();
    const uptimeSeconds = Math.round(process.uptime());

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        checkedAt,
        uptimeSeconds,
        dependencies: {
          database: 'ok',
        },
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'degraded',
        checkedAt,
        uptimeSeconds,
        dependencies: {
          database: 'error',
        },
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
