import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GroupScoreAdjustDto } from './dto/group-score-adjust.dto';
import { GroupScoreResetDto } from './dto/group-score-reset.dto';
import { GroupScoreRecordsService } from './group-score-records.service';

@ApiTags('GroupScoreRecords')
@Controller('classes/:classId/group-scores')
export class GroupScoreRecordsController {
  constructor(private readonly groupScoreRecordsService: GroupScoreRecordsService) {}

  @Get('ranking')
  ranking(
    @Headers('authorization') authorization: string | undefined,
    @Param('classId') classId: string,
  ) {
    return this.groupScoreRecordsService.ranking(authorization, Number(classId));
  }

  @Get('records')
  records(
    @Headers('authorization') authorization: string | undefined,
    @Param('classId') classId: string,
    @Query() query: Record<string, string>,
  ) {
    return this.groupScoreRecordsService.list(authorization, Number(classId), query);
  }

  @Post('adjust')
  adjust(
    @Headers('authorization') authorization: string | undefined,
    @Param('classId') classId: string,
    @Body() body: GroupScoreAdjustDto,
  ) {
    return this.groupScoreRecordsService.adjust(authorization, Number(classId), body);
  }

  @Post('reset')
  reset(
    @Headers('authorization') authorization: string | undefined,
    @Param('classId') classId: string,
    @Body() body: GroupScoreResetDto,
  ) {
    return this.groupScoreRecordsService.reset(authorization, Number(classId), body);
  }
}
