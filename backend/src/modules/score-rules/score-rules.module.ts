import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ScoreRulesController } from './score-rules.controller';
import { ScoreRulesService } from './score-rules.service';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [ScoreRulesController],
  providers: [ScoreRulesService],
})
export class ScoreRulesModule {}
