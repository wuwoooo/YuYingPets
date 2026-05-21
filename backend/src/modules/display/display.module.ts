import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { DisplayController } from './display.controller';
import { DisplayService } from './display.service';

@Module({
  imports: [AuthModule, AiModule],
  controllers: [DisplayController],
  providers: [DisplayService],
})
export class DisplayModule {}
