const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const sourceDir = path.resolve(backendRoot, 'public/assets/pets/400');
const highResDir = path.resolve(backendRoot, 'public/assets/pets/1024');
const outputPath = path.resolve(backendRoot, 'sql/pet_catalog_full.sql');
const PET_CODE_MIN = 51;
const PET_CODE_MAX = 85;

const STAGE_EXP_TOTALS = [0, 140, 240, 360, 500, 660, 840, 1040, 1260, 1500];
const STAR_PET_NAMES = [
  '星尘鸮', '星糖喵', '晨露鹿', '曜虎机', '月纱兔', '森歌獭', '樱铃猫', '泡泡狐', '潮汐獭', '烈焰牛', '玉麒团',
  '电波狸', '竹团貘', '糖霜鹿', '绒雪喵', '蜜桃狐', '钢牙鲨', '雷翼狼', '霓虹豚', '风暴柴', '岩角龙', '布丁兔', '云团熊',
];
const ZODIAC_PET_NAMES = [
  '子鼠宝', '丑牛宝', '寅虎宝', '卯兔宝', '辰龙宝', '巳蛇宝', '午马宝', '未羊宝', '申猴宝', '酉鸡宝', '戌狗宝', '亥猪宝',
];
const CATEGORY_LABELS = {
  star: '星宠',
  zodiac: '十二生肖',
  rabbit: '兔子系',
  dog: '犬类系',
  cat: '猫咪系',
  hamster: '仓鼠系',
  bird: '飞羽系',
  mythical: '神兽系',
  wild: '野性系',
  small_pet: '小宠系',
  other: '其他',
};

const CATEGORY_RULES = [
  { category: 'star', match: STAR_PET_NAMES },
  { category: 'zodiac', match: ZODIAC_PET_NAMES },
  { category: 'rabbit', match: ['兔'] },
  { category: 'dog', match: ['柯基', '边牧', '萨摩耶', '博美', '比熊', '金毛', '哈士奇', '拉布拉多', '柴犬', '泰迪', '非洲犬'] },
  { category: 'cat', match: ['猫', '金渐层', '银渐层', '布偶'] },
  { category: 'hamster', match: ['仓鼠', '金丝熊'] },
  { category: 'bird', match: ['金鹏', '神鹫', '海雕'] },
  { category: 'small_pet', match: ['刺猬', '蜜袋鼯', '松鼠', '荷兰猪', '龙猫'] },
  { category: 'mythical', match: ['梼杌', '穷奇', '火龙', '应龙', '白泽', '芬里尔'] },
  { category: 'wild', match: ['虎', '鬣狗', '雄狮', '雪豹', '美洲豹', '斑马', '棕熊'] },
];

const RARITY_RULES = [
  { rarity: 'legendary', match: ['梼杌', '穷奇', '火龙', '应龙', '白泽', '芬里尔'] },
  { rarity: 'epic', match: ['东北虎', '雪豹', '美洲豹', '非洲雄狮', '金鹏', '神鹫', '海雕', '棕熊'] },
  { rarity: 'rare', match: ['斑马', '鬣狗', '龙猫', '蜜袋鼯', '红腹松鼠'] },
];

