import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { SchoolSettingsUpdateDto } from './dto/school-settings-update.dto';
import { SemesterSettingsUpdateDto } from './dto/semester-settings-update.dto';
import { DisplaySettingsUpdateDto } from './dto/display-settings-update.dto';
import { GradeSettingsUpdateDto } from './dto/grade-settings-update.dto';
import { PetGrowthSettingsUpdateDto } from './dto/pet-growth-settings-update.dto';
import { PermissionUserUpsertDto } from './dto/permission-user-upsert.dto';
export declare class AdminConfigService {
    private readonly prisma;
    private readonly authService;
    private readonly operationLogService;
    constructor(prisma: PrismaService, authService: AuthService, operationLogService: OperationLogService);
    getSettings(authorization: string | undefined): Promise<{
        code: number;
        message: string;
        data: {
            school: {
                id: number | null;
                code: string;
                name: string;
                englishName: string | null;
                motto: string | null;
                phone: string | null;
                address: string | null;
                petGrowth: {
                    thresholds: number[];
                };
            };
            semester: {
                id: number | null;
                name: string;
                startDate: Date;
                endDate: Date;
                isCurrent: boolean;
                status: import(".prisma/client").$Enums.Status;
            } | null;
            display: {
                id: number | null;
                title: string;
                subtitle: string;
                bgImageUrl: string | null;
                weatherLabel: string;
                weatherLatitude: number;
                weatherLongitude: number;
                animationSpeed: string;
                allowSkipAnimation: boolean;
                defaultMode: string;
                terminalCount: number;
            };
            gradeConfigs: {
                id: number | null;
                code: string;
                name: string;
                sortOrder: number | null;
                status: import(".prisma/client").$Enums.Status;
            }[];
            roleTemplates: {
                code: string;
                name: string;
                summary: string;
                permissions: string[];
            }[];
        };
    }>;
    updateSchool(authorization: string | undefined, body: SchoolSettingsUpdateDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    updatePetGrowth(authorization: string | undefined, body: PetGrowthSettingsUpdateDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    updateSemester(authorization: string | undefined, body: SemesterSettingsUpdateDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    updateDisplay(authorization: string | undefined, body: DisplaySettingsUpdateDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    updateGrades(authorization: string | undefined, body: GradeSettingsUpdateDto): Promise<{
        code: number;
        message: string;
        data: {
            count: number;
        };
    }>;
    listRoleTemplates(authorization: string | undefined): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            code: string;
            name: string;
            summary: string;
            permissions: string[];
        }[];
    }>;
    listPermissionUsers(authorization: string | undefined): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            name: string;
            username: string;
            phone: string | null;
            roleCode: string;
            roleName: string;
            status: import(".prisma/client").$Enums.Status;
            lastLoginAt: Date | null;
            classIds: number[];
            subjectScopes: {
                classId: number | null;
                className: string | null;
                gradeName: string | null;
                subjectCode: string;
                subjectLabel: string;
            }[];
            scopeDisplay: string;
            permissionSummary: string;
            permissions: string[];
        }[];
    }>;
    createPermissionUser(authorization: string | undefined, body: PermissionUserUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            defaultPassword: string;
        };
    }>;
    updatePermissionUser(authorization: string | undefined, id: number, body: PermissionUserUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number;
        };
    }>;
    resetPassword(authorization: string | undefined, id: number): Promise<{
        code: number;
        message: string;
        data: {
            id: number;
            defaultPassword: string;
        };
    }>;
    updatePermissionUserStatus(authorization: string | undefined, id: number, status: 'enabled' | 'disabled'): Promise<{
        code: number;
        message: string;
        data: {
            id: number;
            status: "enabled" | "disabled";
        };
    }>;
    private ensureGradeConfigs;
    private findRole;
    private normalizeSubjectScopes;
    private replaceUserScopes;
    private ensureCanManageAdminConfig;
    private logAction;
}
