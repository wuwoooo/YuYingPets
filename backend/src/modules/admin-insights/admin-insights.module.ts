import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OperationLogModule } from '../operation-log/operation-log.module';
import { AdminInsightsController } from './admin-insights.controller';
import { AdminInsightsService } from './admin-insights.service';

@Module({
  imports: [PrismaModule, AuthModule, OperationLogModule, ConfigModule],
  controllers: [AdminInsightsController],
  providers: [AdminInsightsService],
})
export class AdminInsightsModule {}
