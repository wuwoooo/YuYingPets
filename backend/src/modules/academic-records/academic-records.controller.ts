import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AcademicRecordsService } from './academic-records.service';

@ApiTags('AcademicRecords')
@Controller('academic-records')
export class AcademicRecordsController {
  constructor(private readonly academicRecordsService: AcademicRecordsService) {}

  @Post('import')
  import(@Headers('authorization') authorization: string | undefined, @Body() body: Record<string, unknown>) {
    return this.academicRecordsService.import(authorization, body);
  }

  @Get()
  list(@Headers('authorization') authorization: string | undefined, @Query() query: Record<string, string>) {
    return this.academicRecordsService.list(authorization, query);
  }

  @Get('exams')
  exams(@Headers('authorization') authorization: string | undefined, @Query() query: Record<string, string>) {
    return this.academicRecordsService.exams(authorization, query);
  }

  @Put('exams/:examId')
  updateExam(
    @Headers('authorization') authorization: string | undefined,
    @Param('examId') examId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.academicRecordsService.updateExam(authorization, Number(examId), body);
  }

  @Delete('exams/:examId')
  deleteExam(@Headers('authorization') authorization: string | undefined, @Param('examId') examId: string) {
    return this.academicRecordsService.deleteExam(authorization, Number(examId));
  }

  @Get('desk-overview')
  deskOverview(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: Record<string, string>,
  ) {
    return this.academicRecordsService.deskOverview(authorization, query);
  }

  @Get('school-growth')
  schoolGrowth(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: Record<string, string>,
  ) {
    return this.academicRecordsService.schoolGrowth(authorization, query);
  }

  @Get('students/:studentId')
  studentRecords(
    @Headers('authorization') authorization: string | undefined,
    @Param('studentId') studentId: string,
  ) {
    return this.academicRecordsService.studentRecords(authorization, Number(studentId));
  }
}
