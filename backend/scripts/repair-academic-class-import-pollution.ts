import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GRADE_PREFIX_PATTERN = /^(一年级|二年级|三年级|四年级|五年级|六年级|七年级|八年级|九年级|高一|高二|高三)/;

type ClassCounts = {
  students: number;
  studentProfiles: number;
  academicScoreRecords: number;
  scoreRecords: number;
  rewardOrders: number;
  honorRecords: number;
  userScopes: number;
  teacherClassAssignments: number;
  classGroups: number;
  classScoreRecords: number;
  displayTerminals: number;
  displayConfigs: number;
  aiStudentSnapshots: number;
  teacherObservations: number;
};

type RepairPlan = {
  sourceClass: {
    id: number;
    label: string;
    name: string;
    gradeName: string;
    createdAt: string;
    counts: ClassCounts;
  };
  targetClass: {
    id: number;
    label: string;
    name: string;
    gradeName: string;
    counts: Pick<ClassCounts, 'students' | 'academicScoreRecords'>;
  };
  studentsToMove: Array<{
    id: number;
    studentNo: string;
    name: string;
    academicScoreRecordCount: number;
  }>;
  academicScoreRecordsToMove: number;
  academicRecordsAlreadyOwnedByTargetStudents: number;
  academicRecordsOwnedBySourceStudents: number;
  blockers: string[];
};

function normalizeClassAlias(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s()（）_-]+/g, '')
    .replace(GRADE_PREFIX_PATTERN, '');
}

function normalizedText(value: string) {
  return value.trim().toLowerCase().replace(/[\s()（）_-]+/g, '');
}

