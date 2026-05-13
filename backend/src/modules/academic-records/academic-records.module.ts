import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AcademicRecordsController } from './academic-records.controller';
import { AcademicRecordsService } from './academic-records.service';

@Module({
  imports: [AuthModule],
  controllers: [AcademicRecordsController],
  providers: [AcademicRecordsService],
})
export class AcademicRecordsModule {}
