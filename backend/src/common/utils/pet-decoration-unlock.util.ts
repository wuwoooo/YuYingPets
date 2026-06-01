import { Prisma } from '@prisma/client';
import { PET_DECORATION_PUBLIC_UNLOCK_LEVEL } from './pet-decoration-access.util';

/** 按当前等级补全限定主题装饰解锁记录（unlock_level>1，幂等） */
export async function syncUnlockedDecorationsForLevel(
  tx: Prisma.TransactionClient,
  studentPetId: bigint,
  schoolId: bigint,
  level: number,
) {
  const decorations = await tx.petDecoration.findMany({
    where: {
      schoolId,
      unlockLevel: { gt: PET_DECORATION_PUBLIC_UNLOCK_LEVEL, lte: level },
      status: 'enabled',
    },
    select: { id: true },
  });
  if (decorations.length === 0) return;

  const existing = await tx.studentPetDecoration.findMany({
    where: { studentPetId },
    select: { decorationId: true },
  });
  const existingIds = new Set(existing.map((e) => e.decorationId.toString()));

  const toUnlock = decorations.filter((d) => !existingIds.has(d.id.toString()));
  if (toUnlock.length === 0) return;

  await tx.studentPetDecoration.createMany({
    data: toUnlock.map((d) => ({
      studentPetId,
      decorationId: d.id,
      isEquipped: false,
    })),
    skipDuplicates: true,
  });
}
