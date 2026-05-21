import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { OperationLogsQueryDto } from './audit.dto';

@ApiTags('AdminAudit')
@ApiBearerAuth()
@Controller('admin')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('audit/operation-logs')
  @ApiOperation({ summary: '分页查询本校 operation_log 业务审计记录' })
  listOperationLogs(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: OperationLogsQueryDto,
  ) {
    return this.auditService.listOperationLogs(authorization, query);
  }
}