function toNumber(value: bigint | number | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

function formatLabel(row: { gradeName: string; name: string }) {
  if (normalizedText(row.name).startsWith(normalizedText(row.gradeName))) {
    return row.name;
  }
  return `${row.gradeName}${row.name}`;
}

function hasGradePrefixInName(name: string) {
  return GRADE_PREFIX_PATTERN.test(normalizedText(name));
}

function disallowedReferenceSummary(counts: ClassCounts) {
  const disallowed: Array<[keyof ClassCounts, string]> = [
    ['scoreRecords', '积分记录'],
    ['rewardOrders', '奖励兑换'],
    ['honorRecords', '荣誉记录'],
    ['userScopes', '权限范围'],
    ['teacherClassAssignments', '任教关系'],
    ['classGroups', '班级分组'],
    ['classScoreRecords', '班级积分记录'],
    ['displayTerminals', '展示设备'],
    ['displayConfigs', '展示配置'],
    ['aiStudentSnapshots', 'AI 快照'],
    ['teacherObservations', '教师观察'],
  ];
  return disallowed
    .filter(([key]) => counts[key] > 0)
    .map(([key, label]) => `${label}=${counts[key]}`);
}

async function buildPlans() {
  const classes = await prisma.classroom.findMany({
    where: { deletedAt: null, status: 'enabled' },
    select: {
      id: true,
      schoolId: true,
      semesterId: true,
      gradeName: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          students: true,
          studentProfiles: true,
          academicScoreRecords: true,
          scoreRecords: true,
          rewardOrders: true,
          honorRecords: true,
          userScopes: true,
          teacherClassAssignments: true,
          classGroups: true,
          classScoreRecords: true,
          displayTerminals: true,
          displayConfigs: true,
          aiStudentSnapshots: true,
          teacherObservations: true,
        },
      },
    },
    orderBy: [{ id: 'asc' }],
  });

  const plans: RepairPlan[] = [];
  const skipped: Array<{ classId: number; label: string; reason: string }> = [];

  for (const source of classes) {
    if (!hasGradePrefixInName(source.name)) continue;

    const sourceAlias = normalizeClassAlias(source.name);
    if (!sourceAlias) continue;

    const targetCandidates = classes.filter((candidate) => {
      if (candidate.id === source.id) return false;
      if (candidate.schoolId !== source.schoolId || candidate.semesterId !== source.semesterId) return false;
      if (normalizeClassAlias(candidate.name) !== sourceAlias) return false;
      return !hasGradePrefixInName(candidate.name);
    });

    if (targetCandidates.length !== 1) {
      skipped.push({
        classId: Number(source.id),
        label: formatLabel(source),
        reason: `目标班级候选数量=${targetCandidates.length}`,
      });
      continue;
    }

    const target = targetCandidates[0];
    const sourceCounts = source._count as ClassCounts;
    const targetCounts = target._count as ClassCounts;
    const blockers: string[] = [];

    const disallowedRefs = disallowedReferenceSummary(sourceCounts);
    if (disallowedRefs.length > 0) {
      blockers.push(`错误班级存在非成绩/学生业务引用：${disallowedRefs.join('，')}`);
    }

    const sourceStudents = await prisma.student.findMany({
      where: { classId: source.id, deletedAt: null },
      select: {
        id: true,
        studentNo: true,
        name: true,
        _count: { select: { academicScoreRecords: true } },
      },
      orderBy: [{ id: 'asc' }],
    });

    const studentsToMove: RepairPlan['studentsToMove'] = [];
    for (const student of sourceStudents) {
      const sameNoInTarget = await prisma.student.findFirst({
        where: {
          classId: target.id,
          studentNo: student.studentNo,
          deletedAt: null,
        },
        select: { id: true, studentNo: true, name: true },
      });
      if (sameNoInTarget) {
        blockers.push(
          `学生 ${student.name}(${student.studentNo}) 迁回目标班级会发生学号冲突：目标已有 ${sameNoInTarget.name}(id=${sameNoInTarget.id})`,
        );
      }
      studentsToMove.push({
        id: Number(student.id),
        studentNo: student.studentNo,
        name: student.name,
        academicScoreRecordCount: student._count.academicScoreRecords,
      });
    }

    const [
      academicScoreRecordsToMove,
      academicRecordsAlreadyOwnedByTargetStudents,
      academicRecordsOwnedBySourceStudents,
    ] = await Promise.all([
      prisma.academicScoreRecord.count({ where: { classId: source.id } }),
      prisma.academicScoreRecord.count({
        where: { classId: source.id, student: { classId: target.id } },
      }),
      prisma.academicScoreRecord.count({
        where: { classId: source.id, student: { classId: source.id } },
      }),
    ]);

    if (academicScoreRecordsToMove !== sourceCounts.academicScoreRecords) {
      blockers.push(
        `成绩记录计数不一致：class._count=${sourceCounts.academicScoreRecords}，实际=${academicScoreRecordsToMove}`,
      );
    }
    if (academicRecordsAlreadyOwnedByTargetStudents + academicRecordsOwnedBySourceStudents !== academicScoreRecordsToMove) {
      blockers.push(
        `存在成绩记录学生归属既不在源班也不在目标班：${academicScoreRecordsToMove - academicRecordsAlreadyOwnedByTargetStudents - academicRecordsOwnedBySourceStudents} 条`,
      );
    }

    plans.push({
      sourceClass: {
        id: Number(source.id),
        label: formatLabel(source),
        name: source.name,
        gradeName: source.gradeName,
        createdAt: source.createdAt.toISOString(),
        counts: sourceCounts,
      },
      targetClass: {
        id: Number(target.id),
        label: formatLabel(target),
        name: target.name,
        gradeName: target.gradeName,
        counts: {
          students: targetCounts.students,
          academicScoreRecords: targetCounts.academicScoreRecords,
        },
      },
      studentsToMove,
      academicScoreRecordsToMove,
      academicRecordsAlreadyOwnedByTargetStudents,
      academicRecordsOwnedBySourceStudents,
      blockers,
    });
  }

  return { plans, skipped };
}

