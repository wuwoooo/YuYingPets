const fs = require('node:fs');
const path = require('node:path');
const XLSX = require('xlsx');

const LEGACY_SHEET_CONFIG = {
  教务: { moduleType: 'general', subjectCode: null, sheetCode: 'GENERAL' },
  语文组: { moduleType: 'subject', subjectCode: 'chinese', sheetCode: 'CHINESE' },
  数学组: { moduleType: 'subject', subjectCode: 'math', sheetCode: 'MATH' },
  英语组: { moduleType: 'subject', subjectCode: 'english', sheetCode: 'ENGLISH' },
  物理组: { moduleType: 'subject', subjectCode: 'physics', sheetCode: 'PHYSICS' },
  化学组: { moduleType: 'subject', subjectCode: 'chemistry', sheetCode: 'CHEMISTRY' },
  地理组: { moduleType: 'subject', subjectCode: 'geography', sheetCode: 'GEOGRAPHY' },
  生物组: { moduleType: 'subject', subjectCode: 'biology', sheetCode: 'BIOLOGY' },
  历史组: { moduleType: 'subject', subjectCode: 'history', sheetCode: 'HISTORY' },
  政治组: { moduleType: 'subject', subjectCode: 'politics', sheetCode: 'POLITICS' },
  音美信综合组: { moduleType: 'subject', subjectCode: 'arts_it', sheetCode: 'ARTS_IT' },
  体育组: { moduleType: 'subject', subjectCode: 'pe', sheetCode: 'PE' },
};

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    throw new Error(`缺少参数 ${flag}`);
  }
  return process.argv[index + 1];
}

function normalizeScoreText(raw) {
  const text = String(raw ?? '').trim();
  return text
    .replace(/\s+/g, '')
    .replace(/＋/g, '+')
    .replace(/－|—|–|~/g, '-')
    .replace(/分/g, '');
}

function parseScore(raw) {
  const text = normalizeScoreText(raw);
  if (!text) throw new Error('empty score');
  if (/^[+-]?\d+$/.test(text)) {
    const value = Number(text);
    return { scoreType: value >= 0 ? 'add' : 'deduct', values: [Math.abs(value)], sourceText: text };
  }

  for (const [pattern, scoreType] of [
    [/^\+?(\d+)-\+?(\d+)$/, 'add'],
    [/^加(\d+)-(\d+)$/, 'add'],
    [/^扣(\d+)-(\d+)$/, 'deduct'],
    [/^-(\d+)-(\d+)$/, 'deduct'],
  ]) {
    const match = text.match(pattern);
    if (match) {
      const low = Number(match[1]);
      const high = Number(match[2]);
      const values = [];
      for (let i = Math.min(low, high); i <= Math.max(low, high); i += 1) values.push(i);
      return { scoreType, values, sourceText: text };
    }
  }

  for (const [pattern, scoreType] of [
    [/^加(\d+)$/, 'add'],
    [/^扣(\d+)$/, 'deduct'],
  ]) {
    const match = text.match(pattern);
    if (match) {
      return { scoreType, values: [Number(match[1])], sourceText: text };
    }
  }

  throw new Error(`unsupported score text: ${text}`);
}

function inferSceneCode(text) {
  const keywordMap = [
    ['迟到', 'attendance'],
    ['早退', 'attendance'],
    ['旷课', 'attendance'],
    ['竞赛', 'competition'],
    ['比赛', 'competition'],
    ['早读', 'reading'],
    ['背诵', 'recitation'],
    ['背书', 'recitation'],
    ['读单词', 'reading'],
    ['读课本', 'reading'],
    ['听默写', 'dictation'],
    ['听写', 'dictation'],
    ['默写', 'dictation'],
    ['周测', 'exam'],
    ['月评价', 'exam'],
    ['期末', 'exam'],
    ['考试', 'exam'],
    ['测验', 'exam'],
    ['作业', 'homework'],
    ['改错', 'homework'],
    ['课堂', 'classroom'],
    ['上课', 'classroom'],
    ['学风', 'classroom'],
    ['自习', 'self_study'],
    ['展讲', 'presentation'],
    ['答疑', 'qa'],
    ['问问题', 'qa'],
    ['器材', 'equipment'],
    ['设备', 'equipment'],
    ['机房', 'equipment'],
    ['画室', 'equipment'],
    ['音乐厅', 'equipment'],
    ['小组', 'group'],
    ['合作', 'group'],
    ['活动', 'activity'],
    ['展示', 'activity'],
    ['升旗', 'activity'],
    ['早操', 'activity'],
    ['课间操', 'activity'],
    ['团队会', 'activity'],
    ['文化', 'activity'],
    ['宿舍', 'behavior'],
    ['礼仪', 'behavior'],
    ['卫生', 'behavior'],
    ['整理', 'behavior'],
    ['收纳', 'behavior'],
    ['坐姿', 'behavior'],
    ['纪律', 'discipline'],
  ];
  for (const [keyword, sceneCode] of keywordMap) {
    if (text.includes(keyword)) return sceneCode;
  }
  return 'classroom';
}

