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
export declare class OperationLogService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(input: LogInput): Promise<void>;
}
export {};
