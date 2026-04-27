import { ScoreRulesService } from './score-rules.service';
import { ScoreRuleUpsertDto } from './dto/score-rule-upsert.dto';
import { ScoreRuleAiSuggestDto } from './dto/score-rule-ai-suggest.dto';
export declare class ScoreRulesController {
    private readonly scoreRulesService;
    constructor(scoreRulesService: ScoreRulesService);
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
            subjects: {
                subjectCode: string | null;
                subjectLabel: string;
                count: number;
                scenes: {
                    sceneCode: string;
                    sceneLabel: string;
                    count: number;
                    rules: ReturnType<ScoreRulesService["serializeRow"]>[];
                }[];
            }[];
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
    detail(id: string): Promise<{
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
    update(authorization: string | undefined, id: string, body: ScoreRuleUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
}
