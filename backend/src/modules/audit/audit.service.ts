import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { toNumber } from '@/common/utils/bigint.util';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '@/modules/auth/auth.service';
import { OperationLogsQueryDto } from './audit.dto';
import {
  AUDIT_SENSITIVE_SCOPE_OR,
  buildAuditSummary,
  getAuditActionLabel,
  getAuditModuleLabel,
  getAuditSensitivity,
  type AuditPresentSource,
} from './operation-log-present';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  private ensureCanViewAudit(roleCode: string) {
    if (!['super_admin', 'school_admin', 'academic_admin'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权查看操作审计');
    }
  }

  async listOperationLogs(authorization: string | undefined, query: OperationLogsQueryDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanViewAudit(user.roleCode);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filters: Prisma.OperationLogWhereInput[] = [{ schoolId: user.schoolId }];
    if (query.module) {
      filters.push({ module: query.module });
    }
    if (query.action) {
      filters.push({ action: query.action });
    }
    if (query.terminalType) {
      filters.push({ terminalType: query.terminalType });
    }
    if (query.scope === 'sensitive') {
      filters.push({ OR: AUDIT_SENSITIVE_SCOPE_OR });
    }

    const where: Prisma.OperationLogWhereInput =
      filters.length === 1 ? filters[0]! : { AND: filters };

    const [rows, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return {
      code: 0,
      message: 'ok',
      data: {
        items: rows.map((row) => {
          const present: AuditPresentSource = {
            module: row.module,
            action: row.action,
            terminalType: row.terminalType,
            targetType: row.targetType,
            targetId: row.targetId != null ? toNumber(row.targetId) : null,
            detail: row.detail,
            operatorName: row.user?.name ?? null,
            operatorUsername: row.user?.username ?? null,
            roleCode: row.roleCode,
          };
          return {
            id: toNumber(row.id),
            schoolId: toNumber(row.schoolId),
            userId: row.userId != null ? toNumber(row.userId) : null,
            roleCode: row.roleCode,
            terminalType: row.terminalType,
            module: row.module,
            action: row.action,
            targetType: row.targetType,
            targetId: row.targetId != null ? toNumber(row.targetId) : null,
            detail: row.detail,
            createdAt: row.createdAt.toISOString(),
            operatorName: row.user?.name ?? null,
            operatorUsername: row.user?.username ?? null,
            moduleLabel: getAuditModuleLabel(row.module),
            actionLabel: getAuditActionLabel(row.module, row.action),
            summary: buildAuditSummary(present),
            sensitivity: getAuditSensitivity(row.module, row.action),
          };
        }),
        total,
        page,
        limit,
      },
    };
  }
}
