import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { PeriodType } from '@prisma/client';
import { OperationLogService } from '../operation-log/operation-log.service';
import { RealtimeService } from '../realtime/realtime.service';
type SummaryBreakdown = {
    count: number;
    scoreDelta: number;
};
type DimensionSummaryItem = {
    dimension: string;
    count: number;
    positiveCount: number;
    negativeCount: number;
};
type SubjectSummaryItem = {
    subject: string;
    count: number;
    positiveCount: number;
    negativeCount: number;
};
type SceneSummaryItem = {
    scene: string;
    count: number;
    positiveCount: number;
    negativeCount: number;
};
type StudentSnapshotResponse = {
    id: number;
    studentId: number;
    classId: number;
    periodType: PeriodType;
    snapshotDate: Date;
    positiveSummary: unknown;
    negativeSummary: unknown;
    dimensionSummary: unknown;
    trendSummary: unknown;
    aiSummary: string | null;
    aiSuggestion: string | null;
};
export declare class AiService {
    private readonly prisma;
    private readonly authService;
    private readonly operationLogService;
    private readonly realtimeService;
    private readonly configService;
    constructor(prisma: PrismaService, authService: AuthService, operationLogService: OperationLogService, realtimeService: RealtimeService, configService: ConfigService);
    summary(authorization: string | undefined, studentId: number, periodType?: 'weekly' | 'monthly'): Promise<{
        code: number;
        message: string;
        data: StudentSnapshotResponse | null;
    }>;
    generate(authorization: string | undefined, studentId: number, periodType?: 'weekly' | 'monthly'): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            studentId: number;
            classId: number;
            periodType: import(".prisma/client").$Enums.PeriodType;
            generatedBy: "manual";
            positiveSummary: SummaryBreakdown;
            negativeSummary: SummaryBreakdown;
            dimensionSummary: DimensionSummaryItem[];
            trendSummary: {
                subjectSummary: SubjectSummaryItem[];
                sceneSummary: SceneSummaryItem[];
                evidence: {
                    date: string;
                    subject: string;
                    scene: string;
                    ruleName: string;
                    sentiment: "positive" | "negative";
                    scoreDelta: number;
                    remark: string | null;
                    signal: string;
                }[];
                totalScoreDelta: number;
                totalExpDelta: number;
                positiveRatio: number;
                recentTrend: "up" | "down" | "flat";
                activeDays: number;
            };
            aiSummary: string;
            aiSuggestion: string;
        };
    }>;
    private loadStudent;
    private serializeSnapshot;
    private buildSentimentSummary;
    private buildDimensionSummary;
    private buildSubjectSummary;
    private buildSceneSummary;
    private buildTrendSummary;
    private buildEvidence;
    private buildAiSummary;
    private buildAiSuggestion;
    private generateWithArk;
    private extractArkOutputText;
    private parseArkOutput;
}
export {};
