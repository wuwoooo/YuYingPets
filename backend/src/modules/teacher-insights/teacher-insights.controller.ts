import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TeacherInsightsService } from './teacher-insights.service';

@ApiTags('TeacherInsights')
@Controller('teacher')
export class TeacherInsightsController {
  constructor(private readonly teacherInsightsService: TeacherInsightsService) {}

  @Get('workbench/context')
  workbenchContext(
    @Headers('authorization') authorization: string | undefined,
    @Query('classId') classId?: string,
    @Query('subjectCode') subjectCode?: string,
  ) {
    return this.teacherInsightsService.workbenchContext(authorization, {
      classId: classId ? Number(classId) : undefined,
      subjectCode,
    });
  }

  @Get('review/context')
  reviewContext(
    @Headers('authorization') authorization: string | undefined,
    @Query('classId') classId?: string,
    @Query('subjectCode') subjectCode?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('regenerateAi') regenerateAi?: string,
  ) {
    return this.teacherInsightsService.reviewContext(authorization, {
      classId: classId ? Number(classId) : undefined,
      subjectCode,
      startDate,
      endDate,
      regenerateAi: regenerateAi === 'true',
    });
  }
}