function inferDimensionAndTag(text, sentiment) {
  const mapping = [
    [['迟到', '早退', '旷课'], ['出勤管理', '时间纪律']],
    [['作业', '改错'], ['作业管理', '任务完成']],
    [['周测', '月评价', '考试', '测验', '考核'], ['学业成绩', '测评表现']],
    [['竞赛', '比赛', '活动', '展示', '作品'], ['学科活动', '活动参与']],
    [['早读', '背诵', '背书', '听默写', '听写', '默写'], ['背诵与早读', '语言积累']],
    [['纪律', '违纪', '打闹', '喧哗', '顶撞'], ['课堂纪律', '自我管理']],
    [['器材', '设备', '机房', '画室', '音乐厅'], ['场室与器材', '规范使用']],
    [['小组', '合作', '互助'], ['合作表现', '协作互助']],
    [['坐姿', '桌面', '收纳', '工具单'], ['行为规范', '习惯养成']],
    [['答疑', '问问题', '讲解', '回答问题'], ['课堂学习', '互动表达']],
    [['礼仪', '仪容', '红领巾'], ['文明礼仪', '形象规范']],
    [['卫生', '垃圾', '整洁'], ['劳动实践', '卫生维护']],
    [['班委', '委员', '总裁团'], ['班级建设', '岗位履责']],
    [['就餐', '光盘', '粮食'], ['文明礼仪', '用餐规范']],
  ];
  for (const [keywords, result] of mapping) {
    if (keywords.some((keyword) => text.includes(keyword))) return result;
  }
  return sentiment === 'negative' ? ['课堂管理', '负向行为'] : ['课堂学习', '综合表现'];
}

function isHighFrequency(text) {
  return ['课堂', '作业', '早读', '迟到', '违纪', '背诵', '听写', '默写', '周测', '收纳', '坐姿', '纪律', '仪容', '卫生', '就餐', '升旗', '早操', '课间操']
    .some((keyword) => text.includes(keyword));
}

function shouldDisplay(text, scoreValue, scoreType, scoreTarget) {
  if (scoreTarget === 'class') return false;
  if (['作弊', '顶撞', '损坏', '伪造', '抄袭'].some((keyword) => text.includes(keyword))) return false;
  if (scoreType === 'deduct' && scoreValue >= 5) return false;
  return true;
}

function buildRow({
  moduleType,
  subjectCode,
  sceneCode,
  code,
  name,
  scoreType,
  scoreTarget,
  scoreValue,
  sourceDesc,
  allowedRoleCodes = [],
}) {
  const sentiment = scoreType === 'add' ? 'positive' : 'negative';
  const [dimension, tag] = inferDimensionAndTag(name, sentiment);
  return {
    module_type: moduleType,
    subject_code: subjectCode,
    scene_code: sceneCode,
    code,
    name,
    score_type: scoreType,
    score_target: scoreTarget,
    score_value: scoreValue,
    dimension,
    tag,
    sentiment,
    ai_summary_text: `${dimension} / ${tag} / ${sentiment === 'positive' ? '正向' : '负向'}`,
    description: sourceDesc,
    allowed_role_codes: allowedRoleCodes,
    is_high_frequency: isHighFrequency(name) ? 1 : 0,
    display_enabled: shouldDisplay(name, scoreValue, scoreType, scoreTarget) ? 1 : 0,
    admin_enabled: 1,
  };
}

