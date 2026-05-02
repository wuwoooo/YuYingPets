import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClassScoreRecordsController } from './class-score-records.controller';
import { ClassScoreRecordsService } from './class-score-records.service';

@Module({
  imports: [AuthModule],
  controllers: [ClassScoreRecordsController],
  providers: [ClassScoreRecordsService],
})
export class ClassScoreRecordsModule {}
