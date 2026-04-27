import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { RealtimeService } from '../realtime/realtime.service';
export declare class ClassesService {
    private readonly prisma;
    private readonly authService;
    private readonly operationLogService;
    private readonly realtimeService;
    constructor(prisma: PrismaService, authService: AuthService, operationLogService: OperationLogService, realtimeService: RealtimeService);
    list(authorization: string | undefined, query: Record<string, string>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            semesterId: number | null;
            code: string;
            gradeCode: string;
            gradeName: string;
            name: string;
            slogan: string | null;
            targetScore: number | null;
            sortOrder: number | null;
            displayStatus: string | null;
            studentCount: number;
            currentScoreTotal: number;
            totalScoreTotal: number;
            homeroomTeacher: {
                id: number | null;
                name: string;
                username: string;
            } | null;
        }[];
    }>;
    create(authorization: string | undefined, body: Record<string, unknown>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    detail(authorization: string | undefined, id: number): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            semesterId: number | null;
            code: string;
            gradeCode: string;
            gradeName: string;
            name: string;
            slogan: string | null;
            targetScore: number | null;
            sortOrder: number | null;
            displayStatus: string | null;
            semester: {
                id: number | null;
                name: string;
                isCurrent: boolean;
            };
            homeroomTeacher: {
                id: number | null;
                name: string;
                username: string;
            } | null;
            studentCount: number;
            scoreSummary: {
                currentScoreTotal: number;
                totalScoreTotal: number;
            };
        };
    }>;
    update(authorization: string | undefined, id: number, body: Record<string, unknown>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    groups(authorization: string | undefined, id: number): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            classId: number | null;
            groupNo: number;
            name: string;
            studentCount: number;
            currentScoreTotal: number;
            students: {
                id: number | null;
                name: string;
                studentNo: string;
                currentScore: number;
            }[];
        }[];
    }>;
    updateGroups(authorization: string | undefined, id: number, body: Record<string, unknown>): Promise<{
        code: number;
        message: string;
        data: {
            groupCount: number;
        };
    }>;
    private ensureCanManageGroups;
    private ensureCanManageClass;
}
