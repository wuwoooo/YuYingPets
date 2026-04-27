import { Prisma } from '@prisma/client';
export declare const DEFAULT_PET_GROWTH_THRESHOLDS: number[];
export declare function normalizePetGrowthThresholds(value: Prisma.JsonValue | null | undefined): number[];
export declare function resolveStageNeedScoreTotal(stageNo: number, fallbackValue: number, thresholds: number[]): number;
export declare function resolveMatchedPetStage<T extends {
    stageNo: number;
    levelNo: number;
    needScoreTotal: number;
}>(stages: T[], totalScore: number, thresholds: number[]): T;
