import { Injectable } from '@nestjs/common';
import { sanitizeAuditDetail } from '@/common/utils/redact-audit-detail';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, TerminalType } from '@prisma/client';

type LogInput = {
  schoolId: bigint;
  userId?: bigint | null;
  roleCode?: string | null;
  terminalType: TerminalType;
  module: string;
  action: string;
  targetType?: string;
  targetId?: bigint | null;
  detail?: Prisma.InputJsonValue;
};

@Injectable()
export class OperationLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: LogInput) {
    await this.prisma.operationLog.create({
      data: {
        schoolId: input.schoolId,
        userId: input.userId ?? null,
        roleCode: input.roleCode ?? null,
        terminalType: input.terminalType,
        module: input.module,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        detail:
          input.detail === undefined
            ? undefined
            : (sanitizeAuditDetail(input.detail) as Prisma.InputJsonValue),
      },
    });
  }
}
