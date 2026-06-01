const fs = require('node:fs');
const path = require('node:path');
const XLSX = require('xlsx');

// 匹配的 sheet 和推导的场景代码
const SHEET_CONFIG = {
  '课堂表现': { sceneCode: 'classroom', prefix: 'CLASS' },
  '作业': { sceneCode: 'homework', prefix: 'HW' },
  '周清和阶段评价': { sceneCode: 'exam', prefix: 'EXAM' },
  '竞赛 ': { sceneCode: 'competition', prefix: 'COMP' }, // 原表名包含空格
  '竞赛': { sceneCode: 'competition', prefix: 'COMP' }, // 兼容无空格
  '背诵及听默写': { sceneCode: 'dictation', prefix: 'DICT' },
};

function inferDimensionAndTag(text, sheetName, sentiment) {
  if (sheetName.includes('课堂')) {
    if (text.includes('讨论') || text.includes('展讲') || text.includes('讲解') || text.includes('回答')) return ['课堂学习', '互动表达'];
    if (text.includes('坐姿') || text.includes('桌面') || text.includes('收纳')) return ['行为规范', '习惯养成'];
    if (text.includes('纪律') || text.includes('迟到') || text.includes('旷课') || text.includes('顶撞') || text.includes('喧哗')) return ['课堂纪律', '自我管理'];
    return ['课堂学习', '综合表现'];
  }
  if (sheetName.includes('作业')) {
    if (text.includes('作文') || text.includes('练字') || text.includes('抄写')) return ['作业管理', '书写规范'];
    if (text.includes('提前完成') || text.includes('主动做题')) return ['作业管理', '自主学习'];
    return ['作业管理', '任务完成'];
  }
  if (sheetName.includes('周清')) {
    return ['学业成绩', '测评表现'];
  }
  if (sheetName.includes('竞赛')) {
    return ['学科活动', '活动参与'];
  }
  if (sheetName.includes('背诵')) {
    return ['背诵与早读', '语言积累'];
  }
  return sentiment === 'negative' ? ['教学管理', '负向行为'] : ['教学管理', '综合表现'];
}

function sqlQuote(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function buildRow(sheetName, ruleName, scoreValue, description, codeIndex) {
  const config = SHEET_CONFIG[sheetName] || SHEET_CONFIG[sheetName.trim()];
  if (!config) return null;

  const scoreType = scoreValue > 0 ? 'add' : 'deduct';
  const sentiment = scoreType === 'add' ? 'positive' : 'negative';
  const [dimension, tag] = inferDimensionAndTag(ruleName, sheetName, sentiment);
  const code = `NEW_${config.prefix}_${String(codeIndex).padStart(3, '0')}_${scoreType.toUpperCase()}`;

  return {
    module_type: 'general',
    subject_code: null,
    scene_code: config.sceneCode,
    code,
    name: ruleName,
    score_type: scoreType,
    score_target: 'student',
    score_value: Math.abs(scoreValue),
    dimension,
    tag,
    sentiment,
    ai_summary_text: `${dimension} / ${tag} / ${sentiment === 'positive' ? '正向' : '负向'}`,
    description: `来源工作表：${sheetName}；说明：${description}`,
    allowed_role_codes: [],
    is_high_frequency: 0,
    display_enabled: 1,
    admin_enabled: 1,
  };
}

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath, { raw: false, cellText: true });
  const rows = [];
  let globalIndex = 1;

  for (const sheetName of workbook.SheetNames) {
    const config = SHEET_CONFIG[sheetName] || SHEET_CONFIG[sheetName.trim()];
    if (!config) continue;

    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' });
    
    // 寻找表头（序号, 项目名称, 分值, 解释说明）
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, sheetData.length); i++) {
      if (sheetData[i] && sheetData[i].some(c => String(c).includes('项目名称'))) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) continue;

    for (let i = headerRowIndex + 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (!row || row.length < 3) continue;
      
      const rawName = String(row[1] || '').trim();
      const rawScore = Number(String(row[2] || '').replace(/分/g, '').trim());
      const rawDesc = String(row[3] || '').trim();

      if (!rawName || isNaN(rawScore)) continue;

      const rule = buildRow(sheetName, rawName, rawScore, rawDesc, globalIndex++);
      if (rule) rows.push(rule);
    }
  }
  return rows;
}