function cleanLegacyRow(sheetName, ruleName, rawScore, description) {
  let cleanedName = String(ruleName).trim().replace(/\n|\r/g, '');
  let cleanedScore = rawScore;
  if (sheetName === '教务' && cleanedName === '学生工具单收纳混乱') cleanedScore = -2;
  if (sheetName === '化学组' && cleanedName === '化学周测退步' && String(description).includes('进步')) cleanedName = '化学周测进步';
  if (sheetName === '地理组' && cleanedName === '回答问题有独立的生物思维') cleanedName = '回答问题有独立的地理思维';
  if (sheetName === '生物组' && cleanedName === '回答问题有独立的地理思维') cleanedName = '回答问题有独立的生物思维';
  if (cleanedName === '不合格不该错') cleanedName = '不合格不改错';
  return [cleanedName, cleanedScore, String(description ?? '').trim()];
}

function readWorkbookRows(workbookPath) {
  const workbook = XLSX.readFile(workbookPath, { raw: false, cellText: true });
  return workbook.SheetNames.map((sheetName) => ({
    sheetName,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' }),
  }));
}

function signedLabel(scoreType, scoreValue) {
  return `${scoreType === 'add' ? '+' : '-'}${scoreValue}分`;
}

function buildRowsFromLegacyWorkbook(workbookPath) {
  const generatedRows = [];
  for (const { sheetName, rows } of readWorkbookRows(workbookPath)) {
    const config = LEGACY_SHEET_CONFIG[sheetName];
    if (!config) continue;
    for (let rowIndex = 2; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex] || [];
      const sourceIndex = row[0];
      const ruleName = String(row[1] ?? '').trim();
      const rawScore = row[2];
      const description = String(row[3] ?? '').trim();
      if (!ruleName) continue;
      const [cleanName, cleanScore, cleanDescription] = cleanLegacyRow(sheetName, ruleName, rawScore, description);
      const parsed = parseScore(cleanScore);
      const sourceNo = String(sourceIndex ?? '').trim() ? Number(sourceIndex) || rowIndex - 1 : rowIndex - 1;
      for (const scoreValue of parsed.values) {
        const expandedName = parsed.values.length > 1 ? `${cleanName}（${signedLabel(parsed.scoreType, scoreValue)}）` : cleanName;
        const sourceDesc = cleanDescription
          ? `来源工作表：${sheetName}；原始分值：${parsed.sourceText}；说明：${cleanDescription}`
          : `来源工作表：${sheetName}；原始分值：${parsed.sourceText}`;
        generatedRows.push(buildRow({
          moduleType: config.moduleType,
          subjectCode: config.subjectCode,
          sceneCode: inferSceneCode(cleanName),
          code: `XLS_${config.sheetCode}_${String(sourceNo).padStart(3, '0')}_${String(scoreValue).padStart(2, '0')}_${parsed.scoreType.toUpperCase()}`,
          name: expandedName,
          scoreType: parsed.scoreType,
          scoreTarget: 'student',
          scoreValue,
          sourceDesc,
        }));
      }
    }
  }
  return generatedRows;
}

function buildRowsFromMoralWorkbook(workbookPath) {
  const generatedRows = [];
  const firstSheet = readWorkbookRows(workbookPath)[0];
  let currentScoreType = null;
  let sourceNo = 1;
  for (const row of firstSheet?.rows ?? []) {
    const cells = row.map((cell) => String(cell ?? '').trim());
    if (!cells.some(Boolean)) continue;
    const title = cells[0] ?? '';
    const scoreText = cells[1] ?? '';
    if (title === '加分项') {
      currentScoreType = 'add';
      continue;
    }
    if (title === '扣分项') {
      currentScoreType = 'deduct';
      continue;
    }
    if (title === '学生行为' || title === '行为' || scoreText === '分值') continue;
    if (!currentScoreType || !title || !scoreText) continue;
    const scoreValue = Number(scoreText);
    generatedRows.push(buildRow({
      moduleType: 'general',
      subjectCode: null,
      sceneCode: inferSceneCode(title),
      code: `MORAL_${String(sourceNo).padStart(3, '0')}_${String(scoreValue).padStart(2, '0')}_${currentScoreType.toUpperCase()}`,
      name: title,
      scoreType: currentScoreType,
      scoreTarget: 'student',
      scoreValue,
      sourceDesc: `来源工作簿：${path.basename(workbookPath)} / ${firstSheet.sheetName}`,
      allowedRoleCodes: [],
    }));
    sourceNo += 1;
  }
  return generatedRows;
}

