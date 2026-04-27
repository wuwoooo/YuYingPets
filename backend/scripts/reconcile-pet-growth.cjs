const { PrismaClient } = require('@prisma/client');

function normalizePetGrowthThresholds(value) {
  const fallback = [0, 140, 240, 360, 500, 660, 840, 1040, 1260, 1500];
  if (!Array.isArray(value)) return fallback;
  const parsed = value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item >= 0)
    .slice(0, 10)
    .map((item) => Math.trunc(item));
  if (parsed.length !== 10) return fallback;
  return parsed.map((item, index) => (index === 0 ? item : Math.max(item, parsed[index - 1])));
}

function resolveStageNeedScoreTotal(stageNo, fallbackValue, thresholds) {
  return thresholds[stageNo - 1] ?? fallbackValue;
}

function resolveMatchedStage(stages, totalScore, thresholds) {
  return (
    stages
      .filter((stage) => resolveStageNeedScoreTotal(stage.stageNo, stage.needScoreTotal, thresholds) <= totalScore)
      .sort(
        (a, b) =>
          resolveStageNeedScoreTotal(b.stageNo, b.needScoreTotal, thresholds) -
          resolveStageNeedScoreTotal(a.stageNo, a.needScoreTotal, thresholds),
      )[0] || null
  );
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const pets = await prisma.studentPet.findMany({
      include: {
        student: {
          include: {
            school: {
              select: {
                petGrowthThresholds: true,
              },
            },
            profile: true,
          },
        },
        pet: {
          include: {
            stages: {
              orderBy: { stageNo: 'asc' },
            },
          },
        },
      },
    });

    let updatedCount = 0;
    for (const item of pets) {
      const thresholds = normalizePetGrowthThresholds(item.student.school.petGrowthThresholds);
      const totalScore = item.student.profile?.totalScore ?? item.totalScore ?? 0;
      const matchedStage = resolveMatchedStage(item.pet.stages, totalScore, thresholds);
      const nextLevel = matchedStage?.levelNo ?? 1;
      const nextStageNo = matchedStage?.stageNo ?? 1;

      if (
        item.totalScore !== totalScore ||
        item.currentLevel !== nextLevel ||
        item.currentStageNo !== nextStageNo ||
        (item.student.profile?.currentPetLevel ?? 1) !== nextLevel
      ) {
        await prisma.$transaction([
          prisma.studentPet.update({
            where: { id: item.id },
            data: {
              totalScore,
              currentLevel: nextLevel,
              currentStageNo: nextStageNo,
            },
          }),
          prisma.studentProfile.upsert({
            where: { studentId: item.studentId },
            update: {
              currentPetLevel: nextLevel,
            },
            create: {
              studentId: item.studentId,
              classId: item.student.classId,
              totalScore: totalScore,
              currentPetLevel: nextLevel,
            },
          }),
        ]);
        updatedCount += 1;
      }
    }

    console.log(JSON.stringify({ updatedCount }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
