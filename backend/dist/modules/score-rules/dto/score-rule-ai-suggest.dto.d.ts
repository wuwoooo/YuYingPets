export declare class ScoreRuleAiSuggestDto {
    semesterId?: number;
    moduleType?: 'general' | 'subject';
    subjectCode?: string;
    sceneCode?: string;
    name?: string;
    scoreType?: 'add' | 'deduct';
    scoreValue?: number;
    sentiment?: 'positive' | 'negative';
}
