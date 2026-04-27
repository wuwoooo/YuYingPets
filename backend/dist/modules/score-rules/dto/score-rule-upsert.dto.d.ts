declare enum ModuleTypeDto {
    GENERAL = "general",
    SUBJECT = "subject"
}
declare enum ScoreTypeDto {
    ADD = "add",
    DEDUCT = "deduct"
}
declare enum SentimentDto {
    POSITIVE = "positive",
    NEGATIVE = "negative"
}
export declare class ScoreRuleUpsertDto {
    semesterId: number;
    moduleType: ModuleTypeDto;
    subjectCode?: string;
    sceneCode: string;
    code: string;
    name: string;
    scoreType: ScoreTypeDto;
    scoreValue: number;
    dimension?: string;
    tag?: string;
    sentiment: SentimentDto;
    aiSummaryText?: string;
    description?: string;
    isHighFrequency?: boolean;
    displayEnabled?: boolean;
    adminEnabled?: boolean;
}
export {};
