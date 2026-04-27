"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PET_GROWTH_THRESHOLDS = void 0;
exports.normalizePetGrowthThresholds = normalizePetGrowthThresholds;
exports.resolveStageNeedScoreTotal = resolveStageNeedScoreTotal;
exports.resolveMatchedPetStage = resolveMatchedPetStage;
exports.DEFAULT_PET_GROWTH_THRESHOLDS = [0, 140, 240, 360, 500, 660, 840, 1040, 1260, 1500];
function normalizePetGrowthThresholds(value) {
    if (!Array.isArray(value))
        return exports.DEFAULT_PET_GROWTH_THRESHOLDS;
    const parsed = value
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item) && item >= 0)
        .slice(0, 10)
        .map((item) => Math.trunc(item));
    if (parsed.length !== 10)
        return exports.DEFAULT_PET_GROWTH_THRESHOLDS;
    return parsed.map((item, index) => (index === 0 ? item : Math.max(item, parsed[index - 1])));
}
function resolveStageNeedScoreTotal(stageNo, fallbackValue, thresholds) {
    return thresholds[stageNo - 1] ?? fallbackValue;
}
function resolveMatchedPetStage(stages, totalScore, thresholds) {
    return stages
        .filter((stage) => resolveStageNeedScoreTotal(stage.stageNo, stage.needScoreTotal, thresholds) <= totalScore)
        .sort((a, b) => resolveStageNeedScoreTotal(b.stageNo, b.needScoreTotal, thresholds) -
        resolveStageNeedScoreTotal(a.stageNo, a.needScoreTotal, thresholds))[0] ?? null;
}
//# sourceMappingURL=pet-growth.util.js.map