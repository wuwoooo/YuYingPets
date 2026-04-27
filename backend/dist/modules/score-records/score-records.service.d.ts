import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { ScoreRecordCreateDto } from './dto/score-record-create.dto';
import { ScoreRecordBatchDto } from './dto/score-record-batch.dto';
import { ScoreRecordGroupDto } from './dto/score-record-group.dto';
import { OperationLogService } from '../operation-log/operation-log.service';
import { RealtimeService } from '../realtime/realtime.service';
export declare class ScoreRecordsService {
    private readonly prisma;
    private readonly authService;
    private readonly operationLogService;
    private readonly realtimeService;
    constructor(prisma: PrismaService, authService: AuthService, operationLogService: OperationLogService, realtimeService: RealtimeService);
    list(query: Record<string, string>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            semesterId: number | null;
            classId: number | null;
            studentId: number | null;
            classGroupId: number | null;
            ruleId: number | null;
            operatorId: number | null;
            ruleName: string;
            createdAt: Date;
            subjectCode: string | null;
            sceneCode: string | null;
            dimension: string | null;
            tag: string | null;
            sentiment: import(".prisma/client").$Enums.Sentiment;
            scoreDelta: number;
            remark: string | null;
            sourceTerminal: import(".prisma/client").$Enums.TerminalType;
            sourceRole: string | null;
            operatorName: string | null;
        }[];
    }>;
    create(authorization: string | undefined, body: ScoreRecordCreateDto): Promise<{
        code: number;
        message: string;
        data: {
            scoreRecordId: number;
            studentProfile: {
                studentId: number | null;
                currentScore: number;
                currentPetLevel: number;
            };
            petUpgrade: {
                upgraded: boolean;
                beforeLevel?: number;
                afterLevel?: number;
            };
        };
    }>;
    batch(authorization: string | undefined, body: ScoreRecordBatchDto): Promise<{
        code: number;
        message: string;
        data: {
            batchId: number | null;
            items: {
                scoreRecordId: number;
                studentProfile: {
                    studentId: number | null;
                    currentScore: number;
                    currentPetLevel: number;
                };
                petUpgrade: {
                    upgraded: boolean;
                    beforeLevel?: number;
                    afterLevel?: number;
                };
            }[];
        };
    }>;
    group(authorization: string | undefined, body: ScoreRecordGroupDto): Promise<{
        code: number;
        message: string;
        data: {
            batchId: number | null;
            items: {
                scoreRecordId: number;
                studentProfile: {
                    studentId: number | null;
                    currentScore: number;
                    currentPetLevel: number;
                };
                petUpgrade: {
                    upgraded: boolean;
                    beforeLevel?: number;
                    afterLevel?: number;
                };
            }[];
        };
    }>;
    reverse(id: number): {
        code: number;
        message: string;
        data: {
            id: number;
        };
    };
    private ensureCanWriteScore;
    private resolveSignedValue;
    private loadSingleTarget;
    private createScoreRecordForStudent;
}
