import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { HonorUpsertDto } from './dto/honor-upsert.dto';
import { HonorRecordCreateDto } from './dto/honor-record-create.dto';
export declare class HonorsService {
    private readonly prisma;
    private readonly authService;
    private readonly operationLogService;
    constructor(prisma: PrismaService, authService: AuthService, operationLogService: OperationLogService);
    list(authorization: string | undefined, query: Record<string, string>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            code: string;
            name: string;
            category: import(".prisma/client").$Enums.HonorCategory;
            iconUrl: string | null;
            description: string | null;
            conditionType: string | null;
            conditionConfig: Record<string, unknown> | null;
            status: import(".prisma/client").$Enums.Status;
            createdAt: Date;
            updatedAt: Date;
            grantedCount: number;
            lastGrantedAt: Date;
        }[];
    }>;
    create(authorization: string | undefined, body: HonorUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    update(authorization: string | undefined, id: number, body: HonorUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    uploadHonorAsset(authorization: string | undefined, file: {
        originalname: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
    } | undefined): Promise<{
        code: number;
        message: string;
        data: {
            url: string;
            originalName: string;
            mimeType: string;
            size: number;
        };
    }>;
    updateStatus(authorization: string | undefined, id: number, status: 'enabled' | 'disabled'): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            status: "enabled" | "disabled";
        };
    }>;
    records(authorization: string | undefined, query: Record<string, string>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            honorId: number | null;
            honorName: string;
            targetType: string;
            targetId: number | null;
            schoolId: number | null;
            classId: number | null;
            className: string;
            studentId: number | null;
            studentName: string | null;
            grantedBy: number | null;
            grantedByName: string | null;
            grantedAt: Date;
            remark: string | null;
            createdAt: Date;
        }[];
    }>;
    createRecord(authorization: string | undefined, body: HonorRecordCreateDto): Promise<{
        code: number;
        message: string;
        data: {
            recordId: number | null;
            honorId: number | null;
            targetType: "student" | "class";
            targetId: number;
            classId: number;
            studentId: number | null;
        };
    }>;
    private ensureCanManageHonors;
    private ensureCanGrantHonors;
}
