import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GroupScoreRecordsController } from './group-score-records.controller';
import { GroupScoreRecordsService } from './group-score-records.service';

@Module({
  imports: [AuthModule],
  controllers: [GroupScoreRecordsController],
  providers: [GroupScoreRecordsService],
})
export class GroupScoreRecordsModule {}
