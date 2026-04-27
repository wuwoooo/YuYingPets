import { AiService } from './ai.service';
import { AiSummaryQueryDto } from './dto/ai-summary-query.dto';
import { AiGenerateDto } from './dto/ai-generate.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    summary(authorization: string | undefined, studentId: string, query: AiSummaryQueryDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number;
            studentId: number;
            classId: number;
            periodType: import(".prisma/client").PeriodType;
            snapshotDate: Date;
            positiveSummary: unknown;
            negativeSummary: unknown;
            dimensionSummary: unknown;
            trendSummary: unknown;
            aiSummary: string | null;
            aiSuggestion: string | null;
        } | null;
    }>;
    generate(authorization: string | undefined, studentId: string, body: AiGenerateDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            studentId: number;
            classId: number;
            periodType: import(".prisma/client").$Enums.PeriodType;
            generatedBy: "manual";
            positiveSummary: {
                count: number;
                scoreDelta: number;
            };
            negativeSummary: {
                count: number;
                scoreDelta: number;
            };
            dimensionSummary: {
                dimension: string;
                count: number;
                positiveCount: number;
                negativeCount: number;
            }[];
            trendSummary: {
                subjectSummary: {
                    subject: string;
                    count: number;
                    positiveCount: number;
                    negativeCount: number;
                }[];
                sceneSummary: {
                    scene: string;
                    count: number;
                    positiveCount: number;
                    negativeCount: number;
                }[];
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
}
