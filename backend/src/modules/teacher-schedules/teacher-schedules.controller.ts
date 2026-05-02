import { Body, Controller, Get, Headers, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeacherSchedulesService } from './teacher-schedules.service';
import { ImportTeacherScheduleDto } from './dto/import-teacher-schedule.dto';
import { TeacherLiveStatusQueryDto } from './dto/teacher-live-status-query.dto';
import { UpdateTeacherOccupancyRulesDto } from './dto/teacher-occupancy-rules.dto';

@ApiTags('TeacherSchedules')
@Controller('teacher-schedules')
export class TeacherSchedulesController {
  constructor(private readonly teacherSchedulesService: TeacherSchedulesService) {}

  @Post('import-from-xls')
  @UseInterceptors(FileInterceptor('file'))
  importFromXls(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: ImportTeacherScheduleDto,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
  ) {
    return this.teacherSchedulesService.importFromXls(
      authorization,
      body.filePath,
      file,
      Boolean(body.createMissingTeachers),
      body.creationRoleCode,
      body.usernamePrefix,
      body.missingTeacherConfigs,
      body.missingClassConfigs,
    );
  }

  @Get('live-status')
  liveStatus(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: TeacherLiveStatusQueryDto,
  ) {
    return this.teacherSchedulesService.liveStatus(authorization, query.at, query.startAt, query.endAt);
  }

  @Get('slots')
  slots(@Headers('authorization') authorization: string | undefined, @Query('teacherId') teacherId?: string) {
    return this.teacherSchedulesService.slots(authorization, teacherId ? Number(teacherId) : undefined);
  }

  @Get('occupancy-rules')
  occupancyRules(@Headers('authorization') authorization: string | undefined) {
    return this.teacherSchedulesService.occupancyRules(authorization);
  }

  @Put('occupancy-rules')
  updateOccupancyRules(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: UpdateTeacherOccupancyRulesDto,
  ) {
    return this.teacherSchedulesService.updateOccupancyRules(authorization, body);
  }
}
