import { Module } from '@nestjs/common';
import { AcademicRecordsModule } from '../academic-records/academic-records.module';
import { AdminInsightsModule } from '../admin-insights/admin-insights.module';
import { AuthModule } from '../auth/auth.module';
import { TeacherInsightsController } from './teacher-insights.controller';
import { TeacherInsightsService } from './teacher-insights.service';

@Module({
  imports: [AuthModule, AcademicRecordsModule, AdminInsightsModule],
  controllers: [TeacherInsightsController],
  providers: [TeacherInsightsService],
})
export class TeacherInsightsModule {}
