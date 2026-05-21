import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ScoreRecordsModule } from '../score-records/score-records.module';
import { ClassScoreRecordsController } from './class-score-records.controller';
import { ClassScoreRecordsService } from './class-score-records.service';

@Module({
  imports: [AuthModule, ScoreRecordsModule],
  controllers: [ClassScoreRecordsController],
  providers: [ClassScoreRecordsService],
})
export class ClassScoreRecordsModule {}
