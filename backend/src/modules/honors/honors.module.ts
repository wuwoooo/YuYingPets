import { Module } from '@nestjs/common';
import { HonorsController } from './honors.controller';
import { HonorsService } from './honors.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OperationLogModule } from '../operation-log/operation-log.module';

@Module({
  imports: [PrismaModule, AuthModule, OperationLogModule],
  controllers: [HonorsController],
  providers: [HonorsService],
})
export class HonorsModule {}
