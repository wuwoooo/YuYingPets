import { Prisma } from '@prisma/client';

export const DEFAULT_PET_GROWTH_THRESHOLDS = [0, 140, 240, 360, 500, 660, 840, 1040, 1260, 1500];

export function normalizePetGrowthThresholds(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) return DEFAULT_PET_GROWTH_THRESHOLDS;

  const parsed = value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item >= 0)
    .slice(0, 10)
    .map((item) => Math.trunc(item));

  if (parsed.length !== 10) return DEFAULT_PET_GROWTH_THRESHOLDS;

  return parsed.map((item, index) => (index === 0 ? item : Math.max(item, parsed[index - 1])));
}

export function resolveStageNeedScoreTotal(stageNo: number, fallbackValue: number, thresholds: number[]) {
  return thresholds[stageNo - 1] ?? fallbackValue;
}

export function resolveMatchedPetStage<
  T extends { stageNo: number; levelNo: number; needScoreTotal: number },
>(stages: T[], totalScore: number, thresholds: number[]) {
  return stages
    .filter((stage) => resolveStageNeedScoreTotal(stage.stageNo, stage.needScoreTotal, thresholds) <= totalScore)
    .sort(
      (a, b) =>
        resolveStageNeedScoreTotal(b.stageNo, b.needScoreTotal, thresholds) -
        resolveStageNeedScoreTotal(a.stageNo, a.needScoreTotal, thresholds),
    )[0] ?? null;
}
