import { Module } from '@nestjs/common';
import { StudentPetsController } from './student-pets.controller';
import { StudentPetsService } from './student-pets.service';

@Module({
  controllers: [StudentPetsController],
  providers: [StudentPetsService],
  exports: [StudentPetsService],
})
export class StudentPetsModule {}
