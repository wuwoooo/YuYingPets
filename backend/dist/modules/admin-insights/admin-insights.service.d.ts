import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { PetUpsertDto } from './dto/pet-upsert.dto';
export declare class AdminInsightsService {
    private readonly prisma;
    private readonly authService;
    private readonly operationLogService;
    private readonly configService;
    constructor(prisma: PrismaService, authService: AuthService, operationLogService: OperationLogService, configService: ConfigService);
    analytics(authorization: string | undefined, filters?: {
        gradeName?: string;
        classId?: number;
        regenerateAi?: boolean;
    }): Promise<{
        code: number;
        message: string;
        data: {
            totalScore: number;
            positiveRuleCount: number;
            averageScore: number;
            activeDays: number;
            gradeTrend: {
                name: string;
                value: number;
            }[];
            ruleDistribution: {
                name: string;
                value: number;
            }[];
            subjectDistribution: {
                name: string;
                value: number;
            }[];
            topClasses: {
                id: number | null;
                name: string;
                currentScoreTotal: number;
            }[];
            riskStudents: {
                riskLevel: string;
                reason: string;
                studentId: number;
                studentName: string;
                className: string;
                positiveCount: number;
                negativeCount: number;
                scoreDelta: number;
            }[];
            aiInsight: {
                summary: string;
                suggestion: string;
                reportSummary: string;
                source: "fallback";
                generatedAt: null;
                reportDate: string;
                classId: number;
                className: string;
                isCached: boolean;
            } | {
                summary: string;
                suggestion: string;
                reportSummary: string;
                source: "fallback" | "ark";
                generatedAt: string;
                reportDate: string;
                classId: number;
                className: string;
                isCached: boolean;
            } | {
                summary: string;
                suggestion: string;
                reportSummary: string;
                source: "fallback";
                generatedAt: null;
                reportDate: string;
                classId: null;
                className: null;
                isCached: boolean;
            } | {
                summary: string;
                suggestion: string;
                reportSummary: string;
                source: "fallback" | "ark";
                generatedAt: string;
                reportDate: string;
                classId: null;
                className: string;
                isCached: boolean;
            };
            heatMap: {
                rows: string[];
                cols: string[];
                data: {
                    row: string;
                    values: number[];
                }[];
            };
        };
    }>;
    analyticsReportStatus(authorization: string | undefined, classId?: number, gradeName?: string): Promise<{
        code: number;
        message: string;
        data: {
            hasTodayReport: boolean;
            classId: null;
            className: null;
            reportDate: string;
            generatedAt: string | null;
            source: "fallback" | "ark" | null;
        };
    } | {
        code: number;
        message: string;
        data: {
            hasTodayReport: boolean;
            classId: number;
            className: string;
            reportDate: string;
            generatedAt: string | null;
            source: "fallback" | "ark" | null;
        };
    }>;
    listPets(authorization: string | undefined, category?: string): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            code: string;
            name: string;
            category: string | null;
            rarity: string | null;
            sourceType: string;
            coverUrl: string | null;
            description: string | null;
            status: import(".prisma/client").$Enums.Status;
            bindCount: number;
            maxLevel: number;
            stages: {
                stageNo: number;
                levelNo: number;
                name: string;
                imageUrl: string;
                needScoreTotal: number;
                animationKey: string | null;
            }[];
        }[];
    }>;
    createPet(authorization: string | undefined, body: PetUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    updatePet(authorization: string | undefined, id: number, body: PetUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    updatePetStatus(authorization: string | undefined, id: number, status: 'enabled' | 'disabled'): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            status: "enabled" | "disabled";
        };
    }>;
    deletePet(authorization: string | undefined, id: number): Promise<{
        code: number;
        message: string;
        data: {
            id: number;
        };
    }>;
    uploadPetAsset(authorization: string | undefined, file: {
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
    private buildAnalyticsSummary;
    private buildAnalyticsSuggestion;
    private buildAnalyticsReportSummary;
    private resolveClassAnalyticsInsight;
    private resolveGlobalAnalyticsInsight;
    private generateAnalyticsInsightWithArk;
    private parseInsightJson;
    private getLocalDateString;
    private buildAnalyticsScopeKey;
    private getAnalyticsInsightCachePath;
    private readCachedAnalyticsInsight;
    private writeCachedAnalyticsInsight;
    private normalizePetStages;
    private resolveCoverUrl;
    private ensureCanManagePets;
    private getAccessibleClassIds;
}
