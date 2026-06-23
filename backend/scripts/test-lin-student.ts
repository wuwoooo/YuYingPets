import { PrismaClient } from '@prisma/client';
import { behaviorScoreRecordWhere } from '../src/common/utils/behavior-score-record.util';
import { getChinaPeriodStartLimit } from '../src/common/utils/date.util';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 开始全局排查 AI 学情净积分误差 ===\n');

  // 获取拥有最多行为评价记录的 3 名学生
  const topStudents = await prisma.scoreRecord.groupBy({
    by: ['studentId'],
    _count: { studentId: true },
    orderBy: { _count: { studentId: 'desc' } },
    take: 3,
  });

  if (topStudents.length === 0) {
    console.log('  数据库中没有任何积分记录！');
    return;
  }

  const now = new Date();
  const limitDate = getChinaPeriodStartLimit('weekly', now);

  for (const item of topStudents) {
    const student = await prisma.student.findFirst({
      where: { id: item.studentId, deletedAt: null },
    });
    if (!student) continue;

    console.log(`----------------------------------------`);
    console.log(`学生: ${student.name} (ID: ${student.id}) | 历史总积分记录数: ${item._count.studentId}`);

    // 1. 原逻辑：不限时间取最近 50 条
    const oldRecords = await prisma.scoreRecord.findMany({
      where: {
        studentId: student.id,
        ...behaviorScoreRecordWhere(),
      },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    });
    const oldNetScore = oldRecords.reduce((sum, r) => sum + r.scoreDelta, 0);

    // 2. 新逻辑：只取近 7 天内的记录（最多 100 条）
    const newRecords = await prisma.scoreRecord.findMany({
      where: {
        studentId: student.id,
        ...behaviorScoreRecordWhere(),
        occurredAt: { gte: limitDate },
      },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });
    const newNetScore = newRecords.reduce((sum, r) => sum + r.scoreDelta, 0);

    console.log(`  [原逻辑 - take 50] 累计记录数: ${oldRecords.length} | 统计出的“周净积分”: ${oldNetScore}`);
    console.log(`  [新逻辑 - 近 7 天 ] 累计记录数: ${newRecords.length} | 统计出的“周净积分”: ${newNetScore}`);
    
    if (oldRecords.length > 0) {
      console.log(`  [原逻辑时间跨度]: ${oldRecords[oldRecords.length - 1].occurredAt.toISOString()} 至 ${oldRecords[0].occurredAt.toISOString()}`);
    }
    if (newRecords.length > 0) {
      console.log(`  [新逻辑时间跨度]: ${newRecords[newRecords.length - 1].occurredAt.toISOString()} 至 ${newRecords[0].occurredAt.toISOString()}`);
    }

    if (oldNetScore !== newNetScore) {
      console.log(`  >> 发现计算偏差！原逻辑将历史时间段的数据算进了周学情中。`);
    } else {
      console.log(`  >> 计算结果一致（可能因为该生最近 7 天的记录刚好包含了他所有的历史记录，或无更早记录）。`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
