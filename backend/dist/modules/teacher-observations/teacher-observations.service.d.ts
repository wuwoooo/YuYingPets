import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { TeacherObservationCreateDto } from './dto/teacher-observation-create.dto';
import { TeacherObservationAiPolishDto } from './dto/teacher-observation-ai-polish.dto';
export declare class TeacherObservationsService {
    private readonly prisma;
    private readonly authService;
    private readonly operationLogService;
    private readonly configService;
    constructor(prisma: PrismaService, authService: AuthService, operationLogService: OperationLogService, configService: ConfigService);
    create(authorization: string | undefined, body: TeacherObservationCreateDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    aiPolish(authorization: string | undefined, body: TeacherObservationAiPolishDto): Promise<{
        code: number;
        message: string;
        data: {
            content: string;
        };
    }>;
    private buildFallbackPolish;
    private generateWithArk;
}
