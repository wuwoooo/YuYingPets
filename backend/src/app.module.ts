import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './modules/ai/ai.module';
import { AdminConfigModule } from './modules/admin-config/admin-config.module';
import { AdminInsightsModule } from './modules/admin-insights/admin-insights.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClassesModule } from './modules/classes/classes.module';
import { DisplayModule } from './modules/display/display.module';
import { HonorsModule } from './modules/honors/honors.module';
import { OperationLogModule } from './modules/operation-log/operation-log.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { ScoreRecordsModule } from './modules/score-records/score-records.module';
import { ScoreRulesModule } from './modules/score-rules/score-rules.module';
import { StudentsModule } from './modules/students/students.module';
import { TeacherObservationsModule } from './modules/teacher-observations/teacher-observations.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    OperationLogModule,
    RealtimeModule,
    AdminConfigModule,
    AdminInsightsModule,
    AuthModule,
    DisplayModule,
    ClassesModule,
    StudentsModule,
    ScoreRulesModule,
    ScoreRecordsModule,
    RewardsModule,
    HonorsModule,
    AiModule,
    TeacherObservationsModule,
  ],
})
export class AppModule {}