async function main() {
  const shouldApply = process.argv.includes('--apply');

  const { plans, skipped } = await buildPlans();
  const totals = plans.reduce(
    (acc, plan) => {
      acc.sourceClasses += 1;
      acc.blockedPlans += plan.blockers.length > 0 ? 1 : 0;
      acc.studentsToMove += plan.studentsToMove.length;
      acc.academicScoreRecordsToMove += plan.academicScoreRecordsToMove;
      acc.academicRecordsAlreadyOwnedByTargetStudents += plan.academicRecordsAlreadyOwnedByTargetStudents;
      acc.academicRecordsOwnedBySourceStudents += plan.academicRecordsOwnedBySourceStudents;
      return acc;
    },
    {
      sourceClasses: 0,
      blockedPlans: 0,
      studentsToMove: 0,
      academicScoreRecordsToMove: 0,
      academicRecordsAlreadyOwnedByTargetStudents: 0,
      academicRecordsOwnedBySourceStudents: 0,
    },
  );

  console.log(`成绩导入班级污染修复 ${shouldApply ? 'apply' : 'dry-run'}`);
  console.log(shouldApply ? '即将写入数据库。' : '不会写入数据库。');
  console.log('');
  console.log(`识别到可规划错误班级: ${totals.sourceClasses}`);
  console.log(`存在阻断项的计划: ${totals.blockedPlans}`);
  console.log(`待迁回学生: ${totals.studentsToMove}`);
  console.log(`待迁移成绩记录: ${totals.academicScoreRecordsToMove}`);
  console.log(`其中学生当前已在目标班级的成绩记录: ${totals.academicRecordsAlreadyOwnedByTargetStudents}`);
  console.log(`其中属于源错误班级学生的成绩记录: ${totals.academicRecordsOwnedBySourceStudents}`);
  if (skipped.length > 0) {
    console.log(`跳过的疑似班级: ${skipped.length}`);
  }
  console.log('');

  for (const plan of plans) {
    const status = plan.blockers.length > 0 ? 'BLOCKED' : 'READY';
    console.log(
      `[${status}] ${plan.sourceClass.id} ${plan.sourceClass.label} -> ${plan.targetClass.id} ${plan.targetClass.label}`,
    );
    console.log(
      `  学生 ${plan.studentsToMove.length} 人，成绩 ${plan.academicScoreRecordsToMove} 条；源班创建时间 ${plan.sourceClass.createdAt}`,
    );
    if (plan.studentsToMove.length > 0) {
      console.log(
        `  待迁学生：${plan.studentsToMove.map((item) => `${item.name}(${item.studentNo}, ${item.academicScoreRecordCount}条)`).join('、')}`,
      );
    }
    if (plan.blockers.length > 0) {
      console.log(`  阻断项：${plan.blockers.join('；')}`);
    }
  }

  if (skipped.length > 0) {
    console.log('');
    console.log('跳过列表：');
    skipped.forEach((item) => {
      console.log(`  ${item.classId} ${item.label}: ${item.reason}`);
    });
  }

  console.log('');
  console.log(
    totals.blockedPlans === 0
      ? 'dry-run 通过：当前计划没有阻断项。'
      : 'dry-run 未通过：存在阻断项，不能直接执行修复。',
  );

  if (!shouldApply) return;
  if (totals.blockedPlans > 0) {
    throw new Error('存在阻断项，已取消 apply。');
  }
  if (skipped.length > 0) {
    throw new Error('存在跳过的疑似班级，已取消 apply。');
  }

  console.log('');
  console.log('开始执行修复...');
  const repairedAt = new Date();
  const applyResult = await prisma.$transaction(
    async (tx) => {
      const results: Array<{
        sourceClassId: number;
        targetClassId: number;
        movedAcademicRecords: number;
        movedStudents: number;
        movedStudentProfiles: number;
        disabledClasses: number;
      }> = [];

      for (const plan of plans) {
        const sourceClassId = BigInt(plan.sourceClass.id);
        const targetClassId = BigInt(plan.targetClass.id);

        const movedAcademicRecords = await tx.academicScoreRecord.updateMany({
          where: { classId: sourceClassId },
          data: {
            classId: targetClassId,
            className: plan.targetClass.name,
          },
        });
        const movedStudentProfiles = await tx.studentProfile.updateMany({
          where: { classId: sourceClassId },
          data: { classId: targetClassId },
        });
        const movedStudents = await tx.student.updateMany({
          where: {
            classId: sourceClassId,
            deletedAt: null,
          },
          data: { classId: targetClassId },
        });
        const disabledClasses = await tx.classroom.updateMany({
          where: {
            id: sourceClassId,
            deletedAt: null,
            status: 'enabled',
          },
          data: {
            status: 'disabled',
            displayStatus: 'disabled',
            deletedAt: repairedAt,
          },
        });

        results.push({
          sourceClassId: plan.sourceClass.id,
          targetClassId: plan.targetClass.id,
          movedAcademicRecords: movedAcademicRecords.count,
          movedStudents: movedStudents.count,
          movedStudentProfiles: movedStudentProfiles.count,
          disabledClasses: disabledClasses.count,
        });
      }

      return results;
    },
    { maxWait: 10000, timeout: 120000 },
  );

  console.log('修复写入完成：');
  applyResult.forEach((item) => {
    console.log(
      `  ${item.sourceClassId} -> ${item.targetClassId}: 成绩 ${item.movedAcademicRecords} 条，学生 ${item.movedStudents} 人，学生档案 ${item.movedStudentProfiles} 条，停用班级 ${item.disabledClasses} 个`,
    );
  });

  const postPlans = await buildPlans();
  console.log('');
  console.log(`修复后仍可规划错误班级: ${postPlans.plans.length}`);
  console.log(`修复后跳过疑似班级: ${postPlans.skipped.length}`);
  if (postPlans.plans.length > 0 || postPlans.skipped.length > 0) {
    throw new Error('修复后仍存在疑似污染班级，请检查输出。');
  }
  console.log('修复后校验通过。');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
