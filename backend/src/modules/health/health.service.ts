import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { rootLogger } from '@/logging/root-logger';

const healthLogger = rootLogger.child({ context: 'health' });

export type HealthStatusPayload = {
  status: 'ok' | 'degraded';
  checkedAt: string;
  uptimeSeconds: number;
  dependencies: {
    database: 'ok' | 'error';
  };
  error?: string;
};

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatusPayload> {
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
      const message = error instanceof Error ? error.message : String(error);
      healthLogger.warn({
        msg: 'healthcheck_degraded',
        checkedAt,
        uptimeSeconds,
        dependency: 'database',
        error: message,
      });
      return {
        status: 'degraded',
        checkedAt,
        uptimeSeconds,
        dependencies: {
          database: 'error',
        },
        error: message,
      };
    }
  }
}
