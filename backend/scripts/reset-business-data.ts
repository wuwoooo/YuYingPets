import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESET_TARGETS = [
  'teachers',
  'students',
  'classes',
  'schedules',
  'scores',
  'academics',
  'pets',
  'honors',
  'rewards',
  'insights',
  'logs',
] as const;

type ResetTarget = (typeof RESET_TARGETS)[number];

function printUsage() {
  console.log(`
用法:
  npm run reset:business
  npm run reset:business -- --only=students
  npm run reset:business -- --only=teachers,schedules,scores

可选模块:
  teachers   教师账号、教师权限范围、教师任教关系
  students   学生、学生画像、学生分组
  classes    班级及其班级级联业务数据
  schedules  教师课表、待匹配课表、教研解锁会话
  scores     积分记录、班级积分记录
  academics  成绩导入、考试成绩
  pets       学生星宠与升级记录
  honors     荣誉发放记录
  rewards    奖励兑换记录
  insights   AI快照、教师观察
  logs       操作日志

说明:
  1. 不带参数时，默认清空全部业务数据。
  2. classes 会自动联动清空 students/schedules/scores/academics/pets/honors/rewards/insights。
  3. 保留学校、学期、角色、年级配置、积分规则、荣誉定义、奖励定义、展示配置、萌宠目录、系统管理员账号。
`);
}

function parseOnlyArgs(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const onlyArg = argv.find((arg) => arg.startsWith('--only='));
  if (!onlyArg) {
    return new Set<ResetTarget>(RESET_TARGETS);
  }

  const rawTargets = onlyArg
    .slice('--only='.length)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (rawTargets.length === 0) {
    throw new Error('`--only` 不能为空');
  }

  const invalidTargets = rawTargets.filter((item) => !RESET_TARGETS.includes(item as ResetTarget));
  if (invalidTargets.length > 0) {
    throw new Error(`存在无效模块: ${invalidTargets.join(', ')}`);
  }

  return new Set<ResetTarget>(rawTargets as ResetTarget[]);
}

function expandTargets(selectedTargets: Set<ResetTarget>) {
  const expanded = new Set<ResetTarget>(selectedTargets);

  if (expanded.has('classes')) {
    expanded.add('students');
    expanded.add('schedules');
    expanded.add('scores');
    expanded.add('academics');
    expanded.add('pets');
    expanded.add('honors');
    expanded.add('rewards');
    expanded.add('insights');
  }

  return expanded;
}

async function main() {
  const selectedTargets = expandTargets(parseOnlyArgs(process.argv.slice(2)));
  const adminUsers = await prisma.user.findMany({
    where: {
      deletedAt: null,
      role: { code: 'super_admin' },
    },
    select: { id: true, username: true },
  });
  const preservedAdminIds = adminUsers.map((item) => item.id);
  const deletableUsers = selectedTargets.has('teachers')
    ? await prisma.user.findMany({
        where: {
          id: {
            notIn: preservedAdminIds,
          },
        },
        select: {
          id: true,
          username: true,
        },
      })
    : [];
  const archivedAt = Date.now();

  console.log(`本次清理模块: ${Array.from(selectedTargets).join(', ')}`);
  console.log(`保留系统管理员账号 ${adminUsers.length} 个：${adminUsers.map((item) => item.username).join(', ') || '无'}`);

  await prisma.$transaction(async (tx) => {
    if (selectedTargets.has('logs')) {
      await tx.operationLog.deleteMany({});
    }

    if (selectedTargets.has('schedules')) {
      await tx.displayUnlockSession.deleteMany({});
      await tx.pendingTeacherScheduleSlot.deleteMany({});
      await tx.teacherScheduleSlot.deleteMany({});
      await tx.teacherClassAssignment.deleteMany({});
      await tx.userScope.deleteMany({
        where: preservedAdminIds.length > 0 ? { userId: { notIn: preservedAdminIds } } : {},
      });
      await tx.classroom.updateMany({
        where: { homeroomTeacherId: { not: null } },
        data: { homeroomTeacherId: null },
      });
      await tx.displayTerminal.updateMany({
        where: { initializedBy: { not: null } },
        data: { initializedBy: null },
      });
    }

    if (selectedTargets.has('insights')) {
      await tx.teacherObservation.deleteMany({});
      await tx.aiStudentSnapshot.deleteMany({});
    }

    if (selectedTargets.has('rewards')) {
      await tx.rewardOrder.deleteMany({});
    }

    if (selectedTargets.has('honors')) {
      await tx.honorRecord.deleteMany({});
    }

    if (selectedTargets.has('pets')) {
      await tx.petLevelLog.deleteMany({});
      await tx.studentPet.deleteMany({});
    }

    if (selectedTargets.has('academics')) {
      await tx.academicScoreRecord.deleteMany({});
      await tx.academicExam.deleteMany({});
    }

    if (selectedTargets.has('scores')) {
      await tx.scoreRecordBatchItem.deleteMany({});
      await tx.scoreRecordBatch.deleteMany({});
      await tx.scoreRecord.deleteMany({});
      await tx.classScoreRecord.deleteMany({});
      await tx.classScoreRecordBatch.deleteMany({});
      await tx.classScoreProfile.deleteMany({});
    }

    if (selectedTargets.has('students')) {
      await tx.studentGroupRel.deleteMany({});
      await tx.classGroup.deleteMany({});
      await tx.studentProfile.deleteMany({});
      await tx.student.deleteMany({});
    }

    if (selectedTargets.has('classes')) {
      await tx.displayConfig.deleteMany({ where: { classId: { not: null } } });
      await tx.displayTerminal.updateMany({
        where: { classId: { not: null } },
        data: { classId: null, initializedBy: null, initializedAt: null, lastBoundAt: null },
      });
      await tx.classroom.deleteMany({});
    }

    if (selectedTargets.has('teachers')) {
      await tx.scoreRule.updateMany({
        where: {
          OR: [
            { createdBy: { not: null } },
            { updatedBy: { not: null } },
          ],
        },
        data: {
          createdBy: null,
          updatedBy: null,
        },
      });

      await tx.userScope.deleteMany({
        where: preservedAdminIds.length > 0 ? { userId: { notIn: preservedAdminIds } } : {},
      });

      for (const user of deletableUsers) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            username: `archived_${user.id}_${archivedAt}`,
            deletedAt: new Date(),
            status: 'disabled',
            phone: null,
            email: null,
            dutyTags: [],
          },
        });
      }
    }
  });

  console.log('业务数据清理完成。');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
