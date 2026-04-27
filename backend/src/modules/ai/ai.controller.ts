import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiSummaryQueryDto } from './dto/ai-summary-query.dto';
import { AiGenerateDto } from './dto/ai-generate.dto';

@ApiTags('AI')
@Controller('ai/students')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get(':studentId/summary')
  summary(
    @Headers('authorization') authorization: string | undefined,
    @Param('studentId') studentId: string,
    @Query() query: AiSummaryQueryDto,
  ) {
    return this.aiService.summary(authorization, Number(studentId), query.periodType);
  }

  @Post(':studentId/generate-summary')
  generate(
    @Headers('authorization') authorization: string | undefined,
    @Param('studentId') studentId: string,
    @Body() body: AiGenerateDto,
  ) {
    return this.aiService.generate(authorization, Number(studentId), body.periodType);
  }
}
