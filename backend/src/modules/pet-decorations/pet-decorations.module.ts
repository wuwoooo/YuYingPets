import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { PetDecorationsController } from './pet-decorations.controller';
import { PetDecorationsService } from './pet-decorations.service';

@Module({
  imports: [AuthModule],
  controllers: [PetDecorationsController],
  providers: [PetDecorationsService],
  exports: [PetDecorationsService],
})
export class PetDecorationsModule {}
