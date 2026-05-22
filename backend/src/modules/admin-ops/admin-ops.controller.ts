import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOpsLogsQueryDto } from './admin-ops.dto';
import { AdminOpsService } from './admin-ops.service';

@ApiTags('AdminOps')
@ApiBearerAuth()
@Controller('admin/ops')
export class AdminOpsController {
  constructor(private readonly adminOpsService: AdminOpsService) {}

  @Get('overview')
  @ApiOperation({ summary: '查看后端运行状态与服务器资源概览' })
  overview(@Headers('authorization') authorization: string | undefined) {
    return this.adminOpsService.overview(authorization);
  }

  @Get('logs')
  @ApiOperation({ summary: '查询后端运行日志中的告警与错误事件' })
  logs(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: AdminOpsLogsQueryDto,
  ) {
    return this.adminOpsService.logs(authorization, query);
  }
}
