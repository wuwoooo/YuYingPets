import { Module } from '@nestjs/common';
import { AcademicRecordsModule } from '../academic-records/academic-records.module';
import { AdminConfigModule } from '../admin-config/admin-config.module';
import { AdminInsightsModule } from '../admin-insights/admin-insights.module';
import { AuthModule } from '../auth/auth.module';
import { ClassesModule } from '../classes/classes.module';
import { DisplayModule } from '../display/display.module';
import { HonorsModule } from '../honors/honors.module';
import { RewardsModule } from '../rewards/rewards.module';
import { ScoreRecordsModule } from '../score-records/score-records.module';
import { ScoreRulesModule } from '../score-rules/score-rules.module';
import { StudentsModule } from '../students/students.module';
import { ProjectionController } from './projection.controller';
import { ProjectionService } from './projection.service';

@Module({
  imports: [
    AcademicRecordsModule,
    AdminConfigModule,
    AdminInsightsModule,
    AuthModule,
    ClassesModule,
    DisplayModule,
    HonorsModule,
    RewardsModule,
    ScoreRecordsModule,
    ScoreRulesModule,
    StudentsModule,
  ],
  controllers: [ProjectionController],
  providers: [ProjectionService],
})
export class ProjectionModule {}
