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
      motto: '育英启智 星宠同行',
      status: 'enabled',
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
      name: '2026春季学期',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-07-15'),
      isCurrent: true,
      status: 'enabled',
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

  for (const [index, [code, name]] of roleCodes.entries()) {
    await prisma.role.upsert({
      where: { id: BigInt(index + 1) },
      update: {
        schoolId: school.id,
        code,
        name,
        isSystem: true,
      },
      create: {
        id: BigInt(index + 1),
        schoolId: school.id,
        code,
        name,
        isSystem: true,
      },
    });
  }

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      schoolId: school.id,
      roleId: 1n,
      passwordHash: hashSync('123456', 10),
      name: '系统管理员',
      status: 'enabled',
    },
    create: {
      schoolId: school.id,
      roleId: 1n,
      username: 'admin',
      passwordHash: hashSync('123456', 10),
      name: '系统管理员',
      status: 'enabled',
    },
  });

  await prisma.gradeConfig.deleteMany({ where: { schoolId: school.id } });
  await prisma.gradeConfig.createMany({
    data: [
      { schoolId: school.id, code: 'G7', name: '七年级', sortOrder: 1, status: 'enabled' },
      { schoolId: school.id, code: 'G8', name: '八年级', sortOrder: 2, status: 'enabled' },
      { schoolId: school.id, code: 'G9', name: '九年级', sortOrder: 3, status: 'enabled' },
    ],
  });

  await prisma.reward.deleteMany({ where: { schoolId: school.id } });
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

  await prisma.honor.deleteMany({ where: { schoolId: school.id } });
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

  await prisma.displayConfig.upsert({
    where: { id: 1n },
    update: {
      schoolId: school.id,
      classId: null,
      title: '育英星宠',
      subtitle: `欢迎进入${semester.name}`,
      defaultMode: 'school-home',
    },
    create: {
      id: 1n,
      schoolId: school.id,
      classId: null,
      title: '育英星宠',
      subtitle: `欢迎进入${semester.name}`,
      defaultMode: 'school-home',
    },
  });

  importPetCatalog();
  importScoreRulesFromXls();
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