function escapeSql(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function inferByRules(name, rules, fallback) {
  for (const rule of rules) {
    if (rule.match.some((keyword) => name.includes(keyword))) {
      return rule.category || rule.rarity;
    }
  }
  return fallback;
}

function buildDescription(name, category) {
  const label = CATEGORY_LABELS[category] || CATEGORY_LABELS.other;
  return `默认图鉴萌宠「${name}」，归属${label}，成长阶段素材来自资源库。`;
}

function parsePetAssets() {
  const pets = new Map();
  for (const filename of fs.readdirSync(sourceDir)) {
    const matched = filename.match(/^(\d{3})_(.+)_(\d+)\.([^.]+)$/);
    if (!matched) continue;
    const [, code, name, stageNoText] = matched;
    const codeNumber = Number(code);
    if (codeNumber < PET_CODE_MIN || codeNumber > PET_CODE_MAX) continue;
    const stageNo = Number(stageNoText);
    if (stageNo < 1 || stageNo > 10) continue;
    const current = pets.get(code) || { code, name, files: new Map() };
    current.files.set(stageNo, filename);
    pets.set(code, current);
  }
  return Array.from(pets.values()).sort((a, b) => a.code.localeCompare(b.code, 'en'));
}

function validatePets(pets) {
  const expectedCount = PET_CODE_MAX - PET_CODE_MIN + 1;
  if (pets.length !== expectedCount) {
    throw new Error(`萌宠数量不完整：期望 ${expectedCount} 只，实际 ${pets.length} 只`);
  }
  for (const pet of pets) {
    for (let stageNo = 1; stageNo <= 10; stageNo += 1) {
      if (!pet.files.has(stageNo)) {
        throw new Error(`萌宠 ${pet.code}_${pet.name} 缺少 Lv.${stageNo} 的 400 图`);
      }
      const filename = pet.files.get(stageNo);
      if (!fs.existsSync(path.resolve(highResDir, filename))) {
        throw new Error(`萌宠 ${pet.code}_${pet.name} 缺少 Lv.${stageNo} 的 1024 图`);
      }
    }
  }
}

function chooseStageFilename(files, stageNo) {
  return files.get(stageNo);
}

function buildSql(pets) {
  const lines = [];
  lines.push('-- 自动生成：默认萌宠图鉴及成长阶段');
  lines.push(`-- 源目录：${sourceDir}`);
  lines.push('-- 测试期策略：只导入 051-085 高清系统图鉴，清空学校现有萌宠测试数据');
  lines.push("SET @school_id = (SELECT id FROM `school` WHERE `code` = 'YYXX' LIMIT 1);");
  lines.push("SET @school_id = COALESCE(@school_id, (SELECT id FROM `school` ORDER BY `id` LIMIT 1));");
  lines.push('DELETE `pet_level_log` FROM `pet_level_log` INNER JOIN `student_pet` ON `pet_level_log`.`student_pet_id` = `student_pet`.`id` INNER JOIN `pet` ON `student_pet`.`pet_id` = `pet`.`id` WHERE `pet`.`school_id` = @school_id;');
  lines.push('DELETE `student_pet` FROM `student_pet` INNER JOIN `pet` ON `student_pet`.`pet_id` = `pet`.`id` WHERE `pet`.`school_id` = @school_id;');
  lines.push('DELETE `pet_stage` FROM `pet_stage` INNER JOIN `pet` ON `pet_stage`.`pet_id` = `pet`.`id` WHERE `pet`.`school_id` = @school_id;');
  lines.push('DELETE FROM `pet` WHERE `school_id` = @school_id;');
  lines.push('');

  for (const pet of pets) {
    const category = inferByRules(pet.name, CATEGORY_RULES, 'other');
    const rarity = inferByRules(pet.name, RARITY_RULES, 'normal');
    const coverFilename = chooseStageFilename(pet.files, 1);
    const coverUrl = `/assets/pets/400/${coverFilename}`;
    const description = buildDescription(pet.name, category);
    lines.push(
      `INSERT INTO \`pet\` (\`school_id\`, \`code\`, \`name\`, \`category\`, \`rarity\`, \`source_type\`, \`cover_url\`, \`description\`, \`status\`, \`created_at\`, \`updated_at\`) VALUES (@school_id, '${escapeSql(pet.code)}', '${escapeSql(pet.name)}', '${category}', '${rarity}', 'system', '${escapeSql(coverUrl)}', '${escapeSql(description)}', 'enabled', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`category\` = VALUES(\`category\`), \`rarity\` = VALUES(\`rarity\`), \`source_type\` = VALUES(\`source_type\`), \`cover_url\` = VALUES(\`cover_url\`), \`description\` = VALUES(\`description\`), \`status\` = VALUES(\`status\`), \`updated_at\` = NOW(3);`,
    );
    lines.push(`SET @pet_id = (SELECT \`id\` FROM \`pet\` WHERE \`school_id\` = @school_id AND \`code\` = '${escapeSql(pet.code)}' LIMIT 1);`);
    for (let stageNo = 1; stageNo <= 10; stageNo += 1) {
      const imageFilename = chooseStageFilename(pet.files, stageNo);
      const imageUrl = `/assets/pets/400/${imageFilename}`;
      const stageName = `${pet.name}·Lv.${stageNo}`;
      const needScoreTotal = STAGE_EXP_TOTALS[stageNo - 1];
      lines.push(
        `INSERT INTO \`pet_stage\` (\`pet_id\`, \`stage_no\`, \`level_no\`, \`name\`, \`image_url\`, \`need_score_total\`, \`animation_key\`, \`created_at\`, \`updated_at\`) VALUES (@pet_id, ${stageNo}, ${stageNo}, '${escapeSql(stageName)}', '${escapeSql(imageUrl)}', ${needScoreTotal}, 'pet-level-up', NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE \`level_no\` = VALUES(\`level_no\`), \`name\` = VALUES(\`name\`), \`image_url\` = VALUES(\`image_url\`), \`need_score_total\` = VALUES(\`need_score_total\`), \`animation_key\` = VALUES(\`animation_key\`), \`updated_at\` = NOW(3);`,
      );
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function main() {
  const pets = parsePetAssets();
  if (pets.length === 0) {
    throw new Error(`未在目录中找到任何萌宠素材：${sourceDir}`);
  }
  validatePets(pets);
  const sql = buildSql(pets);
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`已生成 ${pets.length} 个萌宠的初始化 SQL：${outputPath}`);
  console.log(`已使用图片资源目录：${sourceDir}`);
}

main();
