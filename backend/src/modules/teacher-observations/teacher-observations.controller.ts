import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TeacherObservationsService } from './teacher-observations.service';
import { TeacherObservationCreateDto } from './dto/teacher-observation-create.dto';
import { TeacherObservationAiPolishDto } from './dto/teacher-observation-ai-polish.dto';

@ApiTags('TeacherObservations')
@Controller('teacher-observations')
export class TeacherObservationsController {
  constructor(private readonly teacherObservationsService: TeacherObservationsService) {}

  @Post()
  create(@Headers('authorization') authorization: string | undefined, @Body() body: TeacherObservationCreateDto) {
    return this.teacherObservationsService.create(authorization, body);
  }

  @Post('ai-polish')
  aiPolish(@Headers('authorization') authorization: string | undefined, @Body() body: TeacherObservationAiPolishDto) {
    return this.teacherObservationsService.aiPolish(authorization, body);
  }
}
