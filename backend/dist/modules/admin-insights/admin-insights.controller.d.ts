import { AdminInsightsService } from './admin-insights.service';
import { PetUpsertDto } from './dto/pet-upsert.dto';
export declare class AdminInsightsController {
    private readonly adminInsightsService;
    constructor(adminInsightsService: AdminInsightsService);
    analytics(authorization: string | undefined, gradeName?: string, classId?: string, regenerateAi?: string): Promise<{
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
    analyticsReportStatus(authorization: string | undefined, classId?: string, gradeName?: string): Promise<{
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
    pets(authorization: string | undefined, category?: string): Promise<{
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
    updatePet(authorization: string | undefined, id: string, body: PetUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    updatePetStatus(authorization: string | undefined, id: string, status: 'enabled' | 'disabled'): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            status: "enabled" | "disabled";
        };
    }>;
    deletePet(authorization: string | undefined, id: string): Promise<{
        code: number;
        message: string;
        data: {
            id: number;
        };
    }>;
}
