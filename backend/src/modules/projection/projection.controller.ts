import { Get, Headers, Query, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProjectionService } from './projection.service';

@ApiTags('Projection')
@Controller('projection')
export class ProjectionController {
  constructor(private readonly projectionService: ProjectionService) {}

  @Get('snapshot')
  snapshot(
    @Headers('authorization') authorization: string | undefined,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.projectionService.snapshot(authorization, { startDate, endDate });
  }
}
