const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const { generateRows } = require('./generate-score-rule-sql-from-xls.cjs');

const backendRoot = path.resolve(__dirname, '..');
const generatorPath = path.resolve(__dirname, 'generate-score-rule-sql-from-xls.cjs');
const sqlPath = path.resolve(__dirname, '../sql/score_rule_full_from_xls.sql');
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
const legacyXlsPath = process.env.SCORE_RULES_LEGACY_XLS || path.resolve(backendRoot, '../doc/加扣分-教务模块（课堂、作业、学业）.xls');
const moralXlsxPath = process.env.SCORE_RULES_MORAL_XLSX || '/Users/wuwoo/Downloads/德育处学生管理加扣分类别.xlsx';
const classXlsxPath = process.env.SCORE_RULES_CLASS_XLSX || '/Users/wuwoo/Downloads/班级量化管理类别（班级评价）.xlsx';

function runOrThrow(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: backendRoot,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });

  if (result.status !== 0) {
    throw new Error(`命令执行失败: ${command} ${args.join(' ')}`);
  }
}

async function importRowsSafely() {
  const prisma = new PrismaClient();
  const rows = generateRows({
    legacyInput: legacyXlsPath,
    moralInput: moralXlsxPath,
    classInput: classXlsxPath,
  });

  try {
    const school = await prisma.school.findFirst({
      where: { code: 'YYXX' },
      orderBy: { id: 'asc' },
      select: { id: true },
    }) || await prisma.school.findFirst({ orderBy: { id: 'asc' }, select: { id: true } });
    if (!school) throw new Error('未找到 school 数据');

    const semester = await prisma.semester.findFirst({
      where: { schoolId: school.id, isCurrent: true },
      orderBy: { id: 'desc' },
      select: { id: true },
    }) || await prisma.semester.findFirst({
      where: { schoolId: school.id },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    if (!semester) throw new Error('未找到 semester 数据');

    const operator = await prisma.user.findFirst({
      where: { schoolId: school.id, username: 'superadmin_demo' },
      select: { id: true },
    }) || await prisma.user.findFirst({
      where: { schoolId: school.id, username: 'teacher_demo' },
      select: { id: true },
    }) || await prisma.user.findFirst({
      where: { schoolId: school.id },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (!operator) throw new Error('未找到 operator 用户');

    for (const row of rows) {
      const existing = await prisma.scoreRule.findFirst({
        where: {
          schoolId: school.id,
          semesterId: semester.id,
          code: row.code,
        },
        select: { id: true },
      });

      const data = {
        schoolId: school.id,
        semesterId: semester.id,
        moduleType: row.module_type,
        subjectCode: row.subject_code,
        sceneCode: row.scene_code,
        code: row.code,
        name: row.name,
        scoreType: row.score_type,
        scoreMode: 'fixed',
        scoreTarget: row.score_target,
        scoreValue: row.score_value,
        dimension: row.dimension,
        tag: row.tag,
        sentiment: row.sentiment,
        aiSummaryText: row.ai_summary_text,
        description: row.description,
        allowedRoleCodes: row.allowed_role_codes.length > 0 ? JSON.stringify(row.allowed_role_codes) : null,
        isHighFrequency: Boolean(row.is_high_frequency),
        displayEnabled: Boolean(row.display_enabled),
        adminEnabled: Boolean(row.admin_enabled),
        status: 'enabled',
        updatedBy: operator.id,
        deletedAt: null,
      };

      if (existing) {
        await prisma.scoreRule.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.scoreRule.create({
          data: {
            ...data,
            createdBy: operator.id,
          },
        });
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

function main() {
  const generateOnly = process.argv.includes('--generate-only');
  runOrThrow(
    process.execPath,
    [
      generatorPath,
      '--legacy-input',
      legacyXlsPath,
      '--moral-input',
      moralXlsxPath,
      '--class-input',
      classXlsxPath,
      '--output',
      sqlPath,
    ],
  );

  if (generateOnly) {
    return;
  }

  return importRowsSafely();
}

Promise.resolve(main()).catch((error) => {
  console.error(error);
  process.exit(1);
});
