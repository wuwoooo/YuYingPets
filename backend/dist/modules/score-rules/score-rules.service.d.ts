import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ScoreRuleUpsertDto } from './dto/score-rule-upsert.dto';
import { ScoreRuleAiSuggestDto } from './dto/score-rule-ai-suggest.dto';
export declare class ScoreRulesService {
    private readonly prisma;
    private readonly authService;
    private readonly configService;
    constructor(prisma: PrismaService, authService: AuthService, configService: ConfigService);
    list(authorization: string | undefined, query: Record<string, string>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            semesterId: number | null;
            createdBy: number | null;
            updatedBy: number | null;
        }[];
    }>;
    tree(query: Record<string, string>): Promise<{
        code: number;
        message: string;
        data: {
            moduleType: string;
            moduleLabel: string;
            count: number;
            subjects: Array<{
                subjectCode: string | null;
                subjectLabel: string;
                count: number;
                scenes: Array<{
                    sceneCode: string;
                    sceneLabel: string;
                    count: number;
                    rules: ReturnType<ScoreRulesService["serializeRow"]>[];
                }>;
            }>;
        }[];
    }>;
    create(authorization: string | undefined, body: ScoreRuleUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    aiSuggest(authorization: string | undefined, body: ScoreRuleAiSuggestDto): Promise<{
        code: number;
        message: string;
        data: {
            dimension: string;
            tag: string;
            aiSummaryText: string;
            description: string;
        };
    }>;
    detail(id: number): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            semesterId: number | null;
            createdBy: number | null;
            updatedBy: number | null;
        };
    }>;
    update(authorization: string | undefined, id: number, body: ScoreRuleUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    private serializeRow;
    private filterRowsForAuthorizedClassContext;
    private buildFallbackSuggestion;
    private normalizeUpsertBody;
    private resolveFallbackDimension;
    private generateRuleSuggestionWithArk;
    private parseRuleSuggestion;
}
