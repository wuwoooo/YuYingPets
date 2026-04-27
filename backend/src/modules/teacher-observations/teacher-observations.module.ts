import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OperationLogModule } from '../operation-log/operation-log.module';
import { TeacherObservationsController } from './teacher-observations.controller';
import { TeacherObservationsService } from './teacher-observations.service';

@Module({
  imports: [PrismaModule, AuthModule, OperationLogModule, ConfigModule],
  controllers: [TeacherObservationsController],
  providers: [TeacherObservationsService],
})
export class TeacherObservationsModule {}