function normalizeClassMetricName(rawName) {
  return String(rawName ?? '')
    .replace(/（好\/差）|\(好\/差\)|（好／差）|\(好／差\)/g, '')
    .trim();
}

function buildRowsFromClassWorkbook(workbookPath) {
  const generatedRows = [];
  const firstSheet = readWorkbookRows(workbookPath)[0];
  let sourceNo = 1;
  for (const row of (firstSheet?.rows ?? []).slice(1)) {
    const cells = row.map((cell) => String(cell ?? '').trim());
    if (!cells[0] || !cells[1]) continue;
    const metricName = normalizeClassMetricName(cells[0]);
    const sourceDesc = `来源工作簿：${path.basename(workbookPath)} / ${firstSheet.sheetName}；原始分值：${cells[1]}`;
    generatedRows.push(buildRow({
      moduleType: 'general',
      subjectCode: null,
      sceneCode: inferSceneCode(metricName),
      code: `CLASS_${String(sourceNo).padStart(3, '0')}_01_ADD`,
      name: `${metricName}优秀`,
      scoreType: 'add',
      scoreTarget: 'class',
      scoreValue: 1,
      sourceDesc,
    }));
    generatedRows.push(buildRow({
      moduleType: 'general',
      subjectCode: null,
      sceneCode: inferSceneCode(metricName),
      code: `CLASS_${String(sourceNo).padStart(3, '0')}_01_DEDUCT`,
      name: `${metricName}待改进`,
      scoreType: 'deduct',
      scoreTarget: 'class',
      scoreValue: 1,
      sourceDesc,
    }));
    sourceNo += 1;
  }
  return generatedRows;
}

function sqlQuote(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function renderSql(rows) {
  const valuesSql = rows.map((row) => {
    const subjectCode = row.subject_code == null ? 'NULL' : sqlQuote(row.subject_code);
    const allowedRoleCodes = row.allowed_role_codes.length > 0 ? sqlQuote(JSON.stringify(row.allowed_role_codes)) : 'NULL';
    return `(@school_id, @semester_id, ${sqlQuote(row.module_type)}, ${subjectCode}, ${sqlQuote(row.scene_code)}, ${sqlQuote(row.code)}, ${sqlQuote(row.name)}, ${sqlQuote(row.score_type)}, 'fixed', ${sqlQuote(row.score_target)}, ${row.score_value}, ${sqlQuote(row.dimension)}, ${sqlQuote(row.tag)}, ${sqlQuote(row.sentiment)}, ${sqlQuote(row.ai_summary_text)}, ${sqlQuote(row.description)}, ${allowedRoleCodes}, ${row.is_high_frequency}, ${row.display_enabled}, ${row.admin_enabled}, 'enabled', @operator_id, @operator_id, NOW(3), NOW(3))`;
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

DELETE FROM \`score_rule\`
WHERE \`school_id\` = @school_id
  AND \`semester_id\` = @semester_id
  AND (
    \`code\` LIKE 'DOC_%'
    OR \`code\` LIKE 'XLS_%'
    OR \`code\` LIKE 'MORAL_%'
    OR \`code\` LIKE 'CLASS_%'
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

function generateRows({ legacyInput, moralInput, classInput }) {
  const rows = [
    ...buildRowsFromLegacyWorkbook(legacyInput),
    ...buildRowsFromMoralWorkbook(moralInput),
    ...buildRowsFromClassWorkbook(classInput),
  ];
  const codeSet = new Set(rows.map((row) => row.code));
  if (codeSet.size !== rows.length) {
    throw new Error('generated duplicate rule codes');
  }
  return rows;
}

function main() {
  const legacyInput = getArg('--legacy-input');
  const moralInput = getArg('--moral-input');
  const classInput = getArg('--class-input');
  const output = getArg('--output');

  const rows = generateRows({ legacyInput, moralInput, classInput });

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, renderSql(rows), 'utf8');
  console.log(`generated_rows=${rows.length}`);
  console.log(`output=${output}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  generateRows,
  renderSql,
};
