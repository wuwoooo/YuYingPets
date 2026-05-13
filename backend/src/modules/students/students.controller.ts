import { Body, Controller, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { StudentAdoptPetDto } from './dto/student-adopt-pet.dto';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  list(@Headers('authorization') authorization: string | undefined, @Query() query: Record<string, string>) {
    return this.studentsService.list(authorization, query);
  }

  @Get(':id')
  detail(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.studentsService.detail(authorization, Number(id));
  }

  @Post('import')
  import(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.studentsService.import(authorization, body);
  }

  @Put(':id')
  update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.studentsService.update(authorization, Number(id), body);
  }

  @Post(':id/adopt-pet')
  adoptPet(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: StudentAdoptPetDto,
  ) {
    return this.studentsService.adoptPet(authorization, Number(id), body);
  }
}
