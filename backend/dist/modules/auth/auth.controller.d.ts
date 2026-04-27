import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
}
