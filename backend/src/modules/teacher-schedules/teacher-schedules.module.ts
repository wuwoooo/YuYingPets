import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TeacherSchedulesController } from './teacher-schedules.controller';
import { TeacherSchedulesService } from './teacher-schedules.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TeacherSchedulesController],
  providers: [TeacherSchedulesService],
})
export class TeacherSchedulesModule {}