function renderSql(rows) {
  const valuesSql = rows.map((row) => {
    return `(@school_id, @semester_id, ${sqlQuote(row.module_type)}, NULL, ${sqlQuote(row.scene_code)}, ${sqlQuote(row.code)}, ${sqlQuote(row.name)}, ${sqlQuote(row.score_type)}, 'fixed', ${sqlQuote(row.score_target)}, ${row.score_value}, ${sqlQuote(row.dimension)}, ${sqlQuote(row.tag)}, ${sqlQuote(row.sentiment)}, ${sqlQuote(row.ai_summary_text)}, ${sqlQuote(row.description)}, NULL, ${row.is_high_frequency}, ${row.display_enabled}, ${row.admin_enabled}, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3))`;
  });

  return `SET NAMES utf8mb4;
START TRANSACTION;

SET @school_id = COALESCE(
  (SELECT \`id\` FROM \`school\` WHERE \`code\` = 'YYXX' ORDER BY \`id\` ASC LIMIT 1),
  (SELECT \`id\` FROM \`school\` ORDER BY \`id\` ASC LIMIT 1)
);

SET @semester_id = COALESCE(
  (SELECT \`id\` FROM \`semester\` WHERE \`school_id\` = @school_id AND \`is_current\` = 1 ORDER BY \`id\` DESC LIMIT 1),
  (SELECT \`id\` FROM \`semester\` WHERE \`school_id\` = @school_id ORDER BY \`id\` DESC LIMIT 1)
);

SET @operator_id = COALESCE(
  (SELECT \`id\` FROM \`user\` WHERE \`school_id\` = @school_id AND \`username\` = 'superadmin_demo' LIMIT 1),
  (SELECT \`id\` FROM \`user\` WHERE \`school_id\` = @school_id AND \`username\` = 'teacher_demo' LIMIT 1),
  (SELECT \`id\` FROM \`user\` WHERE \`school_id\` = @school_id ORDER BY \`id\` ASC LIMIT 1)
);

-- 软删除旧规则（仅废弃的 DOC_/XLS_ 导入规则，不影响 MORAL_ 学生管理与 CLASS_ 班级评价）
UPDATE \`score_rule\`
SET \`status\` = 'disabled', \`display_enabled\` = 0, \`admin_enabled\` = 0
WHERE \`school_id\` = @school_id
  AND \`semester_id\` = @semester_id
  AND (
    \`code\` LIKE 'DOC_%'
    OR \`code\` LIKE 'XLS_%'
  );

INSERT INTO \`score_rule\` (
  \`school_id\`,
  \`semester_id\`,
  \`module_type\`,
  \`subject_code\`,
  \`scene_code\`,
  \`code\`,
  \`name\`,
  \`score_type\`,
  \`score_mode\`,
  \`score_target\`,
  \`score_value\`,
  \`dimension\`,
  \`tag\`,
  \`sentiment\`,
  \`ai_summary_text\`,
  \`description\`,
  \`allowed_role_codes\`,
  \`is_high_frequency\`,
  \`display_enabled\`,
  \`admin_enabled\`,
  \`status\`,
  \`created_by\`,
  \`updated_by\`,
  \`created_at\`,
  \`updated_at\`
)
VALUES
  ${valuesSql.join(',\n  ')};

COMMIT;
`;
}

function main() {
  const xlsPath = '/Users/wuwoo/Downloads/海东育英教学模块加减分规则.xls';
  const outDir = '/Users/wuwoo/Desktop/work/_育英星宠/YuYingPets/backend/prisma/migrations/20260530000000_import_new_score_rules';
  const outPath = path.join(outDir, 'migration.sql');
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const rows = parseExcel(xlsPath);
  const sql = renderSql(rows);
  fs.writeFileSync(outPath, sql, 'utf8');
  
  console.log('Generated ' + rows.length + ' new score rules.');
  console.log('SQL file saved to: ' + outPath);
}

main();
