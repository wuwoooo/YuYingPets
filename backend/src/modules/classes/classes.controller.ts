import { Body, Controller, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClassesService } from './classes.service';

@ApiTags('Classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  list(@Headers('authorization') authorization: string | undefined, @Query() query: Record<string, string>) {
    return this.classesService.list(authorization, query);
  }

  @Post()
  create(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.classesService.create(authorization, body);
  }

  @Get(':id')
  detail(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.classesService.detail(authorization, Number(id));
  }

  @Put(':id')
  update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.classesService.update(authorization, Number(id), body);
  }

  @Get(':id/groups')
  groups(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.classesService.groups(authorization, Number(id));
  }

  @Put(':id/groups/students')
  updateGroups(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.classesService.updateGroups(authorization, Number(id), body);
  }
}
