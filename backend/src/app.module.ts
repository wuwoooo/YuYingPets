import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './modules/ai/ai.module';
import { AcademicRecordsModule } from './modules/academic-records/academic-records.module';
import { AdminConfigModule } from './modules/admin-config/admin-config.module';
import { AdminInsightsModule } from './modules/admin-insights/admin-insights.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClassesModule } from './modules/classes/classes.module';
import { ClassScoreRecordsModule } from './modules/class-score-records/class-score-records.module';
import { DisplayModule } from './modules/display/display.module';
import { HonorsModule } from './modules/honors/honors.module';
import { OperationLogModule } from './modules/operation-log/operation-log.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { ScoreRecordsModule } from './modules/score-records/score-records.module';
import { ScoreRulesModule } from './modules/score-rules/score-rules.module';
import { StudentsModule } from './modules/students/students.module';
import { TeacherObservationsModule } from './modules/teacher-observations/teacher-observations.module';
import { TeacherSchedulesModule } from './modules/teacher-schedules/teacher-schedules.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    OperationLogModule,
    RealtimeModule,
    AcademicRecordsModule,
    AdminConfigModule,
    AdminInsightsModule,
    AuthModule,
    DisplayModule,
    ClassesModule,
    ClassScoreRecordsModule,
    StudentsModule,
    ScoreRulesModule,
    ScoreRecordsModule,
    RewardsModule,
    HonorsModule,
    AiModule,
    TeacherObservationsModule,
    TeacherSchedulesModule,
  ],
})
export class AppModule {}
