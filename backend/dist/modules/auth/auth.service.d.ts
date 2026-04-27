import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from '@/common/auth/auth-user.interface';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(dto: LoginDto): Promise<{
        code: number;
        message: string;
        data: {
            token: string;
            user: {
                id: number | null;
                name: string;
                roleCode: string;
            };
            scopes: {
                scopeType: import(".prisma/client").$Enums.ScopeType;
                classId: number | null;
                gradeCode: string | null;
                subjectCode: string | null;
            }[];
        };
    }>;
    me(authorization?: string): Promise<{
        code: number;
        message: string;
        data: {
            user: {
                id: number | null;
                schoolId: number | null;
                username: string;
                name: string;
                roleCode: string;
                roleName: string;
            };
            scopes: {
                scopeType: string;
                classId: number | null;
                gradeCode: string | null | undefined;
                subjectCode: string | null | undefined;
            }[];
        };
    }>;
    logout(): {
        code: number;
        message: string;
        data: null;
    };
    getAuthUserFromAuthorization(authorization?: string): Promise<AuthUser>;
    canAccessClass(user: AuthUser, classId: bigint | number): boolean;
    ensureCanAccessClass(user: AuthUser, classId: bigint | number): void;
    getSubjectCodesForClass(user: AuthUser, classId: bigint | number): string[];
    canUseRuleForClass(user: AuthUser, classId: bigint | number, rule: {
        moduleType?: unknown;
        subjectCode?: unknown;
    }): boolean;
    ensureCanUseRuleForClass(user: AuthUser, classId: bigint | number, rule: {
        moduleType?: unknown;
        subjectCode?: unknown;
    }): void;
}
