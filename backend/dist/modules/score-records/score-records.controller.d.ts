import { ScoreRecordsService } from './score-records.service';
import { ScoreRecordCreateDto } from './dto/score-record-create.dto';
import { ScoreRecordBatchDto } from './dto/score-record-batch.dto';
import { ScoreRecordGroupDto } from './dto/score-record-group.dto';
export declare class ScoreRecordsController {
    private readonly scoreRecordsService;
    constructor(scoreRecordsService: ScoreRecordsService);
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
    reverse(id: string): {
        code: number;
        message: string;
        data: {
            id: number;
        };
    };
}
