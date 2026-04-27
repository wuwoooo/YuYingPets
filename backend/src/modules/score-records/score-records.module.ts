import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ScoreRecordsController } from './score-records.controller';
import { ScoreRecordsService } from './score-records.service';

@Module({
  imports: [AuthModule],
  controllers: [ScoreRecordsController],
  providers: [ScoreRecordsService],
})
export class ScoreRecordsModule {}
