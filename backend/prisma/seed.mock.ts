import { PrismaClient, Sentiment, TerminalType } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

type RuleLite = {
  id: bigint;
  subjectCode: string | null;
  sceneCode: string;
  dimension: string | null;
  tag: string | null;
  sentiment: Sentiment;
  scoreType: 'add' | 'deduct';
  scoreValue: number;
};

function daysAgo(days: number, hour = 9): Date {
  const now = new Date();
  now.setDate(now.getDate() - days);
  now.setHours(hour, (days * 7) % 60, (days * 13) % 60, 0);
  return now;
}

async function getRoleId(schoolId: bigint, code: string): Promise<bigint> {
  const role = await prisma.role.findFirst({
    where: { schoolId, code },
    select: { id: true },
  });
  if (!role) throw new Error(`缺少角色: ${code}，请先执行默认初始化数据`);
  return role.id;
}

async function main() {
  const school = await prisma.school.findFirst({ where: { code: 'YYXX' } });
  if (!school) throw new Error('未找到学校 YYXX，请先执行默认初始化数据');

  const semester =
    (await prisma.semester.findFirst({ where: { schoolId: school.id, isCurrent: true }, orderBy: { id: 'desc' } })) ??
    (await prisma.semester.findFirst({ where: { schoolId: school.id }, orderBy: { id: 'desc' } }));
  if (!semester) throw new Error('未找到学期数据，请先执行默认初始化数据');

  const superAdminRoleId = await getRoleId(school.id, 'super_admin');
  const homeroomRoleId = await getRoleId(school.id, 'homeroom_teacher');
  const subjectRoleId = await getRoleId(school.id, 'subject_teacher');

  const teacherDemo = await prisma.user.upsert({
    where: { username: 'teacher_demo' },
    update: { schoolId: school.id, roleId: homeroomRoleId, passwordHash: hashSync('123456', 10), name: '演示班主任', status: 'enabled' },
    create: { schoolId: school.id, roleId: homeroomRoleId, username: 'teacher_demo', passwordHash: hashSync('123456', 10), name: '演示班主任', status: 'enabled' },
  });
  const subjectDemo = await prisma.user.upsert({
    where: { username: 'subject_demo' },
    update: { schoolId: school.id, roleId: subjectRoleId, passwordHash: hashSync('123456', 10), name: '演示任课教师', status: 'enabled' },
    create: { schoolId: school.id, roleId: subjectRoleId, username: 'subject_demo', passwordHash: hashSync('123456', 10), name: '演示任课教师', status: 'enabled' },
  });
  const teacherDemoB = await prisma.user.upsert({
    where: { username: 'teacher_demo_b' },
    update: { schoolId: school.id, roleId: homeroomRoleId, passwordHash: hashSync('123456', 10), name: '演示班主任乙', status: 'enabled' },
    create: { schoolId: school.id, roleId: homeroomRoleId, username: 'teacher_demo_b', passwordHash: hashSync('123456', 10), name: '演示班主任乙', status: 'enabled' },
  });
  const teacherDemoC = await prisma.user.upsert({
    where: { username: 'teacher_demo_c' },
    update: { schoolId: school.id, roleId: homeroomRoleId, passwordHash: hashSync('123456', 10), name: '演示班主任丙', status: 'enabled' },
    create: { schoolId: school.id, roleId: homeroomRoleId, username: 'teacher_demo_c', passwordHash: hashSync('123456', 10), name: '演示班主任丙', status: 'enabled' },
  });
  const superAdminDemo = await prisma.user.upsert({
    where: { username: 'superadmin_demo' },
    update: { schoolId: school.id, roleId: superAdminRoleId, passwordHash: hashSync('123456', 10), name: '演示超级管理员', status: 'enabled' },
    create: { schoolId: school.id, roleId: superAdminRoleId, username: 'superadmin_demo', passwordHash: hashSync('123456', 10), name: '演示超级管理员', status: 'enabled' },
  });

  const classroomA = await prisma.classroom.upsert({
    where: { id: 1n },
    update: { schoolId: school.id, semesterId: semester.id, code: 'CLASS-0601', gradeCode: 'G6', gradeName: '六年级', name: '61班', homeroomTeacherId: teacherDemo.id, slogan: '奋楫扬帆 向星而行', targetScore: 3000, displayStatus: 'enabled', status: 'enabled' },
    create: { id: 1n, schoolId: school.id, semesterId: semester.id, code: 'CLASS-0601', gradeCode: 'G6', gradeName: '六年级', name: '61班', homeroomTeacherId: teacherDemo.id, slogan: '奋楫扬帆 向星而行', targetScore: 3000, displayStatus: 'enabled', status: 'enabled' },
  });
  const classroomB = await prisma.classroom.upsert({
    where: { id: 2n },
    update: { schoolId: school.id, semesterId: semester.id, code: 'CLASS-0801', gradeCode: 'G8', gradeName: '八年级', name: '八(1)班', homeroomTeacherId: teacherDemoB.id, slogan: '向阳而生 勇敢追梦', targetScore: 120, displayStatus: 'enabled', status: 'enabled' },
    create: { id: 2n, schoolId: school.id, semesterId: semester.id, code: 'CLASS-0801', gradeCode: 'G8', gradeName: '八年级', name: '八(1)班', homeroomTeacherId: teacherDemoB.id, slogan: '向阳而生 勇敢追梦', targetScore: 120, displayStatus: 'enabled', status: 'enabled' },
  });
  const classroomC = await prisma.classroom.upsert({
    where: { id: 3n },
    update: { schoolId: school.id, semesterId: semester.id, code: 'CLASS-0901', gradeCode: 'G9', gradeName: '九年级', name: '九(1)班', homeroomTeacherId: teacherDemoC.id, slogan: '自律向上 星火成光', targetScore: 150, displayStatus: 'enabled', status: 'enabled' },
    create: { id: 3n, schoolId: school.id, semesterId: semester.id, code: 'CLASS-0901', gradeCode: 'G9', gradeName: '九年级', name: '九(1)班', homeroomTeacherId: teacherDemoC.id, slogan: '自律向上 星火成光', targetScore: 150, displayStatus: 'enabled', status: 'enabled' },
  });

  const scopeRows = [
    { id: 1n, userId: teacherDemo.id, scopeType: 'class_scope' as const, classId: classroomA.id },
    { id: 2n, userId: subjectDemo.id, scopeType: 'class_scope' as const, classId: classroomA.id },
    { id: 3n, userId: superAdminDemo.id, scopeType: 'school' as const, classId: null },
    { id: 4n, userId: teacherDemoB.id, scopeType: 'class_scope' as const, classId: classroomB.id },
    { id: 5n, userId: teacherDemoC.id, scopeType: 'class_scope' as const, classId: classroomC.id },
    { id: 6n, userId: subjectDemo.id, scopeType: 'class_scope' as const, classId: classroomB.id },
    { id: 7n, userId: subjectDemo.id, scopeType: 'class_scope' as const, classId: classroomC.id },
  ];
  for (const row of scopeRows) {
    await prisma.userScope.upsert({ where: { id: row.id }, update: row, create: row });
  }

  await prisma.teacherClassAssignment.deleteMany({
    where: {
      schoolId: school.id,
      teacherId: { in: [teacherDemo.id, teacherDemoB.id, teacherDemoC.id] },
      roleInClass: 'homeroom',
    },
  });
  await prisma.teacherClassAssignment.createMany({
    data: [
      { schoolId: school.id, teacherId: teacherDemo.id, classId: classroomA.id, roleInClass: 'homeroom', isPrimary: true },
      { schoolId: school.id, teacherId: teacherDemoB.id, classId: classroomB.id, roleInClass: 'homeroom', isPrimary: true },
      { schoolId: school.id, teacherId: teacherDemoC.id, classId: classroomC.id, roleInClass: 'homeroom', isPrimary: true },
    ],
  });

  const students = [
    { id: 1n, classId: classroomA.id, studentNo: '20260101', name: '李星星', gender: '男' },
    { id: 2n, classId: classroomA.id, studentNo: '20260102', name: '王宠宠', gender: '女' },
    { id: 3n, classId: classroomA.id, studentNo: '20260103', name: '陈晨光', gender: '男' },
    { id: 4n, classId: classroomA.id, studentNo: '20260104', name: '赵小满', gender: '女' },
    { id: 13n, classId: classroomA.id, studentNo: '20260105', name: '许晨曦', gender: '女' },
    { id: 14n, classId: classroomA.id, studentNo: '20260106', name: '秦一鸣', gender: '男' },
    { id: 15n, classId: classroomA.id, studentNo: '20260107', name: '梁若安', gender: '女' },
    { id: 16n, classId: classroomA.id, studentNo: '20260108', name: '宋知夏', gender: '女' },
    { id: 17n, classId: classroomA.id, studentNo: '20260109', name: '叶嘉树', gender: '男' },
    { id: 18n, classId: classroomA.id, studentNo: '20260110', name: '顾星野', gender: '男' },
    { id: 19n, classId: classroomA.id, studentNo: '20260111', name: '沈沐阳', gender: '男' },
    { id: 20n, classId: classroomA.id, studentNo: '20260112', name: '陆清欢', gender: '女' },
    { id: 21n, classId: classroomA.id, studentNo: '20260113', name: '程亦辰', gender: '男' },
    { id: 22n, classId: classroomA.id, studentNo: '20260114', name: '苏念一', gender: '女' },
    { id: 23n, classId: classroomA.id, studentNo: '20260115', name: '姜云舒', gender: '女' },
    { id: 24n, classId: classroomA.id, studentNo: '20260116', name: '夏予航', gender: '男' },
    { id: 25n, classId: classroomA.id, studentNo: '20260117', name: '傅明澈', gender: '男' },
    { id: 26n, classId: classroomA.id, studentNo: '20260118', name: '白若宁', gender: '女' },
    { id: 27n, classId: classroomA.id, studentNo: '20260119', name: '乔安然', gender: '女' },
    { id: 28n, classId: classroomA.id, studentNo: '20260120', name: '谭景行', gender: '男' },
    { id: 29n, classId: classroomA.id, studentNo: '20260121', name: '魏子衿', gender: '女' },
    { id: 30n, classId: classroomA.id, studentNo: '20260122', name: '盛南栀', gender: '女' },
    { id: 5n, classId: classroomB.id, studentNo: '20260205', name: '林星河', gender: '男' },
    { id: 6n, classId: classroomB.id, studentNo: '20260206', name: '许知夏', gender: '女' },
    { id: 7n, classId: classroomB.id, studentNo: '20260207', name: '沈月白', gender: '男' },
    { id: 8n, classId: classroomB.id, studentNo: '20260208', name: '顾言希', gender: '女' },
    { id: 9n, classId: classroomC.id, studentNo: '20260201', name: '周若晨', gender: '男' },
    { id: 10n, classId: classroomC.id, studentNo: '20260202', name: '陆景明', gender: '男' },
    { id: 11n, classId: classroomC.id, studentNo: '20260203', name: '唐可可', gender: '女' },
    { id: 12n, classId: classroomC.id, studentNo: '20260204', name: '宋嘉禾', gender: '女' },
  ] as const;

  for (const row of students) {
    await prisma.student.upsert({
      where: { id: row.id },
      update: {
        schoolId: school.id,
        classId: row.classId,
        studentNo: row.studentNo,
        name: row.name,
        gender: row.gender,
        avatarUrl: `/assets/avatars/mock-${row.studentNo}.png`,
        joinedAt: daysAgo(80),
        status: 'enabled',
      },
      create: {
        id: row.id,
        schoolId: school.id,
        classId: row.classId,
        studentNo: row.studentNo,
        name: row.name,
        gender: row.gender,
        avatarUrl: `/assets/avatars/mock-${row.studentNo}.png`,
        joinedAt: daysAgo(80),
        status: 'enabled',
      },
    });

    await prisma.studentProfile.upsert({
      where: { studentId: row.id },
      update: { classId: row.classId },
      create: { studentId: row.id, classId: row.classId },
    });
  }

  const groups = [
    { id: 1n, classId: classroomA.id, groupNo: 1, name: '启明星组' },
    { id: 2n, classId: classroomA.id, groupNo: 2, name: '北斗星组' },
    { id: 7n, classId: classroomA.id, groupNo: 3, name: '追光组' },
    { id: 8n, classId: classroomA.id, groupNo: 4, name: '凌云组' },
    { id: 3n, classId: classroomB.id, groupNo: 1, name: '晨曦组' },
    { id: 4n, classId: classroomB.id, groupNo: 2, name: '远航组' },
    { id: 5n, classId: classroomC.id, groupNo: 1, name: '星辰组' },
    { id: 6n, classId: classroomC.id, groupNo: 2, name: '云帆组' },
  ] as const;
  for (const row of groups) {
    await prisma.classGroup.upsert({ where: { id: row.id }, update: { ...row, status: 'enabled' }, create: { ...row, status: 'enabled' } });
  }

  const groupMap = new Map<bigint, bigint>([
    [1n, 1n], [2n, 1n], [3n, 2n], [4n, 2n],
    [13n, 1n], [14n, 1n], [15n, 1n], [16n, 1n],
    [17n, 2n], [18n, 2n], [19n, 2n], [20n, 2n],
    [21n, 7n], [22n, 7n], [23n, 7n], [24n, 7n],
    [25n, 8n], [26n, 8n], [27n, 8n], [28n, 8n], [29n, 8n], [30n, 8n],
    [5n, 3n], [6n, 3n], [7n, 4n], [8n, 4n],
    [9n, 5n], [10n, 5n], [11n, 6n], [12n, 6n],
  ]);
  for (const [studentId, classGroupId] of groupMap.entries()) {
    await prisma.studentGroupRel.upsert({ where: { studentId }, update: { classGroupId }, create: { studentId, classGroupId } });
  }

  const pets = await prisma.pet.findMany({ where: { schoolId: school.id, status: 'enabled' }, orderBy: { id: 'asc' }, take: 20, select: { id: true } });
  const petStages = await prisma.petStage.findMany({
    where: { petId: { in: pets.map((p) => p.id) } },
    orderBy: [{ petId: 'asc' }, { stageNo: 'asc' }],
    select: { id: true, petId: true, stageNo: true, levelNo: true, needScoreTotal: true },
  });
  const stageMap = new Map<bigint, Array<{ stageNo: number; levelNo: number; needScoreTotal: number }>>();
  for (const s of petStages) {
    const list = stageMap.get(s.petId) ?? [];
    list.push({ stageNo: s.stageNo, levelNo: s.levelNo, needScoreTotal: s.needScoreTotal });
    stageMap.set(s.petId, list);
  }

  for (let i = 0; i < students.length; i += 1) {
    const student = students[i];
    const pet = pets[i % pets.length];
    const stages = stageMap.get(pet.id) ?? [{ stageNo: 1, levelNo: 1, needScoreTotal: 0 }];
    const level = 1 + (i % 8);
    const stage = stages.reduce((acc, cur) => (cur.levelNo <= level ? cur : acc), stages[0]);

    await prisma.studentPet.upsert({
      where: { studentId: student.id },
      update: {
        petId: pet.id,
        currentLevel: level,
        currentStageNo: stage.stageNo,
        totalScore: stage.needScoreTotal + (i % 3) * 12,
        unlockedAt: daysAgo(65),
        adoptedBy: teacherDemo.id,
        status: 'enabled',
      },
      create: {
        studentId: student.id,
        petId: pet.id,
        currentLevel: level,
        currentStageNo: stage.stageNo,
        totalScore: stage.needScoreTotal + (i % 3) * 12,
        unlockedAt: daysAgo(65),
        adoptedBy: teacherDemo.id,
        status: 'enabled',
      },
    });
  }

  const positiveRules = (await prisma.scoreRule.findMany({
    where: { schoolId: school.id, semesterId: semester.id, status: 'enabled', scoreType: 'add' },
    orderBy: { id: 'asc' },
    take: 200,
    select: { id: true, subjectCode: true, sceneCode: true, dimension: true, tag: true, sentiment: true, scoreType: true, scoreValue: true },
  })) as RuleLite[];
  const negativeRules = (await prisma.scoreRule.findMany({
    where: { schoolId: school.id, semesterId: semester.id, status: 'enabled', scoreType: 'deduct' },
    orderBy: { id: 'asc' },
    take: 200,
    select: { id: true, subjectCode: true, sceneCode: true, dimension: true, tag: true, sentiment: true, scoreType: true, scoreValue: true },
  })) as RuleLite[];

  if (positiveRules.length === 0 || negativeRules.length === 0) {
    throw new Error('缺少积分规则数据，请先执行默认初始化');
  }

  const sortSubjectCode = (a: string | null, b: string | null) => (a ?? '__general__').localeCompare(b ?? '__general__');
  const positiveBySubject = new Map<string | null, RuleLite[]>();
  const negativeBySubject = new Map<string | null, RuleLite[]>();
  for (const rule of positiveRules) {
    const list = positiveBySubject.get(rule.subjectCode) ?? [];
    list.push(rule);
    positiveBySubject.set(rule.subjectCode, list);
  }
  for (const rule of negativeRules) {
    const list = negativeBySubject.get(rule.subjectCode) ?? [];
    list.push(rule);
    negativeBySubject.set(rule.subjectCode, list);
  }
  const positiveSubjects = [...positiveBySubject.keys()].sort(sortSubjectCode);
  const negativeSubjects = [...negativeBySubject.keys()].sort(sortSubjectCode);

  const classTeacherMap = new Map<bigint, { id: bigint; name: string }>([
    [classroomA.id, { id: teacherDemo.id, name: teacherDemo.name }],
    [classroomB.id, { id: teacherDemoB.id, name: teacherDemoB.name }],
    [classroomC.id, { id: teacherDemoC.id, name: teacherDemoC.name }],
  ]);

  const mockScoreRecordIds: bigint[] = [];
  let scoreRecordId = 900001n;
  const classroomAStudents = students.filter((student) => student.classId === classroomA.id);
  for (let day = 1; day <= 35; day += 1) {
    for (let si = 0; si < students.length; si += 1) {
      const student = students[si];
      const classTeacher = classTeacherMap.get(student.classId)!;
      const groupId = groupMap.get(student.id) ?? null;
      const usePositive = (day + si) % 4 !== 0;
      const subjects = usePositive ? positiveSubjects : negativeSubjects;
      const subjectKey = subjects[(day + si) % subjects.length];
      const rulesForSubject = (usePositive ? positiveBySubject : negativeBySubject).get(subjectKey) ?? [];
      const rule = rulesForSubject[(day * 3 + si) % rulesForSubject.length];
      const scoreDelta = rule.scoreType === 'add' ? rule.scoreValue : -Math.abs(rule.scoreValue);
      const occurredAt = daysAgo(day, 8 + (si % 8));

      await prisma.scoreRecord.upsert({
        where: { id: scoreRecordId },
        update: {
          schoolId: school.id,
          semesterId: semester.id,
          classId: student.classId,
          studentId: student.id,
          classGroupId: groupId,
          ruleId: rule.id,
          subjectCode: rule.subjectCode,
          sceneCode: rule.sceneCode,
          dimension: rule.dimension,
          tag: rule.tag,
          sentiment: rule.sentiment,
          scoreDelta,
          remark: usePositive ? '课堂/作业表现良好' : '课堂纪律待改进',
          sourceTerminal: TerminalType.admin,
          sourceRole: usePositive ? 'homeroom_teacher' : 'subject_teacher',
          operatorId: usePositive ? classTeacher.id : subjectDemo.id,
          operatorName: usePositive ? classTeacher.name : subjectDemo.name,
          createdAt: occurredAt,
          occurredAt,
        },
        create: {
          id: scoreRecordId,
          schoolId: school.id,
          semesterId: semester.id,
          classId: student.classId,
          studentId: student.id,
          classGroupId: groupId,
          ruleId: rule.id,
          subjectCode: rule.subjectCode,
          sceneCode: rule.sceneCode,
          dimension: rule.dimension,
          tag: rule.tag,
          sentiment: rule.sentiment,
          scoreDelta,
          remark: usePositive ? '课堂/作业表现良好' : '课堂纪律待改进',
          sourceTerminal: TerminalType.admin,
          sourceRole: usePositive ? 'homeroom_teacher' : 'subject_teacher',
          operatorId: usePositive ? classTeacher.id : subjectDemo.id,
          operatorName: usePositive ? classTeacher.name : subjectDemo.name,
          createdAt: occurredAt,
          occurredAt,
        },
      });

      mockScoreRecordIds.push(scoreRecordId);
      scoreRecordId += 1n;
    }

    for (let offset = 0; offset < 10; offset += 1) {
      const si = (day * 3 + offset * 5) % classroomAStudents.length;
      const student = classroomAStudents[si];
      const classTeacher = classTeacherMap.get(student.classId)!;
      const groupId = groupMap.get(student.id) ?? null;
      const subjectKey = positiveSubjects[(day + offset) % positiveSubjects.length];
      const rulesForSubject = positiveBySubject.get(subjectKey) ?? [];
      const rule = rulesForSubject[(day * 5 + offset) % rulesForSubject.length];
      const scoreDelta = Math.max(1, rule.scoreValue + ((day + offset) % 3));
      const occurredAt = daysAgo(day, 10 + (offset % 7));

      await prisma.scoreRecord.upsert({
        where: { id: scoreRecordId },
        update: {
          schoolId: school.id,
          semesterId: semester.id,
          classId: student.classId,
          studentId: student.id,
          classGroupId: groupId,
          ruleId: rule.id,
          subjectCode: rule.subjectCode,
          sceneCode: rule.sceneCode,
          dimension: rule.dimension,
          tag: rule.tag,
          sentiment: rule.sentiment,
          scoreDelta,
          remark: '61班追赶加速记录',
          sourceTerminal: TerminalType.admin,
          sourceRole: 'homeroom_teacher',
          operatorId: classTeacher.id,
          operatorName: classTeacher.name,
          createdAt: occurredAt,
          occurredAt,
        },
        create: {
          id: scoreRecordId,
          schoolId: school.id,
          semesterId: semester.id,
          classId: student.classId,
          studentId: student.id,
          classGroupId: groupId,
          ruleId: rule.id,
          subjectCode: rule.subjectCode,
          sceneCode: rule.sceneCode,
          dimension: rule.dimension,
          tag: rule.tag,
          sentiment: rule.sentiment,
          scoreDelta,
          remark: '61班追赶加速记录',
          sourceTerminal: TerminalType.admin,
          sourceRole: 'homeroom_teacher',
          operatorId: classTeacher.id,
          operatorName: classTeacher.name,
          createdAt: occurredAt,
          occurredAt,
        },
      });

      mockScoreRecordIds.push(scoreRecordId);
      scoreRecordId += 1n;
    }
  }

  const rewards = await prisma.reward.findMany({ where: { schoolId: school.id, status: 'enabled' }, orderBy: { id: 'asc' }, take: 6 });
  let rewardOrderId = 920001n;
  const rewardOrdersPerStudent = [0, 1, 2, 3, 4, 6, 8, 9, 10];
  for (let i = 0; i < rewardOrdersPerStudent.length; i += 1) {
    const sid = BigInt(rewardOrdersPerStudent[i]);
    const student = students.find((s) => s.id === sid + 1n)!;
    const reward = rewards[i % rewards.length];
    const classTeacher = classTeacherMap.get(student.classId)!;
    await prisma.rewardOrder.upsert({
      where: { id: rewardOrderId },
      update: {
        schoolId: school.id,
        classId: student.classId,
        studentId: student.id,
        rewardId: reward.id,
        scoreCost: reward.scoreCost,
        status: 'received',
        sourceTerminal: TerminalType.display,
        operatorId: classTeacher.id,
        operatorRole: 'homeroom_teacher',
        createdAt: daysAgo(3 + i, 15),
      },
      create: {
        id: rewardOrderId,
        schoolId: school.id,
        classId: student.classId,
        studentId: student.id,
        rewardId: reward.id,
        scoreCost: reward.scoreCost,
        status: 'received',
        sourceTerminal: TerminalType.display,
        operatorId: classTeacher.id,
        operatorRole: 'homeroom_teacher',
        createdAt: daysAgo(3 + i, 15),
      },
    });
    rewardOrderId += 1n;
  }

  const honors = await prisma.honor.findMany({ where: { schoolId: school.id, status: 'enabled' }, orderBy: { id: 'asc' } });
  let honorRecordId = 930001n;
  for (let i = 0; i < 12; i += 1) {
    const student = students[i];
    const classTeacher = classTeacherMap.get(student.classId)!;
    const honor = honors[i % honors.length];
    await prisma.honorRecord.upsert({
      where: { id: honorRecordId },
      update: {
        honorId: honor.id,
        targetType: 'student',
        targetId: student.id,
        schoolId: school.id,
        classId: student.classId,
        studentId: student.id,
        grantedBy: classTeacher.id,
        grantedAt: daysAgo(18 - (i % 7), 10),
        remark: '阶段评优授予',
      },
      create: {
        id: honorRecordId,
        honorId: honor.id,
        targetType: 'student',
        targetId: student.id,
        schoolId: school.id,
        classId: student.classId,
        studentId: student.id,
        grantedBy: classTeacher.id,
        grantedAt: daysAgo(18 - (i % 7), 10),
        remark: '阶段评优授予',
      },
    });
    honorRecordId += 1n;
  }

  let observationId = 940001n;
  const observationTypes = ['daily', 'study', 'behavior'];
  for (let i = 0; i < students.length; i += 1) {
    const student = students[i];
    const classTeacher = classTeacherMap.get(student.classId)!;
    for (let j = 0; j < 3; j += 1) {
      await prisma.teacherObservation.upsert({
        where: { id: observationId },
        update: {
          schoolId: school.id,
          classId: student.classId,
          studentId: student.id,
          teacherId: classTeacher.id,
          observationType: observationTypes[j],
          content: `观察记录${j + 1}：${student.name}在${observationTypes[j]}维度表现${j === 2 ? '需关注' : '良好'}。`,
          createdAt: daysAgo(10 + i + j, 16),
        },
        create: {
          id: observationId,
          schoolId: school.id,
          classId: student.classId,
          studentId: student.id,
          teacherId: classTeacher.id,
          observationType: observationTypes[j],
          content: `观察记录${j + 1}：${student.name}在${observationTypes[j]}维度表现${j === 2 ? '需关注' : '良好'}。`,
          createdAt: daysAgo(10 + i + j, 16),
        },
      });
      observationId += 1n;
    }
  }

  let snapshotId = 950001n;
  for (const student of students) {
    for (const periodType of ['weekly', 'monthly'] as const) {
      await prisma.aiStudentSnapshot.upsert({
        where: { id: snapshotId },
        update: {
          schoolId: school.id,
          semesterId: semester.id,
          classId: student.classId,
          studentId: student.id,
          snapshotDate: daysAgo(periodType === 'weekly' ? 2 : 15),
          periodType,
          positiveSummary: { count: periodType === 'weekly' ? 6 : 20, scoreDelta: periodType === 'weekly' ? 18 : 63 },
          negativeSummary: { count: periodType === 'weekly' ? 2 : 7, scoreDelta: periodType === 'weekly' ? -4 : -16 },
          dimensionSummary: { classroom: 32, homework: 21, behavior: 10, reading: 8 },
          trendSummary: { trend: 'up', confidence: 0.82 },
          aiSummary: `${student.name}${periodType === 'weekly' ? '本周' : '本月'}学习状态整体向上，课堂专注与作业达成较稳定。`,
          aiSuggestion: '建议继续强化课堂发言与阅读任务，减少课间纪律波动。',
          generatedBy: 'manual',
          createdAt: daysAgo(1),
        },
        create: {
          id: snapshotId,
          schoolId: school.id,
          semesterId: semester.id,
          classId: student.classId,
          studentId: student.id,
          snapshotDate: daysAgo(periodType === 'weekly' ? 2 : 15),
          periodType,
          positiveSummary: { count: periodType === 'weekly' ? 6 : 20, scoreDelta: periodType === 'weekly' ? 18 : 63 },
          negativeSummary: { count: periodType === 'weekly' ? 2 : 7, scoreDelta: periodType === 'weekly' ? -4 : -16 },
          dimensionSummary: { classroom: 32, homework: 21, behavior: 10, reading: 8 },
          trendSummary: { trend: 'up', confidence: 0.82 },
          aiSummary: `${student.name}${periodType === 'weekly' ? '本周' : '本月'}学习状态整体向上，课堂专注与作业达成较稳定。`,
          aiSuggestion: '建议继续强化课堂发言与阅读任务，减少课间纪律波动。',
          generatedBy: 'manual',
          createdAt: daysAgo(1),
        },
      });
      snapshotId += 1n;
    }
  }

  const terminals = [
    { id: 960001n, classId: classroomA.id, terminalCode: 'display-web-demo', terminalName: '育英星宠终端-A-demo' },
    { id: 960002n, classId: classroomB.id, terminalCode: 'display-init-demo', terminalName: '育英星宠终端-B-demo' },
    { id: 960003n, classId: classroomC.id, terminalCode: 'display-hall-demo', terminalName: '育英星宠终端-C-demo' },
  ] as const;
  for (const terminal of terminals) {
    await prisma.displayTerminal.upsert({
      where: { terminalCode: terminal.terminalCode },
      update: {
        schoolId: school.id,
        classId: terminal.classId,
        terminalName: terminal.terminalName,
        initializedBy: superAdminDemo.id,
        initializedAt: daysAgo(15),
        lastBoundAt: daysAgo(5),
        lastOnlineAt: daysAgo(0),
        status: 'enabled',
      },
      create: {
        id: terminal.id,
        schoolId: school.id,
        classId: terminal.classId,
        terminalCode: terminal.terminalCode,
        terminalName: terminal.terminalName,
        initializedBy: superAdminDemo.id,
        initializedAt: daysAgo(15),
        lastBoundAt: daysAgo(5),
        lastOnlineAt: daysAgo(0),
        status: 'enabled',
      },
    });
  }

  await prisma.displayConfig.upsert({
    where: { id: 2n },
    update: { schoolId: school.id, classId: classroomA.id, title: '育英星宠', subtitle: '欢迎进入61班', defaultMode: 'class-home' },
    create: { id: 2n, schoolId: school.id, classId: classroomA.id, title: '育英星宠', subtitle: '欢迎进入61班', defaultMode: 'class-home' },
  });
  await prisma.displayConfig.upsert({
    where: { id: 3n },
    update: { schoolId: school.id, classId: classroomB.id, title: '育英星宠', subtitle: '欢迎进入八(1)班', defaultMode: 'class-home' },
    create: { id: 3n, schoolId: school.id, classId: classroomB.id, title: '育英星宠', subtitle: '欢迎进入八(1)班', defaultMode: 'class-home' },
  });
  await prisma.displayConfig.upsert({
    where: { id: 4n },
    update: { schoolId: school.id, classId: classroomC.id, title: '育英星宠', subtitle: '欢迎进入九(1)班', defaultMode: 'class-home' },
    create: { id: 4n, schoolId: school.id, classId: classroomC.id, title: '育英星宠', subtitle: '欢迎进入九(1)班', defaultMode: 'class-home' },
  });

  const profileRows = await prisma.scoreRecord.groupBy({
    by: ['studentId', 'classId'],
    where: { id: { in: mockScoreRecordIds } },
    _sum: { scoreDelta: true },
    _count: { id: true },
  });

  for (const row of profileRows) {
    const studentId = row.studentId;
    const classId = row.classId;
    const currentScore = row._sum.scoreDelta ?? 0;
    const positiveCount = await prisma.scoreRecord.count({ where: { studentId, sentiment: 'positive', id: { in: mockScoreRecordIds } } });
    const negativeCount = await prisma.scoreRecord.count({ where: { studentId, sentiment: 'negative', id: { in: mockScoreRecordIds } } });
    const honorsCount = await prisma.honorRecord.count({ where: { studentId } });
    const rewardsCount = await prisma.rewardOrder.count({ where: { studentId, status: 'received' } });
    const studentPet = await prisma.studentPet.findUnique({ where: { studentId }, select: { currentLevel: true } });

    await prisma.studentProfile.upsert({
      where: { studentId },
      update: {
        classId,
        currentScore,
        totalScore: currentScore,
        currentPetLevel: studentPet?.currentLevel ?? 1,
        honorsCount,
        rewardsCount,
        positiveCount7d: positiveCount,
        negativeCount7d: negativeCount,
        medalsCount: honorsCount,
        lastScoreAt: daysAgo(0),
      },
      create: {
        studentId,
        classId,
        currentScore,
        totalScore: currentScore,
        currentPetLevel: studentPet?.currentLevel ?? 1,
        honorsCount,
        rewardsCount,
        positiveCount7d: positiveCount,
        negativeCount7d: negativeCount,
        medalsCount: honorsCount,
        lastScoreAt: daysAgo(0),
      },
    });
  }
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
