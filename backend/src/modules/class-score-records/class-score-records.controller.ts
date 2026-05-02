import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClassScoreRecordBatchDto } from './dto/class-score-record-batch.dto';
import { ClassScoreRecordCreateDto } from './dto/class-score-record-create.dto';
import { ClassScoreRecordsService } from './class-score-records.service';

@ApiTags('ClassScoreRecords')
@Controller('class-score-records')
export class ClassScoreRecordsController {
  constructor(private readonly classScoreRecordsService: ClassScoreRecordsService) {}

  @Get()
  list(@Headers('authorization') authorization: string | undefined, @Query() query: Record<string, string>) {
    return this.classScoreRecordsService.list(authorization, query);
  }

  @Get('rankings')
  rankings(@Headers('authorization') authorization: string | undefined, @Query() query: Record<string, string>) {
    return this.classScoreRecordsService.rankings(authorization, query);
  }

  @Post()
  create(@Headers('authorization') authorization: string | undefined, @Body() body: ClassScoreRecordCreateDto) {
    return this.classScoreRecordsService.create(authorization, body);
  }

  @Post('batch')
  batch(@Headers('authorization') authorization: string | undefined, @Body() body: ClassScoreRecordBatchDto) {
    return this.classScoreRecordsService.batch(authorization, body);
  }
}
