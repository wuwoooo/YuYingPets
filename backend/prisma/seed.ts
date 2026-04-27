import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

function importScoreRulesFromXls() {
  const backendRoot = path.resolve(__dirname, '..');
  execFileSync(process.execPath, [path.resolve(backendRoot, 'scripts/import-score-rules-from-xls.cjs')], {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

function importPetCatalog() {
  const backendRoot = path.resolve(__dirname, '..');
  execFileSync(process.execPath, [path.resolve(backendRoot, 'scripts/import-pet-catalog.cjs')], {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

async function main() {
  const school = await prisma.school.upsert({
    where: { code: 'YYXX' },
    update: {
      name: '育英学校',
    },
    create: {
      code: 'YYXX',
      name: '育英学校',
      motto: '育英启智 星宠同行',
      status: 'enabled',
    },
  });

  const semester = await prisma.semester.upsert({
    where: { id: 1n },
    update: {
      schoolId: school.id,
      isCurrent: true,
    },
    create: {
      id: 1n,
      schoolId: school.id,
      name: '2026春季学期',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-07-15'),
      isCurrent: true,
      status: 'enabled',
    },
  });

  const roleCodes = [
    ['super_admin', '系统管理员'],
    ['school_admin', '学校管理员'],
    ['moral_admin', '德育管理员'],
    ['homeroom_teacher', '班主任'],
    ['subject_teacher', '任课教师'],
  ] as const;

  await prisma.gradeConfig.deleteMany({
    where: { schoolId: school.id },
  });
  await prisma.gradeConfig.createMany({
    data: [
      { schoolId: school.id, code: 'G7', name: '七年级', sortOrder: 1, status: 'enabled' },
      { schoolId: school.id, code: 'G8', name: '八年级', sortOrder: 2, status: 'enabled' },
      { schoolId: school.id, code: 'G9', name: '九年级', sortOrder: 3, status: 'enabled' },
    ],
  });

  const roleMap = new Map<string, bigint>();
  for (const [code, name] of roleCodes) {
    const role = await prisma.role.upsert({
      where: { id: BigInt(roleMap.size + 1) },
      update: {
        schoolId: school.id,
        code,
        name,
      },
      create: {
        id: BigInt(roleMap.size + 1),
        schoolId: school.id,
        code,
        name,
        isSystem: true,
      },
    });
    roleMap.set(code, role.id);
  }

  const homeroomTeacher = await prisma.user.upsert({
    where: { username: 'teacher_demo' },
    update: {
      schoolId: school.id,
      roleId: roleMap.get('homeroom_teacher')!,
      passwordHash: hashSync('123456', 10),
      name: '演示班主任',
      status: 'enabled',
    },
    create: {
      schoolId: school.id,
      roleId: roleMap.get('homeroom_teacher')!,
      username: 'teacher_demo',
      passwordHash: hashSync('123456', 10),
      name: '演示班主任',
      status: 'enabled',
    },
  });

  const subjectTeacher = await prisma.user.upsert({
    where: { username: 'subject_demo' },
    update: {
      schoolId: school.id,
      roleId: roleMap.get('subject_teacher')!,
      passwordHash: hashSync('123456', 10),
      name: '演示任课教师',
      status: 'enabled',
    },
    create: {
      schoolId: school.id,
      roleId: roleMap.get('subject_teacher')!,
      username: 'subject_demo',
      passwordHash: hashSync('123456', 10),
      name: '演示任课教师',
      status: 'enabled',
    },
  });

  const homeroomTeacherB = await prisma.user.upsert({
    where: { username: 'teacher_demo_b' },
    update: {
      schoolId: school.id,
      roleId: roleMap.get('homeroom_teacher')!,
      passwordHash: hashSync('123456', 10),
      name: '演示班主任乙',
      status: 'enabled',
    },
    create: {
      schoolId: school.id,
      roleId: roleMap.get('homeroom_teacher')!,
      username: 'teacher_demo_b',
      passwordHash: hashSync('123456', 10),
      name: '演示班主任乙',
      status: 'enabled',
    },
  });

  const homeroomTeacherC = await prisma.user.upsert({
    where: { username: 'teacher_demo_c' },
    update: {
      schoolId: school.id,
      roleId: roleMap.get('homeroom_teacher')!,
      passwordHash: hashSync('123456', 10),
      name: '演示班主任丙',
      status: 'enabled',
    },
    create: {
      schoolId: school.id,
      roleId: roleMap.get('homeroom_teacher')!,
      username: 'teacher_demo_c',
      passwordHash: hashSync('123456', 10),
      name: '演示班主任丙',
      status: 'enabled',
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin_demo' },
    update: {
      schoolId: school.id,
      roleId: roleMap.get('super_admin')!,
      passwordHash: hashSync('123456', 10),
      name: '演示超级管理员',
      status: 'enabled',
    },
    create: {
      schoolId: school.id,
      roleId: roleMap.get('super_admin')!,
      username: 'superadmin_demo',
      passwordHash: hashSync('123456', 10),
      name: '演示超级管理员',
      status: 'enabled',
    },
  });

  const classroom = await prisma.classroom.upsert({
    where: { id: 1n },
    update: {
      schoolId: school.id,
      semesterId: semester.id,
      code: 'CLASS-0701',
      gradeCode: 'G7',
      gradeName: '七年级',
      name: '七(1)班',
      homeroomTeacherId: homeroomTeacher.id,
      targetScore: 100,
      displayStatus: 'enabled',
      status: 'enabled',
    },
    create: {
      id: 1n,
      schoolId: school.id,
      semesterId: semester.id,
      code: 'CLASS-0701',
      gradeCode: 'G7',
      gradeName: '七年级',
      name: '七(1)班',
      homeroomTeacherId: homeroomTeacher.id,
      targetScore: 100,
      displayStatus: 'enabled',
      status: 'enabled',
    },
  });

  const classroomB = await prisma.classroom.upsert({
    where: { id: 2n },
    update: {
      schoolId: school.id,
      semesterId: semester.id,
      code: 'CLASS-0801',
      homeroomTeacherId: homeroomTeacherB.id,
      gradeCode: 'G8',
      gradeName: '八年级',
      name: '八(1)班',
      slogan: '向阳而生 勇敢追梦',
      targetScore: 120,
      displayStatus: 'enabled',
      status: 'enabled',
    },
    create: {
      id: 2n,
      schoolId: school.id,
      semesterId: semester.id,
      code: 'CLASS-0801',
      gradeCode: 'G8',
      gradeName: '八年级',
      name: '八(1)班',
      homeroomTeacherId: homeroomTeacherB.id,
      slogan: '向阳而生 勇敢追梦',
      targetScore: 120,
      displayStatus: 'enabled',
      status: 'enabled',
    },
  });

  const classroomC = await prisma.classroom.upsert({
    where: { id: 3n },
    update: {
      schoolId: school.id,
      semesterId: semester.id,
      code: 'CLASS-0901',
      homeroomTeacherId: homeroomTeacherC.id,
      gradeCode: 'G9',
      gradeName: '九年级',
      name: '九(1)班',
      slogan: '自律向上 星火成光',
      targetScore: 150,
      displayStatus: 'enabled',
      status: 'enabled',
    },
    create: {
      id: 3n,
      schoolId: school.id,
      semesterId: semester.id,
      code: 'CLASS-0901',
      gradeCode: 'G9',
      gradeName: '九年级',
      name: '九(1)班',
      homeroomTeacherId: homeroomTeacherC.id,
      slogan: '自律向上 星火成光',
      targetScore: 150,
      displayStatus: 'enabled',
      status: 'enabled',
    },
  });

  await prisma.userScope.upsert({
    where: { id: 1n },
    update: {
      userId: homeroomTeacher.id,
      scopeType: 'class_scope',
      classId: classroom.id,
    },
    create: {
      id: 1n,
      userId: homeroomTeacher.id,
      scopeType: 'class_scope',
      classId: classroom.id,
    },
  });

  await prisma.userScope.upsert({
    where: { id: 2n },
    update: {
      userId: subjectTeacher.id,
      scopeType: 'class_scope',
      classId: classroom.id,
    },
    create: {
      id: 2n,
      userId: subjectTeacher.id,
      scopeType: 'class_scope',
      classId: classroom.id,
    },
  });

  await prisma.userScope.upsert({
    where: { id: 4n },
    update: {
      userId: homeroomTeacherB.id,
      scopeType: 'class_scope',
      classId: classroomB.id,
    },
    create: {
      id: 4n,
      userId: homeroomTeacherB.id,
      scopeType: 'class_scope',
      classId: classroomB.id,
    },
  });

  await prisma.userScope.upsert({
    where: { id: 5n },
    update: {
      userId: homeroomTeacherC.id,
      scopeType: 'class_scope',
      classId: classroomC.id,
    },
    create: {
      id: 5n,
      userId: homeroomTeacherC.id,
      scopeType: 'class_scope',
      classId: classroomC.id,
    },
  });

  await prisma.userScope.upsert({
    where: { id: 6n },
    update: {
      userId: subjectTeacher.id,
      scopeType: 'class_scope',
      classId: classroomB.id,
    },
    create: {
      id: 6n,
      userId: subjectTeacher.id,
      scopeType: 'class_scope',
      classId: classroomB.id,
    },
  });

  await prisma.userScope.upsert({
    where: { id: 7n },
    update: {
      userId: subjectTeacher.id,
      scopeType: 'class_scope',
      classId: classroomC.id,
    },
    create: {
      id: 7n,
      userId: subjectTeacher.id,
      scopeType: 'class_scope',
      classId: classroomC.id,
    },
  });

  await prisma.userScope.upsert({
    where: { id: 3n },
    update: {
      userId: superAdmin.id,
      scopeType: 'school',
      classId: null,
    },
    create: {
      id: 3n,
      userId: superAdmin.id,
      scopeType: 'school',
    },
  });

  const studentA = await prisma.student.upsert({
    where: { id: 1n },
    update: {
      schoolId: school.id,
      classId: classroom.id,
      name: '李星星',
      status: 'enabled',
    },
    create: {
      id: 1n,
      schoolId: school.id,
      classId: classroom.id,
      studentNo: '20260101',
      name: '李星星',
      status: 'enabled',
    },
  });

  const studentB = await prisma.student.upsert({
    where: { id: 2n },
    update: {
      schoolId: school.id,
      classId: classroom.id,
      name: '王宠宠',
      status: 'enabled',
    },
    create: {
      id: 2n,
      schoolId: school.id,
      classId: classroom.id,
      studentNo: '20260102',
      name: '王宠宠',
      status: 'enabled',
    },
  });

  const studentC = await prisma.student.upsert({
    where: { id: 3n },
    update: {
      schoolId: school.id,
      classId: classroom.id,
      name: '陈晨光',
      status: 'enabled',
    },
    create: {
      id: 3n,
      schoolId: school.id,
      classId: classroom.id,
      studentNo: '20260103',
      name: '陈晨光',
      status: 'enabled',
    },
  });

  const studentD = await prisma.student.upsert({
    where: { id: 4n },
    update: {
      schoolId: school.id,
      classId: classroom.id,
      name: '赵小满',
      status: 'enabled',
    },
    create: {
      id: 4n,
      schoolId: school.id,
      classId: classroom.id,
      studentNo: '20260104',
      name: '赵小满',
      status: 'enabled',
    },
  });

  const extraStudents = [
    { id: 5n, classId: classroomB.id, studentNo: '20260105', name: '林星河' },
    { id: 6n, classId: classroomB.id, studentNo: '20260106', name: '许知夏' },
    { id: 7n, classId: classroomB.id, studentNo: '20260107', name: '沈月白' },
    { id: 8n, classId: classroomB.id, studentNo: '20260108', name: '顾言希' },
    { id: 9n, classId: classroomC.id, studentNo: '20260201', name: '周若晨' },
    { id: 10n, classId: classroomC.id, studentNo: '20260202', name: '陆景明' },
    { id: 11n, classId: classroomC.id, studentNo: '20260203', name: '唐可可' },
    { id: 12n, classId: classroomC.id, studentNo: '20260204', name: '宋嘉禾' },
  ] as const;

  for (const item of extraStudents) {
    await prisma.student.upsert({
      where: { id: item.id },
      update: {
        schoolId: school.id,
        classId: item.classId,
        studentNo: item.studentNo,
        name: item.name,
        status: 'enabled',
      },
      create: {
        id: item.id,
        schoolId: school.id,
        classId: item.classId,
        studentNo: item.studentNo,
        name: item.name,
        status: 'enabled',
      },
    });
  }

  await prisma.studentProfile.upsert({
    where: { studentId: studentA.id },
    update: { classId: classroom.id },
    create: { studentId: studentA.id, classId: classroom.id },
  });

  await prisma.studentProfile.upsert({
    where: { studentId: studentB.id },
    update: { classId: classroom.id },
    create: { studentId: studentB.id, classId: classroom.id },
  });

  await prisma.studentProfile.upsert({
    where: { studentId: studentC.id },
    update: { classId: classroom.id },
    create: { studentId: studentC.id, classId: classroom.id },
  });

  await prisma.studentProfile.upsert({
    where: { studentId: studentD.id },
    update: { classId: classroom.id },
    create: { studentId: studentD.id, classId: classroom.id },
  });

  for (const item of extraStudents) {
    await prisma.studentProfile.upsert({
      where: { studentId: item.id },
      update: { classId: item.classId },
      create: { studentId: item.id, classId: item.classId },
    });
  }

  const groupA = await prisma.classGroup.upsert({
    where: { id: 1n },
    update: {
      classId: classroom.id,
      groupNo: 1,
      name: '启明星组',
      status: 'enabled',
    },
    create: {
      id: 1n,
      classId: classroom.id,
      groupNo: 1,
      name: '启明星组',
      status: 'enabled',
    },
  });

  const groupB = await prisma.classGroup.upsert({
    where: { id: 2n },
    update: {
      classId: classroom.id,
      groupNo: 2,
      name: '北斗星组',
      status: 'enabled',
    },
    create: {
      id: 2n,
      classId: classroom.id,
      groupNo: 2,
      name: '北斗星组',
      status: 'enabled',
    },
  });

  const groupC = await prisma.classGroup.upsert({
    where: { id: 3n },
    update: {
      classId: classroomB.id,
      groupNo: 1,
      name: '晨曦组',
      status: 'enabled',
    },
    create: {
      id: 3n,
      classId: classroomB.id,
      groupNo: 1,
      name: '晨曦组',
      status: 'enabled',
    },
  });

  const groupD = await prisma.classGroup.upsert({
    where: { id: 4n },
    update: {
      classId: classroomB.id,
      groupNo: 2,
      name: '远航组',
      status: 'enabled',
    },
    create: {
      id: 4n,
      classId: classroomB.id,
      groupNo: 2,
      name: '远航组',
      status: 'enabled',
    },
  });

  const groupE = await prisma.classGroup.upsert({
    where: { id: 5n },
    update: {
      classId: classroomC.id,
      groupNo: 1,
      name: '星辰组',
      status: 'enabled',
    },
    create: {
      id: 5n,
      classId: classroomC.id,
      groupNo: 1,
      name: '星辰组',
      status: 'enabled',
    },
  });

  const groupF = await prisma.classGroup.upsert({
    where: { id: 6n },
    update: {
      classId: classroomC.id,
      groupNo: 2,
      name: '云帆组',
      status: 'enabled',
    },
    create: {
      id: 6n,
      classId: classroomC.id,
      groupNo: 2,
      name: '云帆组',
      status: 'enabled',
    },
  });

  await prisma.studentGroupRel.upsert({
    where: { studentId: studentA.id },
    update: { classGroupId: groupA.id },
    create: { studentId: studentA.id, classGroupId: groupA.id },
  });

  await prisma.studentGroupRel.upsert({
    where: { studentId: studentB.id },
    update: { classGroupId: groupA.id },
    create: { studentId: studentB.id, classGroupId: groupA.id },
  });

  await prisma.studentGroupRel.upsert({
    where: { studentId: studentC.id },
    update: { classGroupId: groupB.id },
    create: { studentId: studentC.id, classGroupId: groupB.id },
  });

  await prisma.studentGroupRel.upsert({
    where: { studentId: studentD.id },
    update: { classGroupId: groupB.id },
    create: { studentId: studentD.id, classGroupId: groupB.id },
  });

  const groupAssignments = [
    { studentId: 5n, classGroupId: groupC.id },
    { studentId: 6n, classGroupId: groupC.id },
    { studentId: 7n, classGroupId: groupD.id },
    { studentId: 8n, classGroupId: groupD.id },
    { studentId: 9n, classGroupId: groupE.id },
    { studentId: 10n, classGroupId: groupE.id },
    { studentId: 11n, classGroupId: groupF.id },
    { studentId: 12n, classGroupId: groupF.id },
  ] as const;

  for (const item of groupAssignments) {
    await prisma.studentGroupRel.upsert({
      where: { studentId: item.studentId },
      update: { classGroupId: item.classGroupId },
      create: { studentId: item.studentId, classGroupId: item.classGroupId },
    });
  }

  await prisma.rewardOrder.deleteMany({
    where: { schoolId: school.id },
  });
  await prisma.reward.deleteMany({
    where: { schoolId: school.id },
  });
  await prisma.reward.createMany({
    data: [
      {
        schoolId: school.id,
        code: 'REWARD-CALENDAR',
        name: '育英台历',
        category: '文化周边',
        imageUrl: '/uploads/rewards/gift-calendar.jpg',
        scoreCost: 120,
        stockQty: 30,
        isInfiniteStock: false,
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'REWARD-CARD',
        name: '育英小卡',
        category: '文化周边',
        imageUrl: '/uploads/rewards/gift-card.jpg',
        scoreCost: 80,
        stockQty: 80,
        isInfiniteStock: false,
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'REWARD-TOTE-BAG',
        name: '育英布袋',
        category: '实用礼品',
        imageUrl: '/uploads/rewards/gift-tote-bag.jpg',
        scoreCost: 160,
        stockQty: 40,
        isInfiniteStock: false,
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'REWARD-PILLOW',
        name: '育英抱枕',
        category: '生活用品',
        imageUrl: '/uploads/rewards/gift-pillow.jpg',
        scoreCost: 220,
        stockQty: 20,
        isInfiniteStock: false,
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'REWARD-CUP',
        name: '育英水杯',
        category: '生活用品',
        imageUrl: '/uploads/rewards/gift-cup.jpg',
        scoreCost: 140,
        stockQty: 50,
        isInfiniteStock: false,
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'REWARD-KEYCHAIN',
        name: '育英钥匙扣',
        category: '文化周边',
        imageUrl: '/uploads/rewards/gift-keychain.jpg',
        scoreCost: 60,
        stockQty: 120,
        isInfiniteStock: false,
        status: 'enabled',
      },
    ],
  });

  await prisma.displayConfig.upsert({
    where: { id: 1n },
    update: {
      schoolId: school.id,
      classId: classroom.id,
      title: '育英星宠',
      subtitle: '欢迎进入七(1)班',
    },
    create: {
      id: 1n,
      schoolId: school.id,
      classId: classroom.id,
      title: '育英星宠',
      subtitle: '欢迎进入七(1)班',
      defaultMode: 'class-home',
    },
  });

  await prisma.displayConfig.upsert({
    where: { id: 2n },
    update: {
      schoolId: school.id,
      classId: classroomB.id,
      title: '育英星宠',
      subtitle: '欢迎进入八(1)班',
    },
    create: {
      id: 2n,
      schoolId: school.id,
      classId: classroomB.id,
      title: '育英星宠',
      subtitle: '欢迎进入八(1)班',
      defaultMode: 'class-home',
    },
  });

  await prisma.displayConfig.upsert({
    where: { id: 3n },
    update: {
      schoolId: school.id,
      classId: classroomC.id,
      title: '育英星宠',
      subtitle: '欢迎进入九(1)班',
    },
    create: {
      id: 3n,
      schoolId: school.id,
      classId: classroomC.id,
      title: '育英星宠',
      subtitle: '欢迎进入九(1)班',
      defaultMode: 'class-home',
    },
  });

  await prisma.honorRecord.deleteMany({
    where: { schoolId: school.id },
  });
  await prisma.honor.deleteMany({
    where: { schoolId: school.id },
  });
  await prisma.honor.createMany({
    data: [
      {
        schoolId: school.id,
        code: 'HONOR-CLASS-FOCUS',
        name: '课堂专注之星',
        category: 'personal',
        iconUrl: '/uploads/honors/honor-focus.svg',
        description: '课堂专注、主动思考并持续保持学习投入。',
        conditionType: '连续一周课堂专注表现优秀',
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'HONOR-READING-STAR',
        name: '阅读成长之星',
        category: 'personal',
        iconUrl: '/uploads/honors/honor-reading.svg',
        description: '阅读习惯稳定，能输出读书笔记与分享。',
        conditionType: '月度阅读任务达成',
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'HONOR-HELPER-STAR',
        name: '乐于助人之星',
        category: 'personal',
        iconUrl: '/uploads/honors/honor-help.svg',
        description: '主动帮助同学，具备积极合作与服务意识。',
        conditionType: '同伴互助表现突出',
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'HONOR-SPORT-STAR',
        name: '运动活力之星',
        category: 'personal',
        iconUrl: '/uploads/honors/honor-sport.svg',
        description: '积极参与体育活动，展现健康阳光风貌。',
        conditionType: '体育活动参与度高',
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'HONOR-PROGRESS-STAR',
        name: '学习进步之星',
        category: 'phase',
        iconUrl: '/uploads/honors/honor-progress.svg',
        description: '阶段性提升明显，学习态度与结果同步进步。',
        conditionType: '阶段成绩与行为评价双提升',
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'HONOR-TEAM-PIONEER',
        name: '班级协作先锋',
        category: 'collective',
        iconUrl: '/uploads/honors/honor-team.svg',
        description: '集体协作高效，班级任务执行力强。',
        conditionType: '班级协同活动表现优秀',
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'HONOR-CIVILIZED-CLASS',
        name: '文明示范班集体',
        category: 'collective',
        iconUrl: '/uploads/honors/honor-civilized.svg',
        description: '班风学风优良，行为规范与课堂秩序突出。',
        conditionType: '月度文明班评选达标',
        status: 'enabled',
      },
      {
        schoolId: school.id,
        code: 'HONOR-EXCELLENCE-LONGTERM',
        name: '卓越成长徽章',
        category: 'longterm',
        iconUrl: '/uploads/honors/honor-excellence.svg',
        description: '长期稳定优秀，在学习与品德上持续领跑。',
        conditionType: '学期综合表现持续优秀',
        status: 'enabled',
      },
    ],
  });

  importPetCatalog();
  importScoreRulesFromXls();

  await prisma.displayTerminal.deleteMany({
    where: {
      terminalCode: {
        in: ['display-web-demo', 'display-init-demo'],
      },
    },
  });
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
