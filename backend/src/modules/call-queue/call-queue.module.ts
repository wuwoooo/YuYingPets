import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CallQueueController } from './call-queue.controller';
import { CallQueueService } from './call-queue.service';

@Module({
  imports: [PrismaModule, AuthModule, RealtimeModule],
  controllers: [CallQueueController],
  providers: [CallQueueService],
  exports: [CallQueueService],
})
export class CallQueueModule {}
