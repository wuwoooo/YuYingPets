const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const backendRoot = path.resolve(__dirname, '..');
const sourceDir = path.resolve(backendRoot, 'public/assets/pets');

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

function runOrThrow(command, args) {
  const result = spawnSync(command, args, {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`命令执行失败: ${command} ${args.join(' ')}`);
  }
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
    const stageNo = Number(stageNoText);
    const current = pets.get(code) || { code, name, files: new Map() };
    current.files.set(stageNo, filename);
    pets.set(code, current);
  }
  return Array.from(pets.values()).sort((a, b) => a.code.localeCompare(b.code, 'en'));
}

function chooseStageFilename(files, stageNo) {
  if (files.has(stageNo)) return files.get(stageNo);
  const available = Array.from(files.keys()).sort((a, b) => a - b);
  const fallback = available.find((item) => item > stageNo) ?? available[available.length - 1];
  return files.get(fallback);
}

function resolveAssetStageNo(files, stageNo) {
  if (files.has(11)) {
    return stageNo === 1 ? 1 : stageNo + 1;
  }
  return stageNo;
}

function compressLevel(level) {
  const normalized = Number(level || 1);
  if (normalized <= 2) return 1;
  return Math.max(1, normalized - 1);
}

async function main() {
  runOrThrow(process.execPath, [path.resolve(__dirname, 'generate-pet-catalog-sql.cjs')]);

  const school = await prisma.school.findFirst({
    where: { code: 'YYXX' },
    select: { id: true },
  });

  if (!school) {
    throw new Error('未找到学校 YYXX，无法导入默认萌宠图鉴');
  }

  const pets = parsePetAssets();
  for (const pet of pets) {
    const category = inferByRules(pet.name, CATEGORY_RULES, 'other');
    const rarity = inferByRules(pet.name, RARITY_RULES, 'normal');
    const coverUrl = `/assets/pets/${chooseStageFilename(pet.files, 1)}`;
    const description = buildDescription(pet.name, category);

    const saved = await prisma.pet.upsert({
      where: {
        schoolId_code: {
          schoolId: school.id,
          code: pet.code,
        },
      },
      update: {
        name: pet.name,
        category,
        rarity,
        sourceType: 'system',
        coverUrl,
        description,
        status: 'enabled',
      },
      create: {
        schoolId: school.id,
        code: pet.code,
        name: pet.name,
        category,
        rarity,
        sourceType: 'system',
        coverUrl,
        description,
        status: 'enabled',
      },
    });

    await prisma.petStage.deleteMany({
      where: { petId: saved.id },
    });

    await prisma.petStage.createMany({
      data: Array.from({ length: 10 }, (_, index) => {
        const stageNo = index + 1;
        const filename = chooseStageFilename(pet.files, resolveAssetStageNo(pet.files, stageNo));
        return {
          petId: saved.id,
          stageNo,
          levelNo: stageNo,
          name: `${pet.name}·Lv.${stageNo}`,
          imageUrl: `/assets/pets/${filename}`,
          needScoreTotal: STAGE_EXP_TOTALS[index],
          animationKey: 'pet-level-up',
        };
      }),
    });
  }

  const studentPets = await prisma.studentPet.findMany({
    select: { id: true, currentLevel: true, currentStageNo: true },
  });
  for (const studentPet of studentPets) {
    const currentLevel = compressLevel(studentPet.currentLevel);
    const currentStageNo = compressLevel(studentPet.currentStageNo);
    await prisma.studentPet.update({
      where: { id: studentPet.id },
      data: {
        currentLevel,
        currentStageNo,
      },
    });
  }

  const profiles = await prisma.studentProfile.findMany({
    select: { studentId: true, currentPetLevel: true },
  });
  for (const profile of profiles) {
    await prisma.studentProfile.update({
      where: { studentId: profile.studentId },
      data: {
        currentPetLevel: compressLevel(profile.currentPetLevel),
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
