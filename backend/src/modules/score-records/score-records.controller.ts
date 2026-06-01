import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ScoreRecordsService } from './score-records.service';
import { ScoreRecordCreateDto } from './dto/score-record-create.dto';
import { ScoreRecordBatchDto } from './dto/score-record-batch.dto';
import { ScoreRecordGroupDto } from './dto/score-record-group.dto';
import { ScoreRecordReverseDto } from './dto/score-record-reverse.dto';

@ApiTags('ScoreRecords')
@Controller('score-records')
export class ScoreRecordsController {
  constructor(private readonly scoreRecordsService: ScoreRecordsService) {}

  @Get()
  list(@Headers('authorization') authorization: string | undefined, @Query() query: Record<string, string>) {
    return this.scoreRecordsService.list(authorization, query);
  }

  @Post()
  create(@Headers('authorization') authorization: string | undefined, @Body() body: ScoreRecordCreateDto) {
    return this.scoreRecordsService.create(authorization, body);
  }

  @Post('batch')
  batch(@Headers('authorization') authorization: string | undefined, @Body() body: ScoreRecordBatchDto) {
    return this.scoreRecordsService.batch(authorization, body);
  }

  @Post('group')
  group(@Headers('authorization') authorization: string | undefined, @Body() body: ScoreRecordGroupDto) {
    return this.scoreRecordsService.group(authorization, body);
  }

  @Post(':id/reverse')
  reverse(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: ScoreRecordReverseDto,
  ) {
    return this.scoreRecordsService.reverse(authorization, Number(id), body);
  }
}
