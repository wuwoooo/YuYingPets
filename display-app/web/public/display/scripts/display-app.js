/* ========== 学生数据 ========== */
const students = [
  {
    name: "王小明",
    petId: "001",
    petName: "东北虎",
    ext: "png",
    lv: 5,
    pts: 328,
    medals: 5,
  },
  {
    name: "李思语",
    petId: "005",
    petName: "柯基",
    ext: "jpg",
    lv: 4,
    pts: 285,
    medals: 4,
  },
  {
    name: "张浩然",
    petId: "007",
    petName: "萨摩耶",
    ext: "jpg",
    lv: 4,
    pts: 276,
    medals: 3,
  },
  {
    name: "陈雨欣",
    petId: "002",
    petName: "侏儒兔",
    ext: "jpg",
    lv: 3,
    pts: 245,
    medals: 3,
  },
  {
    name: "刘子涵",
    petId: "010",
    petName: "橘猫",
    ext: "jpg",
    lv: 3,
    pts: 238,
    medals: 2,
  },
  {
    name: "杨思琪",
    petId: "003",
    petName: "安哥拉兔",
    ext: "jpg",
    lv: 3,
    pts: 220,
    medals: 2,
  },
  {
    name: "赵天宇",
    petId: "023",
    petName: "哈士奇",
    ext: "jpg",
    lv: 3,
    pts: 215,
    medals: 2,
  },
  {
    name: "黄诗涵",
    petId: "009",
    petName: "猫猫兔",
    ext: "jpg",
    lv: 3,
    pts: 198,
    medals: 2,
  },
  {
    name: "周子豪",
    petId: "018",
    petName: "金毛",
    ext: "jpg",
    lv: 2,
    pts: 186,
    medals: 1,
  },
  {
    name: "吴雨桐",
    petId: "008",
    petName: "金渐层",
    ext: "jpg",
    lv: 2,
    pts: 175,
    medals: 1,
  },
  {
    name: "郑浩宇",
    petId: "006",
    petName: "边牧",
    ext: "jpg",
    lv: 2,
    pts: 168,
    medals: 1,
  },
  {
    name: "孙思睿",
    petId: "004",
    petName: "布丁仓鼠",
    ext: "jpg",
    lv: 2,
    pts: 162,
    medals: 1,
  },
  {
    name: "马若曦",
    petId: "046",
    petName: "布偶猫",
    ext: "jpg",
    lv: 2,
    pts: 155,
    medals: 1,
  },
  {
    name: "朱俊杰",
    petId: "024",
    petName: "拉布拉多",
    ext: "jpg",
    lv: 2,
    pts: 148,
    medals: 1,
  },
  {
    name: "胡雨萱",
    petId: "022",
    petName: "银渐层",
    ext: "jpg",
    lv: 2,
    pts: 140,
    medals: 1,
  },
  {
    name: "林浩然",
    petId: "013",
    petName: "博美",
    ext: "jpg",
    lv: 2,
    pts: 135,
    medals: 1,
  },
  {
    name: "何佳怡",
    petId: "027",
    petName: "波斯猫",
    ext: "jpg",
    lv: 1,
    pts: 128,
    medals: 0,
  },
  {
    name: "罗天翔",
    petId: "036",
    petName: "柴犬",
    ext: "jpg",
    lv: 1,
    pts: 120,
    medals: 0,
  },
  {
    name: "谢雨辰",
    petId: "026",
    petName: "龙猫",
    ext: "jpg",
    lv: 1,
    pts: 115,
    medals: 0,
  },
  {
    name: "唐思远",
    petId: "048",
    petName: "垂耳兔",
    ext: "jpg",
    lv: 1,
    pts: 108,
    medals: 0,
  },
  {
    name: "韩诗雨",
    petId: "050",
    petName: "英短蓝猫",
    ext: "jpg",
    lv: 1,
    pts: 98,
    medals: 0,
  },
  {
    name: "冯子墨",
    petId: "049",
    petName: "泰迪",
    ext: "jpg",
    lv: 1,
    pts: 92,
    medals: 0,
  },
  {
    name: "曹雨欣",
    petId: "020",
    petName: "三花猫",
    ext: "jpg",
    lv: 1,
    pts: 85,
    medals: 0,
  },
  {
    name: "邓浩宇",
    petId: "017",
    petName: "比熊",
    ext: "jpg",
    lv: 1,
    pts: 78,
    medals: 0,
  },
  {
    name: "丁一诺",
    hasPet: false,
    pts: 72,
    medals: 0,
    lv: 1,
  },
  {
    name: "高梓轩",
    hasPet: false,
    pts: 65,
    medals: 0,
    lv: 1,
  },
  {
    name: "袁梦琪",
    hasPet: false,
    pts: 58,
    medals: 0,
    lv: 1,
  },
];

/* 未领养学生默认无宠；学生默认不自动分组 */
students.forEach((s) => {
  if (s.hasPet == null) s.hasPet = true;
});

/* 可选领养萌宠离线兜底（正式图鉴以接口返回为准） */
const adoptPetCatalog = [
  {
    code: "051",
    name: "星尘鸮",
    category: "star",
    coverUrl: "/assets/pets/400/051_星尘鸮_1.png",
  },
  {
    code: "052",
    name: "星糖喵",
    category: "star",
    coverUrl: "/assets/pets/400/052_星糖喵_1.png",
  },
  {
    code: "053",
    name: "晨露鹿",
    category: "star",
    coverUrl: "/assets/pets/400/053_晨露鹿_1.png",
  },
  {
    code: "054",
    name: "曜虎机",
    category: "star",
    coverUrl: "/assets/pets/400/054_曜虎机_1.png",
  },
  {
    code: "055",
    name: "月纱兔",
    category: "star",
    coverUrl: "/assets/pets/400/055_月纱兔_1.png",
  },
  {
    code: "056",
    name: "森歌獭",
    category: "star",
    coverUrl: "/assets/pets/400/056_森歌獭_1.png",
  },
  {
    code: "057",
    name: "樱铃猫",
    category: "star",
    coverUrl: "/assets/pets/400/057_樱铃猫_1.png",
  },
  {
    code: "058",
    name: "泡泡狐",
    category: "star",
    coverUrl: "/assets/pets/400/058_泡泡狐_1.png",
  },
  {
    code: "059",
    name: "潮汐獭",
    category: "star",
    coverUrl: "/assets/pets/400/059_潮汐獭_1.png",
  },
  {
    code: "060",
    name: "烈焰牛",
    category: "star",
    coverUrl: "/assets/pets/400/060_烈焰牛_1.png",
  },
  {
    code: "061",
    name: "玉麒团",
    category: "star",
    coverUrl: "/assets/pets/400/061_玉麒团_1.png",
  },
  {
    code: "062",
    name: "电波狸",
    category: "star",
    coverUrl: "/assets/pets/400/062_电波狸_1.png",
  },
  {
    code: "063",
    name: "竹团貘",
    category: "star",
    coverUrl: "/assets/pets/400/063_竹团貘_1.png",
  },
  {
    code: "064",
    name: "糖霜鹿",
    category: "star",
    coverUrl: "/assets/pets/400/064_糖霜鹿_1.png",
  },
  {
    code: "065",
    name: "绒雪喵",
    category: "star",
    coverUrl: "/assets/pets/400/065_绒雪喵_1.png",
  },
  {
    code: "066",
    name: "蜜桃狐",
    category: "star",
    coverUrl: "/assets/pets/400/066_蜜桃狐_1.png",
  },
  {
    code: "067",
    name: "钢牙鲨",
    category: "star",
    coverUrl: "/assets/pets/400/067_钢牙鲨_1.png",
  },
  {
    code: "068",
    name: "雷翼狼",
    category: "star",
    coverUrl: "/assets/pets/400/068_雷翼狼_1.png",
  },
  {
    code: "069",
    name: "霓虹豚",
    category: "star",
    coverUrl: "/assets/pets/400/069_霓虹豚_1.png",
  },
  {
    code: "070",
    name: "风暴柴",
    category: "star",
    coverUrl: "/assets/pets/400/070_风暴柴_1.png",
  },
  {
    code: "071",
    name: "岩角龙",
    category: "star",
    coverUrl: "/assets/pets/400/071_岩角龙_1.png",
  },
  {
    code: "072",
    name: "布丁兔",
    category: "star",
    coverUrl: "/assets/pets/400/072_布丁兔_1.png",
  },
  {
    code: "073",
    name: "云团熊",
    category: "star",
    coverUrl: "/assets/pets/400/073_云团熊_1.png",
  },
  {
    code: "074",
    name: "子鼠宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/074_子鼠宝_1.png",
  },
  {
    code: "075",
    name: "丑牛宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/075_丑牛宝_1.png",
  },
  {
    code: "076",
    name: "寅虎宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/076_寅虎宝_1.png",
  },
  {
    code: "077",
    name: "卯兔宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/077_卯兔宝_1.png",
  },
  {
    code: "078",
    name: "辰龙宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/078_辰龙宝_1.png",
  },
  {
    code: "079",
    name: "巳蛇宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/079_巳蛇宝_1.png",
  },
  {
    code: "080",
    name: "午马宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/080_午马宝_1.png",
  },
  {
    code: "081",
    name: "未羊宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/081_未羊宝_1.png",
  },
  {
    code: "082",
    name: "申猴宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/082_申猴宝_1.png",
  },
  {
    code: "083",
    name: "酉鸡宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/083_酉鸡宝_1.png",
  },
  {
    code: "084",
    name: "戌狗宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/084_戌狗宝_1.png",
  },
  {
    code: "085",
    name: "亥猪宝",
    category: "zodiac",
    coverUrl: "/assets/pets/400/085_亥猪宝_1.png",
  },
];
const PET_STAGE_COUNT = 10;
const ADOPT_ORBIT_LAYOUT = {
  centerX: 50,
  // 圆心在立绘中心上方，整段星轨悬于图片之上
  centerY: 54,
  radiusX: 48,
  radiusY: 30,
  // 从左到右沿上方半弧分布（经 90° 顶点）
  startDeg: 154,
  endDeg: 26,
};

/** 计算进化图谱星轨节点坐标，保证 Lv.1-Lv.10 在上方弧线上等角距分布 */
function getAdoptOrbitPosition(index, total = PET_STAGE_COUNT) {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const angleDeg =
    ADOPT_ORBIT_LAYOUT.startDeg +
    (ADOPT_ORBIT_LAYOUT.endDeg - ADOPT_ORBIT_LAYOUT.startDeg) * t;
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x:
      ADOPT_ORBIT_LAYOUT.centerX +
      Math.cos(radians) * ADOPT_ORBIT_LAYOUT.radiusX,
    y:
      ADOPT_ORBIT_LAYOUT.centerY -
      Math.sin(radians) * ADOPT_ORBIT_LAYOUT.radiusY,
    angleDeg,
  };
}

const STAR_SEED_IMAGE_URL = "/assets/pets/400/star-seed.png";

const PET_FAMILY_OPTIONS = [
  { key: "all", label: "全部" },
  { key: "star", label: "星宠" },
  { key: "zodiac", label: "十二生肖" },
];

const PET_CATEGORY_META = {
  star: { family: "star", label: "星宠" },
  zodiac: { family: "zodiac", label: "十二生肖" },
  cat: { family: "cat", label: "猫咪系" },
  dog: { family: "dog", label: "犬类系" },
  rabbit: { family: "rabbit", label: "兔子系" },
  hamster: { family: "hamster", label: "仓鼠系" },
  mythical: { family: "mythical", label: "神兽系" },
  bird: { family: "other", label: "飞羽系" },
  small_pet: { family: "other", label: "小宠系" },
  wild: { family: "other", label: "野趣系" },
  other: { family: "other", label: "其他" },
};

const PET_THEME_META = {
  cat: {
    accent: "#4fa7f8",
    accentSoft: "rgba(79, 167, 248, 0.16)",
    glow: "rgba(79, 167, 248, 0.34)",
    gradient: "linear-gradient(135deg, #2d7fcb, #71c7ff)",
  },
  dog: {
    accent: "#ff8f4d",
    accentSoft: "rgba(255, 143, 77, 0.16)",
    glow: "rgba(255, 143, 77, 0.34)",
    gradient: "linear-gradient(135deg, #f07235, #ffbc62)",
  },
  rabbit: {
    accent: "#ff79a9",
    accentSoft: "rgba(255, 121, 169, 0.16)",
    glow: "rgba(255, 121, 169, 0.34)",
    gradient: "linear-gradient(135deg, #f75695, #ffb1cd)",
  },
  hamster: {
    accent: "#f1b43f",
    accentSoft: "rgba(241, 180, 63, 0.16)",
    glow: "rgba(241, 180, 63, 0.34)",
    gradient: "linear-gradient(135deg, #e9972b, #ffd95b)",
  },
  mythical: {
    accent: "#b171ff",
    accentSoft: "rgba(177, 113, 255, 0.16)",
    glow: "rgba(177, 113, 255, 0.34)",
    gradient: "linear-gradient(135deg, #8f4bff, #d0a4ff)",
  },
  other: {
    accent: "#35bfa8",
    accentSoft: "rgba(53, 191, 168, 0.16)",
    glow: "rgba(53, 191, 168, 0.34)",
    gradient: "linear-gradient(135deg, #1f9f99, #5ed8b3)",
  },
};

let studentSortMode = "score";
let groupFilter = null;
let groupManageDraft = null;
let groupManagePersistPromise = Promise.resolve();
let groupManagePersistTimer = null;
let batchMode = false;
const batchSelectedNames = new Set();
let adoptTargetName = null;
let currentProfileStudent = null;
let currentProfileShowcaseStudentKey = null;
let petProfileShowcaseToken = 0;
let currentAllHistoryRecords = [];
let currentPetProfileRecords = [];
let currentPetProfileHonors = [];
const petPkState = {
  cleanup: null,
  proxyEl: null,
  proxyFrame: 0,
  proxyX: 0,
  proxyY: 0,
  proxyLocked: false,
  dragAtmosphereEl: null,
  targetLockEl: null,
  sourceCard: null,
  sourceTrigger: null,
  hoverTargetCard: null,
  overlayTimer: null,
  countdownTimers: [],
  audioCtx: null,
  lastHoverName: "",
};
const adoptModalState = {
  family: "all",
  selectedPetCode: null,
  previewStageNo: 1,
  transitionSeed: 0,
  detailEntrySource: "adopt",
  gridRenderSignature: "",
};

function resolvePetCategoryMeta(category) {
  return PET_CATEGORY_META[category] || PET_CATEGORY_META.other;
}

function resolvePetFamily(category) {
  return resolvePetCategoryMeta(category).family;
}

function resolvePetFamilyLabel(category) {
  const family = resolvePetFamily(category);
  return (
    PET_FAMILY_OPTIONS.find((item) => item.key === family)?.label ||
    PET_FAMILY_OPTIONS[PET_FAMILY_OPTIONS.length - 1].label
  );
}

function resolvePetCategoryLabel(category) {
  return resolvePetCategoryMeta(category).label;
}

function resolvePetTheme(category) {
  const family = resolvePetFamily(category);
  return PET_THEME_META[family] || PET_THEME_META.other;
}

function normalizePetStage(stage, index = 0) {
  return {
    id: stage?.id || `${stage?.stageNo || index + 1}`,
    stageNo: Number(stage?.stageNo || stage?.levelNo || index + 1),
    levelNo: Number(stage?.levelNo || stage?.stageNo || index + 1),
    name:
      stage?.name ||
      `Lv.${Number(stage?.levelNo || stage?.stageNo || index + 1)}`,
    imageUrl: stage?.imageUrl || "",
    needScoreTotal: Number(stage?.needScoreTotal || 0),
    animationKey: stage?.animationKey || null,
  };
}

function normalizePetCatalogItem(item, index = 0) {
  const stages = Array.isArray(item?.stages)
    ? item.stages.map((stage, stageIndex) =>
        normalizePetStage(stage, stageIndex),
      )
    : [];
  const coverUrl =
    item?.coverUrl ||
    stages.find((stage) => stage.stageNo === 1)?.imageUrl ||
    stages[0]?.imageUrl ||
    "";
  return {
    id: item?.id || index + 1,
    code: String(item?.code || ""),
    name: item?.name || "未命名萌宠",
    category: item?.category || "other",
    rarity: item?.rarity || "",
    description: item?.description || "",
    coverUrl,
    sourceType: item?.sourceType || "system",
    status: item?.status || "enabled",
    stageCount: Number(item?.stageCount || stages.length || 0),
    stages,
  };
}

function normalizePetCatalog(items) {
  return Array.isArray(items)
    ? items
        .map((item, index) => normalizePetCatalogItem(item, index))
        .filter((item) => Boolean(item.code))
    : [];
}

function getAdoptCatalog() {
  const source =
    runtimeState.petCatalog.length > 0
      ? runtimeState.petCatalog
      : adoptPetCatalog;
  return normalizePetCatalog(source);
}

function getFilteredAdoptCatalog() {
  const catalog = getAdoptCatalog();
  return catalog.filter(
    (pet) =>
      adoptModalState.family === "all" ||
      resolvePetFamily(pet.category) === adoptModalState.family,
  );
}

function getVisibleAdoptFamilyOptions() {
  const familiesWithPets = new Set(
    getAdoptCatalog().map((pet) => resolvePetFamily(pet.category)),
  );
  return PET_FAMILY_OPTIONS.filter(
    (option) => option.key === "all" || familiesWithPets.has(option.key),
  );
}

function normalizeAdoptFamilySelection() {
  const options = getVisibleAdoptFamilyOptions();
  if (!options.some((option) => option.key === adoptModalState.family)) {
    adoptModalState.family = "all";
  }
  return options;
}

function getSelectedAdoptPet() {
  return (
    getAdoptCatalog().find(
      (pet) => pet.code === adoptModalState.selectedPetCode,
    ) || null
  );
}

function setAdoptPetFamily(family) {
  const options = getVisibleAdoptFamilyOptions();
  adoptModalState.family = options.some((option) => option.key === family)
    ? family
    : "all";
  const filtered = getFilteredAdoptCatalog();
  if (!filtered.some((pet) => pet.code === adoptModalState.selectedPetCode)) {
    adoptModalState.selectedPetCode = filtered[0]?.code || null;
  }
  adoptModalState.previewStageNo = 1;
  renderAdoptPetModal();
}

function previewAdoptPet(petCode, stageNo = 1) {
  const detailModalActive = document
    .getElementById("adoptPetDetailModal")
    ?.classList.contains("active");
  adoptModalState.selectedPetCode = petCode;
  adoptModalState.previewStageNo = stageNo;
  adoptModalState.transitionSeed += 1;
  if (detailModalActive && updateAdoptPetDetailStage(petCode, stageNo)) {
    return;
  }
  renderAdoptPetGrid();
  if (detailModalActive) {
    renderAdoptPetDetail();
  }
}

function openAdoptPetDetailModal(petCode, stageNo = 1, entrySource = "adopt") {
  adoptModalState.detailEntrySource = entrySource;
  adoptModalState.selectedPetCode = petCode;
  adoptModalState.previewStageNo = stageNo;
  adoptModalState.transitionSeed += 1;
  renderAdoptPetDetail();
  document.getElementById("adoptPetDetailModal")?.classList.add("active");
}

function closeAdoptPetDetailModal() {
  document.getElementById("adoptPetDetailModal")?.classList.remove("active");
}

function getPetPreviewImage(pet, stageNo) {
  return (
    (Array.isArray(pet?.stages)
      ? pet.stages.find((stage) => stage.stageNo === stageNo)?.imageUrl
      : null) ||
    pet?.coverUrl ||
    ""
  );
}

function getAdoptStageContext(pet, stageNo) {
  const stages = Array.isArray(pet?.stages) ? pet.stages : [];
  const previewStageNo = stageNo || 1;
  const selectedStage =
    stages.find((stage) => stage.stageNo === previewStageNo) ||
    stages[0] ||
    null;
  const nextStage = selectedStage
    ? stages.find((stage) => stage.stageNo === selectedStage.stageNo + 1) ||
      null
    : null;
  const previousStage = selectedStage
    ? stages.find((stage) => stage.stageNo === selectedStage.stageNo - 1) ||
      null
    : null;
  return { stages, previewStageNo, selectedStage, nextStage, previousStage };
}

function ensureAdoptPreviewStageImage(previewEl, pet, stageNo) {
  const existing = previewEl.querySelector(`img[data-stage-no="${stageNo}"]`);
  if (existing) return existing;
  const previewImageUrl = getPetPreviewImage(pet, stageNo);
  const showcaseSize = isLowSpecMode() ? 400 : getShowcasePetImageSize();
  const highResPreviewUrl = resolvePetAssetVariantUrl(
    previewImageUrl,
    showcaseSize,
  );
  const fallbackPreviewUrl =
    resolvePetAssetVariantUrl(previewImageUrl, 400) || "images/logo.svg";
  const img = document.createElement("img");
  img.dataset.stageNo = String(stageNo);
  img.src = highResPreviewUrl;
  img.alt = pet.name;
  img.loading = "lazy";
  img.decoding = "async";
  img.onerror = () => {
    img.onerror = null;
    img.src = fallbackPreviewUrl;
  };
  previewEl.insertBefore(img, previewEl.firstChild);
  return img;
}

function updateAdoptPetDetailStage(petCode, stageNo) {
  const detail = document.getElementById("adoptPetDetail");
  if (!detail || detail.dataset.petCode !== String(petCode)) return false;
  const pet = getSelectedAdoptPet();
  if (!pet || String(pet.code) !== String(petCode)) return false;
  const { stages, previewStageNo, selectedStage, nextStage, previousStage } =
    getAdoptStageContext(pet, stageNo);
  if (!selectedStage && stages.length === 0) return false;

  detail.dataset.stageNo = String(previewStageNo);

  detail.querySelectorAll(".adopt-orbit-node").forEach((node) => {
    const nodeStageNo = Number(node.dataset.stageNo || 0);
    node.classList.toggle("passed", nodeStageNo <= previewStageNo);
    node.classList.toggle("current", nodeStageNo === previewStageNo);
  });
  detail.querySelectorAll(".adopt-stage-chip").forEach((chip) => {
    chip.classList.toggle(
      "current",
      Number(chip.dataset.stageNo || 0) === previewStageNo,
    );
  });

  const selectedOrbit = getAdoptOrbitPosition(Math.max(0, previewStageNo - 1));
  const beam = detail.querySelector(".adopt-stage-beam");
  if (beam) {
    const coreX = ADOPT_ORBIT_LAYOUT.centerX;
    const coreY = 66;
    const beamDeltaX = coreX - selectedOrbit.x;
    const beamDeltaY = coreY - selectedOrbit.y;
    beam.style.setProperty("--beam-x", `${selectedOrbit.x.toFixed(2)}%`);
    beam.style.setProperty("--beam-y", `${selectedOrbit.y.toFixed(2)}%`);
    beam.style.setProperty(
      "--beam-length",
      `${Math.sqrt(beamDeltaX * beamDeltaX + beamDeltaY * beamDeltaY).toFixed(2)}%`,
    );
    beam.style.setProperty(
      "--beam-angle",
      `${(Math.atan2(beamDeltaY, beamDeltaX) * (180 / Math.PI)).toFixed(2)}deg`,
    );
  }

  const previewEl = detail.querySelector(".adopt-detail-preview");
  if (previewEl) {
    previewEl.dataset.transitionSeed = String(adoptModalState.transitionSeed);
    const activeImg = ensureAdoptPreviewStageImage(
      previewEl,
      pet,
      previewStageNo,
    );
    previewEl.querySelectorAll("img[data-stage-no]").forEach((img) => {
      const active = img === activeImg;
      img.hidden = !active;
      img.style.display = active ? "" : "none";
      img.classList.toggle("evo-pet-shine", active && !isLowSpecMode());
    });
  }

  const currentName = detail.querySelector(".adopt-stage-current-name");
  if (currentName)
    currentName.textContent =
      selectedStage?.name || `${pet.name} · Lv.${previewStageNo}`;
  const currentLevel = detail.querySelector(
    '[data-adopt-stat="current-level"] strong',
  );
  if (currentLevel)
    currentLevel.textContent = `Lv.${selectedStage?.stageNo || previewStageNo}`;
  const needScore = detail.querySelector(
    '[data-adopt-stat="need-score"] strong',
  );
  if (needScore)
    needScore.textContent = String(selectedStage?.needScoreTotal ?? 0);
  const nextLevel = detail.querySelector(
    '[data-adopt-stat="next-level"] strong',
  );
  if (nextLevel)
    nextLevel.textContent = nextStage ? `Lv.${nextStage.stageNo}` : "已满级";
  const scoreDiff = detail.querySelector(
    '[data-adopt-stat="score-diff"] strong',
  );
  if (scoreDiff)
    scoreDiff.textContent = String(
      nextStage
        ? nextStage.needScoreTotal - (selectedStage?.needScoreTotal ?? 0)
        : 0,
    );
  const hint = detail.querySelector(".adopt-stage-hint");
  if (hint) {
    hint.textContent = previousStage
      ? `上一形态 Lv.${previousStage.stageNo} 已解锁，下一形态 ${nextStage ? `Lv.${nextStage.stageNo}` : "已到终点"}.`
      : `当前是初始形态，下一形态 ${nextStage ? `Lv.${nextStage.stageNo}` : "已到终点"}.`;
  }
  const evoText = detail.querySelector(".evo-text");
  if (evoText)
    evoText.textContent = `Lv.${selectedStage?.stageNo || previewStageNo} 进化形态`;
  return true;
}

function renderAdoptFamilyTabs() {
  const tabs = document.getElementById("adoptPetFamilyTabs");
  if (!tabs) return;
  const options = normalizeAdoptFamilySelection();
  tabs.innerHTML = options
    .map(
      (option) => `
      <button
        type="button"
        class="adopt-family-chip${adoptModalState.family === option.key ? " active" : ""}"
        onclick="setAdoptPetFamily('${option.key}')"
      >
        ${escapeHtml(option.label)}
      </button>`,
    )
    .join("");
}

function renderAdoptPetGrid() {
  const grid = document.getElementById("adoptPetGrid");
  if (!grid) return;
  const catalog = getFilteredAdoptCatalog();
  const gridSignature = JSON.stringify({
    family: adoptModalState.family,
    selectedPetCode: adoptModalState.selectedPetCode,
    previewStageNo: adoptModalState.previewStageNo,
    pets: catalog.map((pet) => [
      pet.code,
      pet.coverUrl,
      pet.stageCount,
      Array.isArray(pet.stages)
        ? pet.stages.map((stage) => [stage.stageNo, stage.imageUrl])
        : [],
    ]),
  });
  if (
    grid.dataset.renderSignature === gridSignature &&
    grid.childElementCount > 0
  ) {
    return;
  }
  grid.dataset.renderSignature = gridSignature;
  if (catalog.length === 0) {
    grid.innerHTML =
      '<div class="adopt-pet-empty">当前分类下还没有可领养的萌宠。</div>';
    return;
  }
  grid.innerHTML = catalog
    .map((pet) => {
      const familyLabel = resolvePetFamilyLabel(pet.category);
      const categoryLabel = resolvePetCategoryLabel(pet.category);
      const previewStageNo =
        adoptModalState.selectedPetCode === pet.code
          ? adoptModalState.previewStageNo
          : 1;
      const dots = Array.from({ length: PET_STAGE_COUNT }, (_, index) => {
        const stageNo = index + 1;
        const active =
          index <
          Math.min(pet.stageCount || pet.stages.length, PET_STAGE_COUNT);
        return `<button type="button" class="adopt-stage-dot${active ? " active" : ""}${previewStageNo === stageNo ? " current" : ""}" onclick="event.stopPropagation();previewAdoptPet('${pet.code}', ${stageNo})"></button>`;
      }).join("");
      return `
      <div
        class="adopt-pet-card${adoptModalState.selectedPetCode === pet.code ? " active" : ""}"
        onclick="openAdoptPetDetailModal('${pet.code}', ${previewStageNo})"
        role="button"
        tabindex="0"
      >
        <div class="adopt-pet-card-image">
          <img src="${resolveAssetUrl(getPetPreviewImage(pet, previewStageNo))}" alt="${escapeHtml(pet.name)}" loading="lazy" onerror="this.src='images/logo.svg'">
        </div>
        <div class="adopt-pet-card-body">
          <div class="adopt-pet-card-name">${escapeHtml(pet.name)}</div>
        </div>
      </div>`;
    })
    .join("");
}

function renderAdoptPetDetail() {
  const detail = document.getElementById("adoptPetDetail");
  if (!detail) return;
  const pet = getSelectedAdoptPet();
  const title = document.getElementById("adoptPetDetailTitle");
  if (!pet) {
    if (title) title.textContent = "未找到萌宠信息";
    detail.innerHTML = `
      <div class="adopt-pet-empty" style="padding: 100px 0;">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 48px; margin-bottom: 20px; color: rgba(255,255,255,0.2);"></i>
        <p>未能在当前图鉴中找到编号为 "${adoptModalState.selectedPetCode}" 的萌宠记录。</p>
        <button class="card-adopt-btn" style="margin-top: 20px; width: auto; padding: 10px 30px;" onclick="closeAdoptPetDetailModal()">关闭</button>
      </div>`;
    return;
  }
  if (title) title.textContent = `${pet.name} · 进化图谱`;
  const familyLabel = resolvePetFamilyLabel(pet.category);
  const categoryLabel = resolvePetCategoryLabel(pet.category);
  const stages = Array.isArray(pet.stages) ? pet.stages : [];
  const previewStageNo = adoptModalState.previewStageNo || 1;
  const selectedStage =
    stages.find((stage) => stage.stageNo === previewStageNo) ||
    stages[0] ||
    null;
  const nextStage = selectedStage
    ? stages.find((stage) => stage.stageNo === selectedStage.stageNo + 1) ||
      null
    : null;
  const previousStage = selectedStage
    ? stages.find((stage) => stage.stageNo === selectedStage.stageNo - 1) ||
      null
    : null;
  const theme = resolvePetTheme(pet.category);
  const isAdoptLite = isLowSpecMode();
  const coreX = ADOPT_ORBIT_LAYOUT.centerX;
  const coreY = 66;
  const selectedOrbit = getAdoptOrbitPosition(Math.max(0, previewStageNo - 1));
  const selectedNodeX = selectedOrbit.x;
  const selectedNodeY = selectedOrbit.y;
  const beamDeltaX = coreX - selectedNodeX;
  const beamDeltaY = coreY - selectedNodeY;
  const beamLength = Math.sqrt(
    beamDeltaX * beamDeltaX + beamDeltaY * beamDeltaY,
  );
  const beamAngle = Math.atan2(beamDeltaY, beamDeltaX) * (180 / Math.PI);
  const particleDots = isAdoptLite
    ? ""
    : Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        const radius = 26 + (index % 4) * 8;
        const x = 50 + Math.cos(angle) * radius;
        const y = 62 + Math.sin(angle) * (radius * 0.62);
        const size = 4 + (index % 3) * 2;
        const delay = (index % 6) * 0.45;
        const duration = 4.5 + (index % 5) * 0.6;
        return `<span class="adopt-stage-particle p-${(index % 3) + 1}" style="--particle-x:${x.toFixed(2)}%; --particle-y:${y.toFixed(2)}%; --particle-size:${size}px; --particle-delay:${delay}s; --particle-duration:${duration}s;"></span>`;
      }).join("");
  const runeMarks = isAdoptLite
    ? ""
    : Array.from({ length: 6 }, (_, index) => {
        const angle = -90 + index * 60;
        return `<span class="adopt-stage-rune rune-${index + 1}" style="--rune-angle:${angle}deg;">✦</span>`;
      }).join("");
  const energyShards = isAdoptLite
    ? ""
    : Array.from({ length: 8 }, (_, index) => {
        const angle = -66 + index * 18;
        const radius = index % 2 === 0 ? 34 : 39;
        const delay = (index % 4) * 0.35;
        return `<span class="adopt-stage-shard shard-${index + 1}" style="--shard-angle:${angle}deg; --shard-radius:${radius}%; --shard-delay:${delay}s;"></span>`;
      }).join("");
  const orbitNodes = Array.from({ length: PET_STAGE_COUNT }, (_, index) => {
    const stageNo = index + 1;
    const stage = stages.find((item) => item.stageNo === stageNo);
    const enabled = Boolean(stage);
    const orbit = getAdoptOrbitPosition(index);
    return `
      <button
        type="button"
        class="adopt-orbit-node${enabled ? " active" : ""}${stageNo <= previewStageNo ? " passed" : ""}${previewStageNo === stageNo ? " current" : ""}"
        style="--node-x:${orbit.x.toFixed(2)}%; --node-y:${orbit.y.toFixed(2)}%; --pet-accent:${theme.accent}; --pet-glow:${theme.glow};"
        data-stage-no="${stageNo}"
        onclick="previewAdoptPet('${pet.code}', ${stageNo})"
        ${enabled ? "" : "disabled"}
      >
        <span class="adopt-orbit-node-halo" aria-hidden="true"></span>
        <span class="adopt-orbit-node-core" aria-hidden="true"></span>
        <span class="adopt-orbit-node-label">Lv.${stageNo}</span>
      </button>`;
  }).join("");
  const stageRail = stages
    .map(
      (stage) => `
        <button
          type="button"
          class="adopt-stage-chip${previewStageNo === stage.stageNo ? " current" : ""}"
          data-stage-no="${stage.stageNo}"
          onclick="previewAdoptPet('${pet.code}', ${stage.stageNo})"
          style="--pet-accent:${theme.accent}; --pet-accent-soft:${theme.accentSoft};"
        >
          <div class="adopt-stage-chip-image">
            <img src="${resolveAssetUrl(stage.imageUrl)}" alt="${escapeHtml(stage.name || pet.name)}" loading="lazy" decoding="async" fetchpriority="low" onerror="this.src='images/logo.svg'">
          </div>
          <span>Lv.${stage.stageNo}</span>
        </button>`,
    )
    .join("");
  const previewImageUrl = getPetPreviewImage(pet, previewStageNo);
  const showcaseSize = isAdoptLite ? 400 : getShowcasePetImageSize();
  const highResPreviewUrl = resolvePetAssetVariantUrl(
    previewImageUrl,
    showcaseSize,
  );
  const fallbackPreviewUrl =
    resolvePetAssetVariantUrl(previewImageUrl, 400) || "images/logo.svg";
  detail.innerHTML = `
    <div class="adopt-stage-showcase${isAdoptLite ? " adopt-stage-showcase--lite" : ""}" style="--pet-accent:${theme.accent}; --pet-accent-soft:${theme.accentSoft}; --pet-glow:${theme.glow}; --pet-gradient:${theme.gradient};">
      <div class="adopt-stage-arena">
        ${isAdoptLite ? "" : '<div class="adopt-stage-sigils" aria-hidden="true"></div>'}
        ${runeMarks ? `<div class="adopt-stage-runes" aria-hidden="true">${runeMarks}</div>` : ""}
        ${particleDots ? `<div class="adopt-stage-particles" aria-hidden="true">${particleDots}</div>` : ""}
        ${isAdoptLite ? "" : '<div class="adopt-stage-trails" aria-hidden="true"></div>'}
        ${
          isAdoptLite
            ? ""
            : `<div class="adopt-stage-beam" aria-hidden="true" style="--beam-x:${selectedNodeX.toFixed(2)}%; --beam-y:${selectedNodeY.toFixed(2)}%; --beam-length:${beamLength.toFixed(2)}%; --beam-angle:${beamAngle.toFixed(2)}deg;"></div>
        <div class="adopt-stage-flash" aria-hidden="true"></div>
        <div class="adopt-stage-arc" aria-hidden="true"></div>`
        }
        ${orbitNodes}
        <div class="adopt-stage-core">
          <div class="adopt-stage-dais" aria-hidden="true">
            ${isAdoptLite ? "" : '<div class="adopt-stage-dais-grid"></div>'}
            ${energyShards ? `<div class="adopt-stage-shards">${energyShards}</div>` : ""}
          </div>
          <div class="adopt-detail-preview" data-transition-seed="${adoptModalState.transitionSeed}">
            <img class="${!isAdoptLite && adoptModalState.transitionSeed > 0 ? "evo-pet-shine" : ""}" data-stage-no="${previewStageNo}" src="${highResPreviewUrl}" alt="${escapeHtml(pet.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${escapeHtml(fallbackPreviewUrl)}'">
            ${
              !isAdoptLite && adoptModalState.transitionSeed > 0
                ? `<div class="evo-container">
                     <div class="evo-beam"></div>
                     <div class="evo-ring"></div>
                     <div class="evo-text">Lv.${selectedStage?.stageNo || previewStageNo} 进化形态</div>
                   </div>`
                : ""
            }
          </div>
          <div class="adopt-stage-core-caption">点击星轨节点查看不同进化形态</div>
        </div>
      </div>
      <div class="adopt-stage-info">
        <div class="adopt-detail-tags">
          <span class="adopt-pet-tag" style="background:${theme.accentSoft}; color:${theme.accent};">${escapeHtml(familyLabel)}</span>
          ${
            familyLabel !== categoryLabel
              ? `<span class="adopt-pet-tag adopt-pet-tag--subtle">${escapeHtml(categoryLabel)}</span>`
              : ""
          }
          <span class="adopt-pet-tag adopt-pet-tag--ghost">${pet.sourceType === "system" ? "系统图鉴" : "自定义图鉴"}</span>
        </div>
        <div class="adopt-stage-kicker">成长星轨</div>
        <h3>${escapeHtml(pet.name)}</h3>
        <div class="adopt-stage-current-name">${escapeHtml(selectedStage?.name || `${pet.name} · Lv.${previewStageNo}`)}</div>
        <p>${escapeHtml(
          pet.description ||
            `当前图鉴共配置 ${pet.stageCount || stages.length} 个成长阶段，点击星轨即可切换不同等级形态。`,
        )}</p>
        <div class="adopt-detail-stats">
          <div class="adopt-detail-stat" data-adopt-stat="current-level">
            <span>当前等级</span>
            <strong>Lv.${selectedStage?.stageNo || previewStageNo}</strong>
          </div>
          <div class="adopt-detail-stat" data-adopt-stat="need-score">
            <span>累计积分</span>
            <strong>${selectedStage?.needScoreTotal ?? 0}</strong>
          </div>
          <div class="adopt-detail-stat" data-adopt-stat="next-level">
            <span>下一阶段</span>
            <strong>${nextStage ? `Lv.${nextStage.stageNo}` : "已满级"}</strong>
          </div>
          <div class="adopt-detail-stat" data-adopt-stat="score-diff">
            <span>成长差值</span>
            <strong>${nextStage ? nextStage.needScoreTotal - (selectedStage?.needScoreTotal ?? 0) : 0}</strong>
          </div>
        </div>
        <div class="adopt-stage-hint">
          ${
            previousStage
              ? `上一形态 Lv.${previousStage.stageNo} 已解锁，下一形态 ${nextStage ? `Lv.${nextStage.stageNo}` : "已到终点"}.`
              : `当前是初始形态，下一形态 ${nextStage ? `Lv.${nextStage.stageNo}` : "已到终点"}.`
          }
        </div>
        <div class="adopt-stage-flavor">星轨节点会按成长顺序点亮，当前舞台展示的是选中等级的主形态。</div>
        ${
          adoptModalState.detailEntrySource === "adopt" && adoptTargetName
            ? `<button type="button" class="card-adopt-btn adopt-detail-confirm" onclick="confirmAdopt('${pet.code}')">
                确认领养 ${escapeHtml(pet.name)}
              </button>`
            : ""
        }
      </div>
    </div>
    <div class="adopt-evolution-header">全阶段总览</div>
    ${
      stages.length > 0
        ? `<div class="adopt-stage-rail">${stageRail}</div>`
        : '<div class="adopt-pet-empty">当前萌宠还没有配置进化阶段图片。</div>'
    }
  `;
  detail.dataset.petCode = String(pet.code);
  detail.dataset.stageNo = String(previewStageNo);
}

function renderAdoptPetModal() {
  renderAdoptFamilyTabs();
  renderAdoptPetGrid();
}

function petImg(s) {
  return petImgVariant(s, 400);
}

function reorderStudents() {
  if (studentSortMode === "score") {
    students.sort((a, b) => b.pts - a.pts);
  } else {
    students.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  }
}

function setStudentSortMode(mode) {
  studentSortMode = mode;
  document
    .getElementById("sortBtnScore")
    .classList.toggle("active", mode === "score");
  document
    .getElementById("sortBtnName")
    .classList.toggle("active", mode === "name");
  reorderStudents();
  renderStudentGrid();
  renderTodayRank();
  renderLeaderboardList();
}

function setGroupFilter(g) {
  groupFilter = g;
  const allEl = document.getElementById("gfAll");
  if (allEl) allEl.classList.toggle("active", g === null);
  updateGroupToolbar();
  if (!syncStudentGridChrome()) {
    renderStudentGrid();
  }
  schedulePanoramaLayout();
}

function getVisibleStudentIndices() {
  const out = [];
  students.forEach((s, i) => {
    if (groupFilter === null || s.group === groupFilter) out.push(i);
  });
  return out;
}

function clearStudentGridBatchClasses() {
  document.querySelectorAll("#studentGrid .student-card").forEach((card) => {
    card.classList.remove("batch-selected", "batch-mode");
  });
  const activeEl = document.activeElement;
  if (activeEl?.closest?.("#studentGrid")) {
    activeEl.blur();
  }
}

function buildStudentCardTopRight(student, selected = false) {
  if (!batchMode) {
    return `<span class="card-group-tag">${escapeHtml(student.groupName || getGroupLabel(student.group))}</span>`;
  }
  const safeName = String(student.name || "").replace(/'/g, "\\'");
  return `<input type="checkbox" class="card-batch-check" ${selected ? "checked" : ""} onclick="toggleBatchSelect('${safeName}', event)">`;
}

function studentCardDomKey(student) {
  if (!student) return "";
  return student.id != null ? `id:${student.id}` : `name:${student.name || ""}`;
}

function applyStudentCardRank(card, visiblePosition) {
  card.classList.remove("rank-1", "rank-2", "rank-3");
  let badge = card.querySelector(":scope > .card-rank-badge");
  if (visiblePosition < 0) {
    badge?.remove();
    return;
  }
  if (visiblePosition === 0) card.classList.add("rank-1");
  if (visiblePosition === 1) card.classList.add("rank-2");
  if (visiblePosition === 2) card.classList.add("rank-3");
  if (visiblePosition < 3) {
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "card-rank-badge";
      const topRight = card.querySelector(
        ":scope > .card-batch-check, :scope > .card-group-tag",
      );
      if (topRight?.nextSibling) {
        card.insertBefore(badge, topRight.nextSibling);
      } else {
        card.insertAdjacentElement("afterbegin", badge);
      }
    }
    badge.textContent = String(visiblePosition + 1);
  } else {
    badge?.remove();
  }
}

function syncStudentGridChrome() {
  const grid = document.getElementById("studentGrid");
  if (!grid || grid.childElementCount === 0) return false;
  const indices = getVisibleStudentIndices();
  const cards = Array.from(grid.querySelectorAll(".student-card"));
  if (cards.length !== students.length && cards.length !== indices.length)
    return false;

  const cardByKey = new Map();
  cards.forEach((card) => {
    const key =
      card.dataset.studentKey ||
      (card.dataset.studentId
        ? `id:${card.dataset.studentId}`
        : `name:${card.dataset.studentName || ""}`);
    if (key) cardByKey.set(key, card);
  });

  const visiblePositionByKey = new Map(
    indices.map((realIdx, visPos) => [
      studentCardDomKey(students[realIdx]),
      visPos,
    ]),
  );
  const sourceIndices =
    cards.length === students.length
      ? students.map((_, index) => index)
      : indices;

  for (const realIdx of sourceIndices) {
    const student = students[realIdx];
    if (!student) return false;
    const key = studentCardDomKey(student);
    const card = cardByKey.get(key);
    if (!card) return false;
    const selected = batchSelectedNames.has(student.name);
    const visiblePosition = visiblePositionByKey.has(key)
      ? visiblePositionByKey.get(key)
      : -1;
    const isHiddenByGroup = visiblePosition < 0;
    card.hidden = isHiddenByGroup;
    card.style.display = isHiddenByGroup ? "none" : "";
    card.dataset.studentKey = key;
    card.classList.toggle("batch-mode", batchMode);
    card.classList.toggle("batch-selected", batchMode && selected);
    applyStudentCardRank(card, visiblePosition);
    const currentTopRight = card.querySelector(
      ":scope > .card-batch-check, :scope > .card-group-tag",
    );
    const nextTopRight = buildStudentCardTopRight(student, selected);
    if (currentTopRight) {
      currentTopRight.outerHTML = nextTopRight;
    } else {
      card.insertAdjacentHTML("afterbegin", nextTopRight);
    }
  }
  runtimeState.studentGridRenderKey = studentGridRenderSignature(indices);
  return true;
}

function toggleBatchMode() {
  batchMode = !batchMode;
  const btn = document.getElementById("batchToggleBtn");
  const bar = document.getElementById("batchBar");
  if (btn) btn.classList.toggle("active", batchMode);
  if (bar) bar.classList.toggle("hide", !batchMode);
  if (!batchMode) {
    batchSelectedNames.clear();
    beginDisplayInputGuard(450);
  }
  updateBatchCount();
  if (!syncStudentGridChrome()) {
    renderStudentGrid({ force: true });
  }
}

function toggleBatchSelect(name, ev) {
  if (ev) ev.stopPropagation();
  if (batchSelectedNames.has(name)) batchSelectedNames.delete(name);
  else batchSelectedNames.add(name);
  updateBatchCount();
  if (!syncStudentGridChrome()) {
    renderStudentGrid();
  }
}

function clearBatchSelection() {
  batchSelectedNames.clear();
  updateBatchCount();
  if (!syncStudentGridChrome()) {
    renderStudentGrid();
  }
}

function selectAllBatchStudents() {
  if (!batchMode) return;
  getVisibleStudentIndices().forEach((idx) => {
    const name = students[idx]?.name;
    if (name) batchSelectedNames.add(name);
  });
  updateBatchCount();
  if (!syncStudentGridChrome()) {
    renderStudentGrid();
  }
}

function updateBatchCount() {
  const t = document.getElementById("batchCountText");
  if (t) t.textContent = "已选 " + batchSelectedNames.size + " 人";
}

function openGroupPointForFilter() {
  if (groupFilter === null) {
    showDisplayToast(
      "请先在「小组」中选择一个组，或使用「分组管理」为学生分组。",
    );
    return;
  }
  openPointModalGroup(groupFilter);
}

function openBatchPointModal() {
  if (batchSelectedNames.size === 0) {
    showDisplayToast("请先勾选学生。");
    return;
  }
  openPointModalBatch([...batchSelectedNames]);
}

async function openAdoptModal(studentName) {
  if (isDisplayAnimationLocked()) return;
  if (!ensureOperationUnlocked()) return;
  adoptTargetName = studentName;
  const t = document.getElementById("adoptModalTitle");
  if (t) t.textContent = studentName + " · 选择萌宠";
  adoptModalState.family = "all";
  adoptModalState.previewStageNo = 1;
  adoptModalState.detailEntrySource = "adopt";
  if (runtimeState.petCatalog.length === 0) {
    const petCatalog = await apiFetch("/display/pet-catalog").catch(
      () => adoptPetCatalog,
    );
    runtimeState.petCatalog = normalizePetCatalog(petCatalog || []);
  }
  const catalog = getFilteredAdoptCatalog();
  adoptModalState.selectedPetCode = catalog[0]?.code || null;
  renderAdoptPetModal();
  document.getElementById("adoptPetModal").classList.add("active");
}

function closeAdoptModal() {
  document.getElementById("adoptPetModal").classList.remove("active");
  closeAdoptPetDetailModal();
  adoptTargetName = null;
  adoptModalState.family = "all";
  adoptModalState.selectedPetCode = null;
  adoptModalState.previewStageNo = 1;
  adoptModalState.detailEntrySource = "adopt";
}

async function confirmAdopt(petCode) {
  if (!adoptTargetName) return;
  if (!ensureOperationUnlocked()) return;
  const s = students.find((x) => x.name === adoptTargetName);
  if (!s || s.hasPet !== false) return;
  if (!runtimeState.token || !runtimeState.classId) {
    showDisplayToast("请先登录教师账号");
    return;
  }
  const confirmed = await showConfirmModal({
    tone: "success",
    badge: "领养确认",
    icon: "fa-paw",
    title: "确认领养这只萌宠吗？",
    description: `${adoptTargetName} 将领养新的萌宠伙伴。\n确认后会立即写入当前班级数据。`,
    confirmText: "确认领养",
  });
  if (!confirmed) return;
  const selectedPet =
    getAdoptCatalog().find((pet) => pet.code === petCode) || null;
  const fallbackPetImageUrl = selectedPet
    ? getPetPreviewImage(selectedPet, 1)
    : null;
  try {
    await apiFetch(`/students/${s.id}/adopt-pet`, {
      method: "POST",
      body: JSON.stringify({
        classId: runtimeState.classId,
        petCode,
        sourceTerminal: "display",
      }),
    });
    closeAdoptModal();
    await refreshDisplayDataAfterMutation({
      actionLabel: "领养",
      failureMessage: "领养已提交，但界面刷新失败，请检查网络连接后重试。",
    });
    const refreshed = students.find(
      (student) => Number(student.id) === Number(s.id),
    );
    const adoptedStudent = {
      ...(refreshed || s),
      hasPet: true,
      petName: selectedPet?.name || refreshed?.petName || s.petName || "新萌宠",
      petImageUrl: refreshed?.petImageUrl || fallbackPetImageUrl,
      lv: refreshed?.lv ?? 1,
    };
    showGlobalPetAdoptAnimation(adoptedStudent);
  } catch (error) {
    showDisplayToast(error.message || "领养失败");
  }
}

function openGroupManageModal() {
  if (blockHomeroomOnlyOperation("分组管理")) return;
  groupManageDraft = {
    groups: getGroupOptions().map((option) => ({
      id: option.id,
      groupNo: Number(option.groupNo),
      name: option.name || `第${option.groupNo}组`,
      groupScore: Number(option.groupScore ?? 0),
    })),
    assignments: new Map(
      students.map((student, index) => [
        getStudentDraftKey(student, index),
        student.group == null ? null : Number(student.group),
      ]),
    ),
  };
  renderGroupManageDraft();
  document.getElementById("groupManageModal").classList.add("active");
  refreshGroupScoreData().catch(() => {});
}

function getGroupScoreRankingRows() {
  return getGroupOptions()
    .filter((group) => group.id != null)
    .map((group) => {
      const source = runtimeState.groups.find(
        (item) => Number(item.groupNo) === Number(group.groupNo),
      );
      return {
        id: group.id,
        groupNo: group.groupNo,
        name: group.name,
        groupScore: Number(source?.groupScore ?? 0),
      };
    })
    .sort((left, right) => {
      const scoreDiff = right.groupScore - left.groupScore;
      if (scoreDiff !== 0) return scoreDiff;
      return left.groupNo - right.groupNo;
    });
}

function renderGroupScoreRanking() {
  const list = document.getElementById("groupScoreRankingList");
  if (!list) return;
  const rows = getGroupScoreRankingRows();
  if (rows.length === 0) {
    list.innerHTML =
      '<div class="group-score-ranking-empty">暂无小组，请先新增小组</div>';
    return;
  }
  list.innerHTML = rows
    .map(
      (row, index) => `
        <div
          class="group-score-ranking-item"
          onclick="openGroupScoreAdjustModal(${row.id ? Number(row.id) : "null"})"
        >
          <span class="group-score-ranking-rank">${index + 1}</span>
          <span class="group-score-ranking-name">${escapeHtml(row.name)}</span>
          <span class="group-score-ranking-score">${row.groupScore > 0 ? "+" : ""}${row.groupScore}</span>
        </div>`,
    )
    .join("");
}

async function refreshGroupScoreData() {
  if (!runtimeState.token || !runtimeState.classId) return;
  const latestGroups = await apiFetch(
    `/classes/${runtimeState.classId}/groups`,
  ).catch(() => null);
  if (!Array.isArray(latestGroups)) return;
  runtimeState.groups = latestGroups.map((group) => ({
    ...group,
    groupScore: Number(group.groupScore ?? 0),
    groupTotalScore: Number(group.groupTotalScore ?? 0),
  }));
  renderGroupScoreRanking();
  renderTodayRank();
}

function populateGroupScoreRecordsFilterSelect(preselectedGroupId = null) {
  const select = document.getElementById("groupScoreRecordsFilterSelect");
  if (!select) return;
  const rows = getGroupScoreRankingRows();
  const selectedAll = preselectedGroupId == null ? " selected" : "";
  select.innerHTML =
    `<option value=""${selectedAll}>全部小组</option>` +
    rows
      .map((row) => {
        const selected =
          preselectedGroupId != null &&
          Number(preselectedGroupId) === Number(row.id)
            ? " selected"
            : "";
        return `<option value="${row.id}"${selected}>${escapeHtml(row.name)}</option>`;
      })
      .join("");
}

function formatGroupScoreRecordTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hour}:${minute}`;
}

function renderGroupScoreRecordsList(records) {
  const list = document.getElementById("groupScoreRecordsList");
  if (!list) return;
  if (!Array.isArray(records) || records.length === 0) {
    list.innerHTML =
      '<div class="group-score-records-empty">暂无积分记录</div>';
    return;
  }
  list.innerHTML = records
    .map((record) => {
      const delta = Number(record.scoreDelta || 0);
      const deltaClass = delta >= 0 ? "up" : "down";
      const deltaText = `${delta > 0 ? "+" : ""}${delta}`;
      return `
        <div class="group-score-record-item">
          <div class="group-score-record-item-hd">
            <span class="group-score-record-group">${escapeHtml(record.groupName || `第${record.groupNo}组`)}</span>
            <span class="group-score-record-delta ${deltaClass}">${deltaText}</span>
          </div>
          <div class="group-score-record-remark">${escapeHtml(record.remark || "—")}</div>
          <div class="group-score-record-meta">${escapeHtml(record.operatorName || "班主任")} · ${formatGroupScoreRecordTime(record.occurredAt || record.createdAt)}</div>
        </div>`;
    })
    .join("");
}

async function loadGroupScoreRecords() {
  if (!runtimeState.token || !runtimeState.classId) return;
  const filterSelect = document.getElementById("groupScoreRecordsFilterSelect");
  const classGroupId = filterSelect?.value ? Number(filterSelect.value) : null;
  const query = classGroupId ? `?classGroupId=${classGroupId}` : "";
  const list = document.getElementById("groupScoreRecordsList");
  if (list) {
    list.innerHTML = '<div class="group-score-records-empty">加载中...</div>';
  }
  try {
    const records = await apiFetch(
      `/classes/${runtimeState.classId}/group-scores/records${query}`,
    );
    renderGroupScoreRecordsList(Array.isArray(records) ? records : []);
  } catch (error) {
    if (list) {
      list.innerHTML = `<div class="group-score-records-empty">${escapeHtml(error.message || "加载失败")}</div>`;
    }
  }
}

function populateGroupScoreAdjustSelect(preselectedGroupId = null) {
  const select = document.getElementById("groupScoreAdjustGroupSelect");
  if (!select) return;
  const rows = getGroupScoreRankingRows();
  select.innerHTML = rows
    .map((row) => {
      const selected =
        preselectedGroupId != null &&
        Number(preselectedGroupId) === Number(row.id)
          ? " selected"
          : "";
      return `<option value="${row.id}"${selected}>${escapeHtml(row.name)}（${row.groupScore > 0 ? "+" : ""}${row.groupScore}）</option>`;
    })
    .join("");
}

async function openGroupScoreRecordsModal(preselectedGroupId = null) {
  if (blockHomeroomOnlyOperation("小组积分记录")) return;
  const rows = getGroupScoreRankingRows();
  if (rows.length === 0) {
    showDisplayToast("请先新增小组");
    return;
  }
  populateGroupScoreRecordsFilterSelect(preselectedGroupId);
  document.getElementById("groupScoreRecordsModal")?.classList.add("active");
  await loadGroupScoreRecords();
}

function closeGroupScoreRecordsModal() {
  document.getElementById("groupScoreRecordsModal")?.classList.remove("active");
}

function setGroupScoreAdjustError(message = "") {
  const el = document.getElementById("groupScoreAdjustError");
  if (!el) return;
  const text = String(message || "").trim();
  if (!text) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = text;
}

function openGroupScoreAdjustModal(preselectedGroupId = null) {
  if (blockHomeroomOnlyOperation("调整小组积分")) return;
  const rows = getGroupScoreRankingRows();
  if (rows.length === 0) {
    showDisplayToast("请先新增小组");
    return;
  }
  populateGroupScoreAdjustSelect(preselectedGroupId);
  const deltaInput = document.getElementById("groupScoreAdjustDeltaInput");
  const remarkInput = document.getElementById("groupScoreAdjustRemarkInput");
  if (deltaInput) deltaInput.value = "";
  if (remarkInput) remarkInput.value = "";
  setGroupScoreAdjustError("");
  const overlay = document.getElementById("groupScoreAdjustModal");
  overlay?.classList.add("active");
  if (
    document.getElementById("groupManageModal")?.classList.contains("active")
  ) {
    overlay?.classList.add("modal-panel-overlay-stacked");
  } else {
    overlay?.classList.remove("modal-panel-overlay-stacked");
  }
  window.setTimeout(() => remarkInput?.focus(), 0);
}

function closeGroupScoreAdjustModal() {
  const overlay = document.getElementById("groupScoreAdjustModal");
  overlay?.classList.remove("active", "modal-panel-overlay-stacked");
  setGroupScoreAdjustError("");
}

async function submitGroupScoreAdjust() {
  setGroupScoreAdjustError("");
  if (!runtimeState.token || !runtimeState.classId) {
    const message = "请先登录班主任账号";
    setGroupScoreAdjustError(message);
    showDisplayToast(message);
    return;
  }
  if (!isHomeroomOfCurrentClass()) {
    const message = "小组积分调整暂由班主任负责，请联系本班班主任处理";
    setGroupScoreAdjustError(message);
    showDisplayToast(message);
    return;
  }
  const select = document.getElementById("groupScoreAdjustGroupSelect");
  const deltaInput = document.getElementById("groupScoreAdjustDeltaInput");
  const remarkInput = document.getElementById("groupScoreAdjustRemarkInput");
  const classGroupId = Number(select?.value);
  const scoreDelta = parseInt(String(deltaInput?.value ?? "").trim(), 10);
  const remark = String(remarkInput?.value || "").trim();
  if (!Number.isInteger(classGroupId) || classGroupId <= 0) {
    const message = "请选择小组";
    setGroupScoreAdjustError(message);
    showDisplayToast(message);
    return;
  }
  if (!Number.isInteger(scoreDelta) || scoreDelta === 0) {
    const message = "分值须为非 0 整数";
    setGroupScoreAdjustError(message);
    showDisplayToast(message);
    deltaInput?.focus();
    return;
  }
  if (!remark) {
    const message = "请填写事由";
    setGroupScoreAdjustError(message);
    showDisplayToast(message);
    remarkInput?.focus();
    return;
  }
  const submitBtn = document.querySelector(
    "#groupScoreAdjustModal .group-score-adjust-actions .confirm-modal-btn.primary",
  );
  if (submitBtn?.disabled) return;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "提交中...";
  }
  try {
    await apiFetch(`/classes/${runtimeState.classId}/group-scores/adjust`, {
      method: "POST",
      body: JSON.stringify({
        classGroupId,
        scoreDelta,
        remark,
        sourceTerminal: "display",
      }),
    });
    closeGroupScoreAdjustModal();
    showDisplayToast("小组积分已更新");
    await refreshGroupScoreData();
    if (
      document
        .getElementById("groupScoreRecordsModal")
        ?.classList.contains("active")
    ) {
      await loadGroupScoreRecords();
    }
  } catch (error) {
    const message = error.message || "调整小组积分失败";
    setGroupScoreAdjustError(message);
    showDisplayToast(message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "确认调整";
    }
  }
}

async function resetAllGroupScores() {
  if (blockHomeroomOnlyOperation("小组积分清零")) return;
  if (!runtimeState.token || !runtimeState.classId) {
    showDisplayToast("请先登录班主任账号");
    return;
  }
  const rows = getGroupScoreRankingRows();
  if (rows.every((row) => Number(row.groupScore) === 0)) {
    showDisplayToast("当前各小组积分均为 0");
    return;
  }
  const confirmed = await showConfirmModal({
    tone: "warn",
    badge: "清零确认",
    icon: "fa-eraser",
    title: "确认清零全部小组积分？",
    description:
      "此操作会将本班所有小组的当前积分归零，且不可撤销。\n累计正向加分记录仍会保留。",
    confirmText: "确认清零",
  });
  if (!confirmed) return;
  try {
    await apiFetch(`/classes/${runtimeState.classId}/group-scores/reset`, {
      method: "POST",
      body: JSON.stringify({
        sourceTerminal: "display",
      }),
    });
    showDisplayToast("全部小组积分已清零");
    await refreshGroupScoreData();
  } catch (error) {
    showDisplayToast(error.message || "小组积分清零失败");
  }
}

async function closeGroupManageModal() {
  if (groupManageDraft && isGroupManageDraftDirty()) {
    await persistGroupManageChanges();
  }
  document.getElementById("groupManageModal").classList.remove("active");
  groupManageDraft = null;
  renderStudentGrid();
}

function getStudentDraftKey(student, index = 0) {
  return String(student.id ?? `${student.name}-${index}`);
}

function renderGroupManageDraft() {
  if (!groupManageDraft) return;
  const list = document.getElementById("groupManageList");
  const tbody = document.querySelector("#groupManageTable tbody");
  const summary = document.getElementById("groupManageSummary");
  if (!list || !tbody) return;
  const groups = groupManageDraft.groups.sort((a, b) => a.groupNo - b.groupNo);
  if (summary) summary.textContent = `${groups.length} 个小组`;

  list.innerHTML = groups
    .map(
      (group) => `
        <div class="group-manage-row">
          <span class="group-manage-no">第${group.groupNo}组</span>
          <input
            class="group-manage-name-input"
            value="${escapeHtml(group.name)}"
            maxlength="20"
            onchange="renameGroupManageGroup(${group.groupNo}, this.value)"
            oninput="renameGroupManageGroup(${group.groupNo}, this.value, true)"
          />
          <button
            type="button"
            class="group-manage-delete-btn"
            onclick="deleteGroupManageGroup(${group.groupNo})"
          >
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>`,
    )
    .join("");

  const optionsHtml =
    '<option value="">未分组</option>' +
    groups
      .map(
        (group) =>
          `<option value="${group.groupNo}">${escapeHtml(group.name)}</option>`,
      )
      .join("");
  tbody.innerHTML = students
    .map((student, index) => {
      const key = getStudentDraftKey(student, index);
      const current = groupManageDraft.assignments.get(key);
      return `<tr>
        <td>${escapeHtml(student.name)}</td>
        <td>
          <select data-student-key="${escapeHtml(key)}" onchange="setStudentGroupByKey(this.dataset.studentKey, this.value ? Number(this.value) : null)">
            ${optionsHtml}
          </select>
        </td>
      </tr>`;
    })
    .join("");
  tbody.querySelectorAll("select[data-student-key]").forEach((select) => {
    const current = groupManageDraft.assignments.get(select.dataset.studentKey);
    select.value = current == null ? "" : String(current);
  });
}

async function addGroupManageGroup() {
  if (!groupManageDraft) return;
  const used = new Set(
    groupManageDraft.groups.map((group) => Number(group.groupNo)),
  );
  let groupNo = 1;
  while (used.has(groupNo)) groupNo += 1;
  groupManageDraft.groups.push({
    id: null,
    groupNo,
    name: `第${groupNo}组`,
    groupScore: 0,
  });
  renderGroupManageDraft();
  await persistGroupManageChanges("新增小组失败");
}

async function renameGroupManageGroup(groupNo, name, silent = false) {
  if (!groupManageDraft) return;
  const group = groupManageDraft.groups.find(
    (item) => item.groupNo === Number(groupNo),
  );
  if (!group) return;
  group.name = String(name || "").trim() || `第${group.groupNo}组`;
  if (!silent) renderGroupManageDraft();
  if (silent) {
    scheduleGroupManagePersist("修改小组名称失败");
  } else {
    await persistGroupManageChanges("修改小组名称失败");
  }
}

async function deleteGroupManageGroup(groupNo) {
  if (!groupManageDraft) return;
  const targetNo = Number(groupNo);
  const targetGroup = groupManageDraft.groups.find(
    (group) => Number(group.groupNo) === targetNo,
  );
  const groupName = targetGroup?.name || `第${targetNo}组`;
  const assignedCount = Array.from(
    groupManageDraft.assignments.values(),
  ).filter((value) => Number(value) === targetNo).length;
  const description =
    assignedCount > 0
      ? `当前有 ${assignedCount} 名学生在该小组。确认删除后，这些学生会变为未分组。`
      : `确认删除「${groupName}」吗？删除后该小组将从列表中移除。`;
  const confirmed = await showConfirmModal({
    tone: "warn",
    badge: "删除小组",
    icon: "fa-layer-group",
    title: "确认删除这个小组吗？",
    description,
    confirmText: "删除小组",
  });
  if (!confirmed) return;
  groupManageDraft.groups = groupManageDraft.groups.filter(
    (group) => group.groupNo !== targetNo,
  );
  groupManageDraft.assignments.forEach((value, key) => {
    if (Number(value) === targetNo) {
      groupManageDraft.assignments.set(key, null);
    }
  });
  renderGroupManageDraft();
  await persistGroupManageChanges("删除小组失败");
}

async function setStudentGroupByKey(key, g) {
  if (!groupManageDraft) return;
  groupManageDraft.assignments.set(String(key), g == null ? null : Number(g));
  applyGroupManageDraftToStudents();
  renderStudentGrid();
  await persistGroupManageChanges("调整学生分组失败");
}

function buildGroupManagePayload() {
  if (!groupManageDraft) return [];
  const groupNos = new Set(
    groupManageDraft.groups.map((group) => Number(group.groupNo)),
  );
  return groupManageDraft.groups.map((option) => ({
    id: option.id,
    groupNo: Number(option.groupNo),
    name: option.name || `第${option.groupNo}组`,
    studentIds: students
      .filter((student, index) => {
        const assignedGroupNo = groupManageDraft.assignments.get(
          getStudentDraftKey(student, index),
        );
        return (
          assignedGroupNo != null &&
          Number(assignedGroupNo) === Number(option.groupNo) &&
          groupNos.has(Number(option.groupNo))
        );
      })
      .map((student) => student.id)
      .filter((id) => id != null),
  }));
}

function isGroupManageDraftDirty() {
  if (!groupManageDraft) return false;

  const currentGroups = getGroupOptions()
    .map((group) => ({
      id: group.id == null ? null : Number(group.id),
      groupNo: Number(group.groupNo),
      name: String(group.name || `第${group.groupNo}组`).trim(),
    }))
    .sort((a, b) => a.groupNo - b.groupNo);

  const draftGroups = groupManageDraft.groups
    .map((group) => ({
      id: group.id == null ? null : Number(group.id),
      groupNo: Number(group.groupNo),
      name: String(group.name || `第${group.groupNo}组`).trim(),
    }))
    .sort((a, b) => a.groupNo - b.groupNo);

  if (JSON.stringify(currentGroups) !== JSON.stringify(draftGroups)) {
    return true;
  }

  const currentAssignments = students
    .map((student, index) => [
      getStudentDraftKey(student, index),
      student.group == null ? null : Number(student.group),
    ])
    .sort((left, right) => String(left[0]).localeCompare(String(right[0])));

  const draftAssignments = Array.from(groupManageDraft.assignments.entries())
    .map(([key, value]) => [String(key), value == null ? null : Number(value)])
    .sort((left, right) => String(left[0]).localeCompare(String(right[0])));

  return JSON.stringify(currentAssignments) !== JSON.stringify(draftAssignments);
}

function applyGroupManageDraftToStudents() {
  if (!groupManageDraft) return;
  students.forEach((student, index) => {
    const assignedGroupNo = groupManageDraft.assignments.get(
      getStudentDraftKey(student, index),
    );
    const group = groupManageDraft.groups.find(
      (item) => Number(item.groupNo) === Number(assignedGroupNo),
    );
    student.group = group ? group.groupNo : null;
    student.groupName = group ? group.name : null;
  });
}

async function persistGroupManageChanges(
  errorMessage = "保存分组失败",
  options = {},
) {
  const renderAfter = options.renderAfter !== false;
  window.clearTimeout(groupManagePersistTimer);
  if (!runtimeState.token || !runtimeState.classId) {
    showDisplayToast("请先请班主任登录后再保存分组");
    return;
  }
  if (!isHomeroomOfCurrentClass()) {
    showDisplayToast("分组调整暂由班主任负责，请联系本班班主任处理");
    return;
  }
  if (!groupManageDraft || groupManageDraft.groups.length === 0) {
    if (!groupManageDraft) return;
  }

  groupManagePersistPromise = groupManagePersistPromise
    .catch(() => {})
    .then(async () => {
      const groupsPayload = buildGroupManagePayload();
      applyGroupManageDraftToStudents();
      await apiFetch(`/classes/${runtimeState.classId}/groups/students`, {
        method: "PUT",
        body: JSON.stringify({
          groups: groupsPayload,
        }),
      });
      const latestGroups = await apiFetch(
        `/classes/${runtimeState.classId}/groups`,
      ).catch(() => null);
      if (!groupManageDraft) return;
      if (Array.isArray(latestGroups)) {
        runtimeState.groups = latestGroups;
        const idByGroupNo = new Map(
          latestGroups.map((group) => [
            Number(group.groupNo),
            {
              id: group.id || null,
              groupScore: Number(group.groupScore ?? 0),
            },
          ]),
        );
        groupManageDraft.groups.forEach((group) => {
          const latest = idByGroupNo.get(Number(group.groupNo));
          group.id = latest?.id || group.id || null;
          group.groupScore = Number(latest?.groupScore ?? group.groupScore ?? 0);
        });
      } else {
        runtimeState.groups = groupManageDraft.groups.map((group) => {
          const current = runtimeState.groups.find(
            (item) => Number(item.groupNo) === Number(group.groupNo),
          );
          return {
            ...group,
            groupScore: Number(group.groupScore ?? current?.groupScore ?? 0),
            groupTotalScore: Number(current?.groupTotalScore ?? 0),
            groupLastScoreAt: current?.groupLastScoreAt ?? null,
          };
        });
      }
      updateGroupToolbar();
      if (renderAfter) {
        renderStudentGrid();
        renderGroupManageDraft();
        renderGroupScoreRanking();
        renderTodayRank();
      }
    });
  return groupManagePersistPromise.catch((error) => {
    showDisplayToast(error.message || errorMessage);
  });
}

function scheduleGroupManagePersist(errorMessage = "保存分组失败") {
  window.clearTimeout(groupManagePersistTimer);
  void persistGroupManageChanges(errorMessage, { renderAfter: false });
}

function lvCategory(lv) {
  if (lv >= 4) return "high";
  if (lv >= 2) return "mid";
  return "low";
}

function studentGridRenderSignature(indices) {
  return [
    studentSortMode,
    groupFilter ?? "all",
    batchMode ? "batch" : "view",
    [...batchSelectedNames].sort().join(","),
    indices
      .map((realIdx, visPos) => {
        const s = students[realIdx] || {};
        return [
          visPos,
          s.id ?? "",
          s.name ?? "",
          s.hasPet === false ? "seed" : "pet",
          s.petImageUrl || s.avatarUrl || s.petId || "",
          s.petName || "",
          s.petNickname || "",
          s.lv ?? "",
          s.pts ?? "",
          s.medals ?? "",
          s.group ?? "",
          s.groupName ?? "",
        ].join(":");
      })
      .join("|"),
  ].join("::");
}

function buildAccessoryDecoAttrs(deco) {
  const code = resolveDecoCode(deco);
  return code ? `data-deco-code="${escapeHtml(code)}"` : "";
}

function resolveDecoCode(deco) {
  if (!deco) return "";
  if (deco.code) return deco.code;
  const url = `${deco.imageUrl || ""} ${deco.previewUrl || ""}`;
  const match = url.match(/\/([a-z0-9_]+)\.png/i);
  return match ? match[1] : "";
}

/* ========== 饰品定位：三种通用模式（behind / head / canvas） ========== */

/**
 * 每种宠物的头顶锚点（在 1024 画布中的 Y 百分比）
 * 仅 head 模式头饰使用；behind / canvas 模式不依赖 per-pet 微调
 */
const PET_ANCHOR_MAP = {
  "051": { headTopY: 15 },
  "052": { headTopY: 20 },
  "053": { headTopY: 22 },
  "054": { headTopY: 18 },
  "055": { headTopY: 28 },
  "056": { headTopY: 17 },
  "057": { headTopY: 18 },
  "058": { headTopY: 20 },
  "059": { headTopY: 16 },
  "060": { headTopY: 20 },
  "061": { headTopY: 20 },
  "062": { headTopY: 20 },
  "063": { headTopY: 20 },
  "064": { headTopY: 20 },
  "065": { headTopY: 19 },
  "066": { headTopY: 20 },
  "067": { headTopY: 22 },
  "068": { headTopY: 19 },
  "069": { headTopY: 18 },
  "070": { headTopY: 18 },
  "071": { headTopY: 22 },
  "072": { headTopY: 26 },
  "073": { headTopY: 17 },
  "074": { headTopY: 20 },
  "075": { headTopY: 20 },
  "076": { headTopY: 18 },
  "077": { headTopY: 28 },
  "078": { headTopY: 20 },
  "079": { headTopY: 18 },
  "080": { headTopY: 18 },
  "081": { headTopY: 20 },
  "082": { headTopY: 16 },
  "083": { headTopY: 22 },
  "084": { headTopY: 18 },
  "085": { headTopY: 18 },
};
const PET_ANCHOR_DEFAULT = { headTopY: 20 };

/**
 * 饰品定位配置
 * mode:
 *   behind - 全画布对称装饰，置于萌宠后方，不做 per-pet 偏移（翅膀、光环）
 *   head   - 头顶头饰，按 headTopY 锚点微调（帽子）
 *   canvas - 固定画布坐标偏移（已弃用）
 */
const ACC_PLACEMENT = {
  acc_campus_cap: { mode: "head", stickerCY: 47.4, scale: 1, nudgeY: -4 },
  acc_star_wings: { mode: "behind", canvasY: 6, scale: 1 },
  acc_cloud_wings: { mode: "behind", canvasY: 6, scale: 1 },
  acc_soft_halo: {
    mode: "head",
    stickerCY: 44,
    scale: 1.05,
    nudgeY: -4,
    behindPet: true,
  },
  acc_theme_children_day_2026: {
    mode: "head",
    stickerCY: 48,
    scale: 1.02,
    nudgeY: 14,
    offsetX: -26,
  },
  acc_theme_mini_adventure_2026: {
    mode: "canvas",
    canvasX: 3,
    canvasY: 4,
    scale: 0.7,
    transformOrigin: "left top",
  },
  acc_theme_arcane_library_2026: {
    mode: "canvas",
    canvasX: 4,
    canvasY: 6,
    scale: 0.68,
    transformOrigin: "left top",
  },
  acc_theme_ninja_flame_2026: {
    mode: "canvas",
    canvasX: -3,
    canvasY: 5,
    scale: 0.68,
    transformOrigin: "right top",
  },
};

/**
 * 从 student 对象中提取宠物种类编号（3位字符串如 "053"）
 */
function extractPetSpeciesCode(student) {
  const url = student?.petImageUrl || "";
  const m = url.match(/(?:^|\/)(\d{3})_/);
  if (m) return m[1];
  if (student?.petId) return String(student.petId).padStart(3, "0");
  return null;
}

/**
 * 计算饰品变换参数（返回 {x, y, scale}）
 */
function computeDecoTransform(accCode, petSpeciesCode) {
  const acc = ACC_PLACEMENT[accCode];
  if (!acc) return { x: 0, y: 0, scale: 1 };
  if (acc.mode === "behind") {
    return {
      x: acc.canvasX ?? 0,
      y: (acc.canvasY ?? 0) + (acc.nudgeY ?? 0),
      scale: acc.scale ?? 1,
    };
  }
  if (acc.mode === "canvas") {
    return {
      x: acc.canvasX ?? 0,
      y: acc.canvasY ?? 0,
      scale: acc.scale ?? 1,
    };
  }
  if (acc.mode === "head") {
    const anchor =
      (petSpeciesCode && PET_ANCHOR_MAP[petSpeciesCode]) || PET_ANCHOR_DEFAULT;
    const offsetY = -(acc.stickerCY - anchor.headTopY) + (acc.nudgeY ?? 0);
    return {
      x: acc.offsetX || 0,
      y: +offsetY.toFixed(1),
      scale: acc.scale ?? 1,
    };
  }
  return { x: 0, y: 0, scale: 1 };
}

/**
 * 将偏移与缩放应用到饰品 img 元素上（设置 CSS 自定义属性）
 */
function applyDecoOffset(el, accCode, petSpeciesCode) {
  if (!el) return;
  const acc = ACC_PLACEMENT[accCode];
  if (!acc) {
    el.removeAttribute("data-deco-mode");
    el.style.removeProperty("--deco-offset-x");
    el.style.removeProperty("--deco-offset-y");
    el.style.removeProperty("--deco-scale");
    el.style.removeProperty("--deco-transform-origin");
    return;
  }
  const mode =
    acc.mode === "head" && acc.behindPet ? "head-behind" : acc.mode;
  el.dataset.decoMode = mode;
  const { x, y, scale } = computeDecoTransform(accCode, petSpeciesCode);
  el.style.setProperty("--deco-offset-x", x + "%");
  el.style.setProperty("--deco-offset-y", y + "%");
  el.style.setProperty("--deco-scale", String(scale));
  if (acc.transformOrigin) {
    el.style.setProperty("--deco-transform-origin", acc.transformOrigin);
  } else {
    el.style.removeProperty("--deco-transform-origin");
  }
}

/** 设置装饰层图片（背景/边框）；无有效 URL 时移除 src，避免浏览器把空 src 解析成页面地址 */
function resolveDecoPreviewSize() {
  // 预览区约 260px，与列表缩略图同用 400 规格，复用浏览器缓存
  return 400;
}

const decoAssetWarmCache = new Set();

function warmDecoAssetCache(decos, size = 400) {
  if (!Array.isArray(decos)) return;
  decos.forEach((deco) => {
    const url = resolveDecoAssetUrl(deco, size);
    if (!url || decoAssetWarmCache.has(url)) return;
    decoAssetWarmCache.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  });
}

/* ========== 图片预加载缓存 ========== */

const imageWarmCache = new Set();
let imageWarmQueue = [];
let imageWarmTimer = null;

function drainImageWarmQueue() {
  imageWarmTimer = null;
  const batch = imageWarmQueue.splice(0, 6);
  if (!batch.length) return;
  batch.forEach((url) => {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  });
  if (imageWarmQueue.length > 0) {
    imageWarmTimer = setTimeout(drainImageWarmQueue, 80);
  }
}

function warmImageCache(urls) {
  if (!Array.isArray(urls)) return;
  urls.forEach((url) => {
    if (!url || url === "images/logo.svg" || imageWarmCache.has(url)) return;
    imageWarmCache.add(url);
    imageWarmQueue.push(url);
  });
  if (!imageWarmTimer && imageWarmQueue.length > 0) {
    imageWarmTimer = setTimeout(drainImageWarmQueue, 16);
  }
}

function warmStudentPetImages(studentList) {
  if (!Array.isArray(studentList) || !studentList.length) return;
  const urls = [];
  studentList.forEach((s) => {
    const url = petImg(s);
    if (url) urls.push(url);
    if (Array.isArray(s.equippedDecorations) && s.equippedDecorations.length) {
      s.equippedDecorations.forEach((deco) => {
        const decoUrl = resolveDecoAssetUrl(deco, 400);
        if (decoUrl) urls.push(decoUrl);
      });
    }
  });
  warmImageCache(urls);
}

function setDecoLayerElement(el, deco, size = 1024) {
  if (!el) return;
  const url = deco ? resolveDecoAssetUrl(deco, size) : "";
  if (!url) {
    el.removeAttribute("src");
    el.removeAttribute("data-deco-src");
    return;
  }
  if (el.dataset.decoSrc === url) return;
  el.dataset.decoSrc = url;
  el.src = url;
}

function syncAccessoryDecoElement(
  el,
  deco,
  size = 1024,
  petSpeciesCode = null,
) {
  if (!el) return;
  if (!deco?.imageUrl && !deco?.previewUrl) {
    el.removeAttribute("src");
    el.removeAttribute("data-deco-src");
    el.removeAttribute("data-deco-code");
    el.removeAttribute("data-deco-mode");
    el.style.removeProperty("--deco-offset-x");
    el.style.removeProperty("--deco-offset-y");
    el.style.removeProperty("--deco-scale");
    return;
  }
  const url = resolveDecoAssetUrl(deco, size);
  if (el.dataset.decoSrc !== url) {
    el.dataset.decoSrc = url;
    el.src = url;
  }
  const code = resolveDecoCode(deco);
  if (code) el.dataset.decoCode = code;
  else el.removeAttribute("data-deco-code");
  applyDecoOffset(el, code, petSpeciesCode);
}

function buildCardDecoLayers(s) {
  const decos = s.equippedDecorations;
  if (!decos || decos.length === 0) return "";
  let html = "";
  const backdrop = decos.find((d) => d.type === THEME_BACKDROP_TYPE);
  const bg = decos.find((d) => d.type === "background");
  const frame = decos.find((d) => d.type === "frame");
  const backdropUrl = backdrop ? resolveDecoAssetUrl(backdrop, 400) : "";
  const bgUrl = !backdrop && bg ? resolveDecoAssetUrl(bg, 400) : "";
  const frameUrl = !backdrop && frame ? resolveDecoAssetUrl(frame, 400) : "";
  if (backdropUrl) {
    html += `<img class="card-pet-deco-bg card-pet-deco-backdrop" src="${backdropUrl}" alt="" loading="lazy" decoding="async" fetchpriority="low" onerror="this.style.display='none'">`;
  } else {
    if (bgUrl) {
      html += `<img class="card-pet-deco-bg" src="${bgUrl}" alt="" loading="lazy" decoding="async" fetchpriority="low" onerror="this.style.display='none'">`;
    }
    if (frameUrl) {
      html += `<img class="card-pet-deco-frame" src="${frameUrl}" alt="" loading="lazy" decoding="async" fetchpriority="low" onerror="this.style.display='none'">`;
    }
  }
  return html;
}

/* ========== 渲染学生卡片 ========== */
let renderStudentGridTimer = null;
function renderStudentGrid(options = {}) {
  if (options.force) {
    window.clearTimeout(renderStudentGridTimer);
    renderStudentGridTimer = null;
    performRenderStudentGrid(options);
    return;
  }
  window.clearTimeout(renderStudentGridTimer);
  const debounceMs = getDisplayEffectBudget().gridRenderDebounce ?? 80;
  renderStudentGridTimer = window.setTimeout(() => {
    renderStudentGridTimer = null;
    performRenderStudentGrid(options);
  }, debounceMs);
}

function performRenderStudentGrid(options = {}) {
  const grid = document.getElementById("studentGrid");
  if (!grid) return;
  const indices = getVisibleStudentIndices();
  const renderKey = studentGridRenderSignature(indices);
  if (
    !options.force &&
    runtimeState.studentGridRenderKey === renderKey &&
    grid.childElementCount > 0
  ) {
    initPetPkInteractions();
    return;
  }
  runtimeState.studentGridRenderKey = renderKey;
  const escName = (n) =>
    String(n || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");
  const visiblePositionByRealIdx = new Map(
    indices.map((realIdx, visPos) => [realIdx, visPos]),
  );

  const innerHtmlStr = students
    .map((s, realIdx) => {
      const visPos = visiblePositionByRealIdx.has(realIdx)
        ? visiblePositionByRealIdx.get(realIdx)
        : -1;
      const hiddenAttr = visPos < 0 ? " hidden" : "";
      const hiddenStyle = visPos < 0 ? ' style="display:none;"' : "";
      const rankClass =
        visPos === 0
          ? "rank-1"
          : visPos === 1
            ? "rank-2"
            : visPos === 2
              ? "rank-3"
              : "";
      const badge =
        visPos >= 0 && visPos < 3 && studentSortMode === "score"
          ? `<span class="card-rank-badge">${visPos + 1}</span>`
          : "";
      const noPet = s.hasPet === false;
      const batchOn = batchMode;
      const sel = batchSelectedNames.has(s.name);
      const groupLabel = s.groupName || getGroupLabel(s.group);
      const topRight = batchOn
        ? `<input type="checkbox" class="card-batch-check" ${sel ? "checked" : ""} onclick="toggleBatchSelect('${s.name.replace(/'/g, "\\'")}', event)">`
        : (groupLabel !== "未分组" ? `<span class="card-group-tag">${escapeHtml(groupLabel)}</span>` : "");
      const noPetClass = noPet ? " no-pet" : "";
      const batchCls = batchOn && sel ? " batch-selected" : "";
      const modeCls = batchOn ? " batch-mode" : "";
      const qn = s.name.replace(/'/g, "\\'");
      const imageLoading = visPos >= 0 && visPos < 8 ? "eager" : "lazy";
      const imagePriority = visPos >= 0 && visPos < 8 ? "high" : "low";
      const decoLayers = !noPet ? buildCardDecoLayers(s) : "";
      const petDisplayLabel = resolvePetDisplayName(s);
      const customName = resolveCardCustomName(s);
      const cardNameHtml = `<span class="card-student-name">${escapeHtml(s.name)}</span>${customName ? `<span class="card-custom-name">（${escapeHtml(customName)}）</span>` : ""}`;
      const avatarBlock = noPet
        ? `<button type="button" class="card-pet-trigger card-pet-trigger--seed" onclick="event.stopPropagation();openAdoptModal('${qn}')"><img class="card-pet-img card-pet-img--seed" src="${petImg(s)}" alt="待孕育星种" loading="${imageLoading}" decoding="async" fetchpriority="${imagePriority}" draggable="false" onerror="this.src='images/logo.svg'"><span class="card-nameplate-placeholder">待孕育</span></button>`
        : decoLayers
          ? `<button type="button" class="card-pet-trigger" data-student-name="${escName(s.name)}"><div class="card-pet-deco-wrap">${decoLayers}<img class="card-pet-img" src="${petImg(s)}" alt="${escapeHtml(petDisplayLabel)}" loading="${imageLoading}" decoding="async" fetchpriority="${imagePriority}" draggable="false" onerror="this.src='images/logo.svg'"></div></button>`
          : `<button type="button" class="card-pet-trigger" data-student-name="${escName(s.name)}"><img class="card-pet-img" src="${petImg(s)}" alt="${escapeHtml(petDisplayLabel)}" loading="${imageLoading}" decoding="async" fetchpriority="${imagePriority}" draggable="false" onerror="this.src='images/logo.svg'"></button>`;
      return `
      <div class="student-card ${rankClass}${noPetClass}${batchCls}${modeCls}"${hiddenAttr}${hiddenStyle} data-student-key="${studentCardDomKey(s)}" data-student-id="${s.id ?? ""}" data-student-name="${escName(s.name)}">
        ${topRight}
        ${badge}
        ${avatarBlock}
        <div class="card-name">${cardNameHtml}</div>
        <div class="card-info">
          <span class="card-level" data-lv="${lvCategory(s.lv)}">Lv.${s.lv}</span>
          <span class="card-points">${s.pts}分</span>
          ${s.medals > 0 ? `<span class="card-medals"><i class="fa-solid fa-medal" aria-hidden="true"></i>×${s.medals}</span>` : ""}
        </div>
      </div>`;
    })
    .join("");

  if (window.morphdom) {
    const wrapper = document.createElement("div");
    wrapper.className = "student-grid";
    wrapper.id = "studentGrid";
    wrapper.innerHTML = innerHtmlStr;
    morphdom(grid, wrapper, {
      getNodeKey: function (node) {
        if (node.id) return node.id;
        if (node.classList?.contains("student-card")) {
          return node.getAttribute("data-student-key") || "";
        }
        return "";
      },
      onBeforeElUpdated: function (fromEl, toEl) {
        if (
          fromEl.nodeType === 1 &&
          toEl.nodeType === 1 &&
          fromEl.classList?.contains("student-card") &&
          toEl.classList?.contains("student-card")
        ) {
          if (fromEl.classList.contains("interact-card")) {
            toEl.classList.add("interact-card");
          }
          if (fromEl.dataset.studentTapReady === "1") {
            toEl.dataset.studentTapReady = "1";
          }
          return true;
        }
        if (fromEl.isEqualNode && fromEl.isEqualNode(toEl)) {
          return false;
        }
        return true;
      },
    });
  } else {
    grid.innerHTML = innerHtmlStr;
  }
  if (!batchMode) {
    clearStudentGridBatchClasses();
  }
  resetAllStudentCardVisualStates();
  document
    .querySelectorAll("#studentGrid .student-card")
    .forEach(bindStudentCardTapInteraction);
  initPetPkInteractions();
}

let pkInteractionsInitialized = false;
function initPetPkInteractions() {
  if (pkInteractionsInitialized) return;
  const grid = document.getElementById("studentGrid");
  if (!grid) return;
  pkInteractionsInitialized = true;

  grid.addEventListener("click", (event) => {
    if (batchMode) return;
    const trigger = event.target.closest(".card-pet-trigger");
    if (!trigger) return;
    if (trigger.classList.contains("card-pet-trigger--seed")) return;
    event.preventDefault();
    event.stopPropagation();
    if (trigger.dataset.pkSuppressClick === "1") {
      trigger.dataset.pkSuppressClick = "0";
      return;
    }
    const studentName = trigger.dataset.studentName || "";
    if (studentName) {
      openPetProfileByName(studentName);
    }
  });

  grid.addEventListener("pointerdown", (event) => {
    if (batchMode) return;
    if (isClassroomGridScrolling()) return;
    const trigger = event.target.closest(".card-pet-trigger");
    if (!trigger) return;
    if (trigger.classList.contains("card-pet-trigger--seed")) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    startPetPkDrag(trigger, event);
  });

  grid.addEventListener("dragstart", (event) => {
    if (event.target.closest(".card-pet-trigger")) {
      event.preventDefault();
    }
  });
}

function clearPetPkHoverTarget() {
  if (petPkState.hoverTargetCard) {
    resetStudentCardVisualState(petPkState.hoverTargetCard);
    petPkState.hoverTargetCard = null;
  }
  if (petPkState.targetLockEl) {
    petPkState.targetLockEl.classList.remove("active");
  }
  petPkState.lastHoverName = "";
}

function clearPetPkSource() {
  if (petPkState.sourceCard) {
    resetStudentCardVisualState(petPkState.sourceCard);
  }
  petPkState.sourceTrigger?.classList.remove("pk-drag-origin");
  petPkState.sourceCard = null;
  petPkState.sourceTrigger = null;
}

function removePetPkProxy() {
  if (petPkState.proxyFrame) {
    window.cancelAnimationFrame(petPkState.proxyFrame);
    petPkState.proxyFrame = 0;
  }
  petPkState.proxyEl?.remove();
  petPkState.proxyEl = null;
}

function ensurePetPkDragAtmosphere() {
  if (petPkState.dragAtmosphereEl) return petPkState.dragAtmosphereEl;
  const atmosphere = document.createElement("div");
  atmosphere.className = "pet-pk-drag-atmosphere";
  atmosphere.innerHTML = `
    <span class="pet-pk-drag-bolt bolt-1"></span>
    <span class="pet-pk-drag-bolt bolt-2"></span>
    <span class="pet-pk-drag-bolt bolt-3"></span>
    <span class="pet-pk-drag-bolt bolt-4"></span>
  `;
  document.body.appendChild(atmosphere);
  petPkState.dragAtmosphereEl = atmosphere;
  return atmosphere;
}

function updatePetPkDragAtmosphere(clientX, clientY, locked = false) {
  if (isLowSpecMode()) return;
  const atmosphere = ensurePetPkDragAtmosphere();
  atmosphere.style.setProperty("--pk-x", `${Math.round(clientX)}px`);
  atmosphere.style.setProperty("--pk-y", `${Math.round(clientY)}px`);
  atmosphere.classList.add("active");
  atmosphere.classList.toggle("locked", Boolean(locked));
}

function clearPetPkDragAtmosphere() {
  if (!petPkState.dragAtmosphereEl) return;
  petPkState.dragAtmosphereEl.classList.remove("active", "locked");
}

function finishPetPkDrag() {
  if (typeof petPkState.cleanup === "function") {
    petPkState.cleanup();
  }
  petPkState.cleanup = null;
  clearPetPkDragAtmosphere();
  clearPetPkHoverTarget();
  clearPetPkSource();
  removePetPkProxy();
}

function playPkTone(kind = "hover") {
  if (document.body.classList.contains("low-spec")) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!petPkState.audioCtx) {
    petPkState.audioCtx = new AudioCtx();
  }
  const ctx = petPkState.audioCtx;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = kind === "impact" ? "triangle" : "sine";
  osc.frequency.setValueAtTime(kind === "impact" ? 220 : 540, now);
  osc.frequency.exponentialRampToValueAtTime(
    kind === "impact" ? 92 : 760,
    now + (kind === "impact" ? 0.18 : 0.08),
  );
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(
    kind === "impact" ? 0.045 : 0.018,
    now + 0.015,
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + (kind === "impact" ? 0.22 : 0.1),
  );
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + (kind === "impact" ? 0.24 : 0.12));
}

function triggerCardPkImpact(card) {
  if (!card || isLowSpecMode()) return;
  card.classList.remove("pk-impact-burst");
  void card.offsetWidth;
  card.classList.add("pk-impact-burst");
  window.setTimeout(() => {
    card.classList.remove("pk-impact-burst");
  }, 460);
}

function clearPetPkCountdownTimers() {
  petPkState.countdownTimers.forEach((timer) => window.clearTimeout(timer));
  petPkState.countdownTimers = [];
}

function animatePkCountText(nextValue) {
  const countEl = document.getElementById("petPkCount");
  if (!countEl) return;
  countEl.classList.remove("animate");
  void countEl.offsetWidth;
  countEl.textContent = nextValue;
  countEl.classList.add("animate");
}

function ensurePetPkTargetLock() {
  if (petPkState.targetLockEl) return petPkState.targetLockEl;
  const lock = document.createElement("div");
  lock.className = "pet-pk-target-lock";
  lock.innerHTML = `
    <span class="pet-pk-target-lock-corner tl"></span>
    <span class="pet-pk-target-lock-corner tr"></span>
    <span class="pet-pk-target-lock-corner bl"></span>
    <span class="pet-pk-target-lock-corner br"></span>
  `;
  document.body.appendChild(lock);
  petPkState.targetLockEl = lock;
  return lock;
}

function updatePetPkTargetLock(card, cachedRect) {
  const lock = ensurePetPkTargetLock();
  const rect = cachedRect || card.getBoundingClientRect();
  lock.style.width = `${rect.width + 12}px`;
  lock.style.height = `${rect.height + 12}px`;
  lock.style.transform = `translate3d(${rect.left - 6}px, ${rect.top - 6}px, 0) scale(1)`;
  lock.classList.add("active");
}

function getStudentByCard(card) {
  const studentName = card?.getAttribute?.("data-student-name") || "";
  return students.find((item) => item.name === studentName) || null;
}

function updatePetPkHoverTarget(sourceCard, clientX, clientY, cachedRects) {
  let validTarget = null;
  if (cachedRects) {
    const hit = cachedRects.find((item) => {
      return (
        clientX >= item.rect.left &&
        clientX <= item.rect.right &&
        clientY >= item.rect.top &&
        clientY <= item.rect.bottom
      );
    });
    if (hit) validTarget = hit.card;
  } else {
    const visibleCards = Array.from(
      document.querySelectorAll(".page.active .student-card:not([hidden])"),
    );
    const geometryTarget =
      visibleCards.find((card) => {
        if (card === sourceCard || !card.querySelector(".card-pet-trigger"))
          return false;
        const rect = card.getBoundingClientRect();
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      }) || null;
    const stack = geometryTarget
      ? []
      : document.elementsFromPoint(clientX, clientY);
    const targetCard =
      geometryTarget ||
      stack
        .find((node) => {
          if (!(node instanceof Element)) return false;
          const card = node.closest?.(".student-card");
          return card && card !== sourceCard;
        })
        ?.closest?.(".student-card") ||
      null;
    validTarget =
      targetCard &&
      targetCard !== sourceCard &&
      targetCard.querySelector(".card-pet-trigger")
        ? targetCard
        : null;
  }

  if (petPkState.hoverTargetCard === validTarget) {
    return validTarget;
  }

  clearPetPkHoverTarget();

  if (validTarget) {
    validTarget.classList.add("pk-drop-ready");
    petPkState.hoverTargetCard = validTarget;
    const matched = cachedRects?.find((item) => item.card === validTarget);
    updatePetPkTargetLock(validTarget, matched ? matched.rect : null);
    const hoverName = validTarget.getAttribute("data-student-name") || "";
    if (hoverName && hoverName !== petPkState.lastHoverName) {
      petPkState.lastHoverName = hoverName;
      playPkTone("hover");
    }
  }

  return validTarget;
}

function schedulePetPkProxyTransform() {
  if (petPkState.proxyFrame) return;
  petPkState.proxyFrame = window.requestAnimationFrame(() => {
    petPkState.proxyFrame = 0;
    const proxy = petPkState.proxyEl;
    if (!proxy) return;
    const scale = petPkState.proxyLocked ? 1.16 : 1.04;
    const rotate = petPkState.proxyLocked ? 0 : -4;
    proxy.classList.toggle("locked", petPkState.proxyLocked);
    proxy.style.transform = `translate3d(${petPkState.proxyX}px, ${petPkState.proxyY}px, 0) scale(${scale}) rotate(${rotate}deg)`;
  });
}

function ensurePetPkProxy(trigger, clientX, clientY, locked = false) {
  petPkState.proxyX = clientX;
  petPkState.proxyY = clientY;
  petPkState.proxyLocked = Boolean(locked);
  if (petPkState.proxyEl) {
    schedulePetPkProxyTransform();
    return;
  }
  const image = trigger.querySelector(".card-pet-img");
  const proxy = document.createElement("div");
  proxy.className = "pet-pk-drag-proxy";
  proxy.innerHTML = `<img src="${image?.getAttribute("src") || "images/logo.svg"}" alt="">`;
  document.body.appendChild(proxy);
  petPkState.proxyEl = proxy;
  schedulePetPkProxyTransform();
}

function getPetPkPower(student) {
  const pts = Number(student?.pts || 0);
  const lv = Number(student?.lv || 0);
  const medals = Number(student?.medals || 0);
  return pts + lv * 36 + medals * 18;
}

function getPetPkResult(sourceStudent, targetStudent) {
  const sourcePower = getPetPkPower(sourceStudent);
  const targetPower = getPetPkPower(targetStudent);
  const sourceMeta = `${sourceStudent.name}：${sourcePower} 战力`;
  const targetMeta = `${targetStudent.name}：${targetPower} 战力`;

  if (sourcePower === targetPower) {
    return {
      side: "draw",
      title: "势均力敌",
      name: "平局",
      meta: `${sourceMeta} · ${targetMeta}`,
    };
  }

  const sourceWins = sourcePower > targetPower;
  const winner = sourceWins ? sourceStudent : targetStudent;
  const winnerPower = sourceWins ? sourcePower : targetPower;
  const loserPower = sourceWins ? targetPower : sourcePower;
  return {
    side: sourceWins ? "left" : "right",
    title: "胜者诞生",
    name: winner.name || "胜利方",
    meta: `${winner.petName || "萌宠"} 以 ${winnerPower} 战力胜出 · 领先 ${winnerPower - loserPower}`,
  };
}

function getPetPkStudentLevel(student) {
  return Number(
    student?.lv ?? student?.currentPetLevel ?? student?.pet?.currentLevel ?? 0,
  );
}

function getPetPkStudentScore(student) {
  return Number(student?.pts ?? student?.currentScore ?? 0);
}

function getPetPkSceneDeco(student) {
  const decos = Array.isArray(student?.equippedDecorations)
    ? student.equippedDecorations
    : [];
  const backdrop = decos.find((deco) => deco.type === THEME_BACKDROP_TYPE);
  const background = decos.find((deco) => deco.type === "background");
  const deco = backdrop || background || null;
  if (!deco) return null;
  const size = isHighQualityDisplay() ? 1024 : 400;
  const url = resolveDecoAssetUrl(deco, size);
  if (!url) return null;
  return {
    student,
    deco,
    url,
    priority: backdrop ? 2 : 1,
  };
}

function comparePetPkSceneCandidates(a, b) {
  if (!a && !b) return 0;
  if (a && !b) return 1;
  if (!a && b) return -1;
  if (a.priority !== b.priority) return a.priority - b.priority;

  const levelDiff =
    getPetPkStudentLevel(a.student) - getPetPkStudentLevel(b.student);
  if (levelDiff !== 0) return levelDiff;

  const scoreDiff =
    getPetPkStudentScore(a.student) - getPetPkStudentScore(b.student);
  if (scoreDiff !== 0) return scoreDiff;

  return 0;
}

function selectPetPkSceneDeco(sourceStudent, targetStudent) {
  const source = getPetPkSceneDeco(sourceStudent);
  const target = getPetPkSceneDeco(targetStudent);
  return comparePetPkSceneCandidates(source, target) >= 0 ? source : target;
}

function ensurePetPkSceneBackground(overlay) {
  let img = overlay.querySelector(".pet-pk-scene-bg");
  if (!img) {
    img = document.createElement("img");
    img.className = "pet-pk-scene-bg";
    img.alt = "";
    img.decoding = "async";
    img.loading = "eager";
    overlay.insertBefore(img, overlay.firstChild);
  }

  let mask = overlay.querySelector(".pet-pk-scene-vignette");
  if (!mask) {
    mask = document.createElement("div");
    mask.className = "pet-pk-scene-vignette";
    overlay.insertBefore(mask, img.nextSibling);
  }

  return img;
}

function clearPetPkSceneBackground(overlay) {
  if (!overlay) return;
  overlay.classList.remove(
    "has-scene-bg",
    "scene-owner-left",
    "scene-owner-right",
  );
  overlay.removeAttribute("data-pk-scene-owner");
}

function applyPetPkSceneBackground(overlay, sourceStudent, targetStudent) {
  if (!overlay) return;
  const scene = selectPetPkSceneDeco(sourceStudent, targetStudent);
  if (!scene) {
    clearPetPkSceneBackground(overlay);
    return;
  }
  const img = ensurePetPkSceneBackground(overlay);
  img.onerror = () => {
    img.onerror = null;
    clearPetPkSceneBackground(overlay);
  };
  if (img.getAttribute("src") !== scene.url) {
    img.src = scene.url;
  }
  overlay.dataset.pkSceneOwner = scene.student?.name || "";
  /* 标记场景归属方向：source=left, target=right */
  overlay.classList.remove("scene-owner-left", "scene-owner-right");
  if (scene.student === sourceStudent) {
    overlay.classList.add("scene-owner-left");
  } else {
    overlay.classList.add("scene-owner-right");
  }
  overlay.classList.add("has-scene-bg");
}

/** 构建萌宠 PK 头像的装饰层 URL（背景/边框） */
function getPetPkAvatarDecoUrl(student, type) {
  const decos = Array.isArray(student?.equippedDecorations)
    ? student.equippedDecorations
    : [];
  const backdrop = decos.find((d) => d.type === THEME_BACKDROP_TYPE);
  if (type === "bg") {
    const bg = backdrop || decos.find((d) => d.type === "background");
    return bg ? resolveDecoAssetUrl(bg, 400) : "";
  }
  if (type === "frame") {
    /* backdrop 模式下隐藏独立边框 */
    if (backdrop) return "";
    const frame = decos.find((d) => d.type === "frame");
    return frame ? resolveDecoAssetUrl(frame, 400) : "";
  }
  return "";
}

/** 将萌宠个人装饰注入 PK 头像 shell */
function applyPetPkAvatarDeco(shell, student) {
  if (!shell) return;
  clearPetPkAvatarDeco(shell);
  const bgUrl = getPetPkAvatarDecoUrl(student, "bg");
  const frameUrl = getPetPkAvatarDecoUrl(student, "frame");
  if (bgUrl) {
    const bgImg = document.createElement("img");
    bgImg.className = "pet-pk-deco-bg";
    bgImg.src = bgUrl;
    bgImg.alt = "";
    bgImg.decoding = "async";
    bgImg.onerror = () => {
      bgImg.style.display = "none";
    };
    shell.insertBefore(bgImg, shell.firstChild);
  }
  if (frameUrl) {
    const frameImg = document.createElement("img");
    frameImg.className = "pet-pk-deco-frame";
    frameImg.src = frameUrl;
    frameImg.alt = "";
    frameImg.decoding = "async";
    frameImg.onerror = () => {
      frameImg.style.display = "none";
    };
    shell.appendChild(frameImg);
  }
  if (bgUrl || frameUrl) {
    shell.classList.add("has-deco");
  }
}

/** 清除 PK 头像 shell 内的装饰层 */
function clearPetPkAvatarDeco(shell) {
  if (!shell) return;
  shell.querySelectorAll(".pet-pk-deco-bg, .pet-pk-deco-frame").forEach(
    (el) => el.remove(),
  );
  shell.classList.remove("has-deco");
}

function playPetPkAnimation(sourceStudent, targetStudent) {
  const overlay = document.getElementById("petPkOverlay");
  const leftImg = document.getElementById("petPkLeftImg");
  const rightImg = document.getElementById("petPkRightImg");
  const leftStudent = document.getElementById("petPkLeftStudent");
  const rightStudent = document.getElementById("petPkRightStudent");
  const badgeEl = document.getElementById("petPkBadge");
  const countEl = document.getElementById("petPkCount");
  const resultEl = document.getElementById("petPkResult");
  const resultTitleEl = document.getElementById("petPkResultTitle");
  const resultNameEl = document.getElementById("petPkResultName");
  const resultMetaEl = document.getElementById("petPkResultMeta");

  if (
    !overlay ||
    !leftImg ||
    !rightImg ||
    !leftStudent ||
    !rightStudent ||
    !badgeEl ||
    !countEl ||
    !resultEl ||
    !resultTitleEl ||
    !resultNameEl ||
    !resultMetaEl
  ) {
    return;
  }

  clearPetPkCountdownTimers();
  window.clearTimeout(petPkState.overlayTimer);
  petPkState.overlayTimer = null;
  if (overlay.classList.contains("active")) {
    endDisplayAnimationGuard();
  }
  overlay.classList.remove("active");
  overlay.classList.remove("countdown-active");
  overlay.classList.remove("impact-active");
  overlay.classList.remove("climax-active");
  overlay.classList.remove("result-active");
  overlay.classList.remove("winner-left");
  overlay.classList.remove("winner-right");
  overlay.classList.remove("winner-draw");
  clearPetPkSceneBackground(overlay);
  clearPetPkAvatarDeco(
    document.getElementById("petPkLeft")?.querySelector(".pet-pk-avatar-shell"),
  );
  clearPetPkAvatarDeco(
    document.getElementById("petPkRight")?.querySelector(".pet-pk-avatar-shell"),
  );
  void overlay.offsetWidth;

  leftImg.onerror = () => {
    leftImg.onerror = null;
    leftImg.src = "images/logo.svg";
  };
  rightImg.onerror = () => {
    rightImg.onerror = null;
    rightImg.src = "images/logo.svg";
  };
  leftImg.src = petImg(sourceStudent);
  leftImg.alt = sourceStudent.petName || `${sourceStudent.name}的萌宠`;
  rightImg.src = petImg(targetStudent);
  rightImg.alt = targetStudent.petName || `${targetStudent.name}的萌宠`;
  leftStudent.textContent = sourceStudent.name || "";
  rightStudent.textContent = targetStudent.name || "";

  /* 注入萌宠个人装饰到 PK 头像 */
  applyPetPkAvatarDeco(
    document.getElementById("petPkLeft")?.querySelector(".pet-pk-avatar-shell"),
    sourceStudent,
  );
  applyPetPkAvatarDeco(
    document.getElementById("petPkRight")?.querySelector(".pet-pk-avatar-shell"),
    targetStudent,
  );

  const result = getPetPkResult(sourceStudent, targetStudent);
  resultTitleEl.textContent = result.title;
  resultNameEl.textContent = result.name;
  resultMetaEl.textContent = result.meta;
  resultEl.setAttribute("aria-hidden", "true");
  applyPetPkSceneBackground(overlay, sourceStudent, targetStudent);

  overlay.classList.add("active");
  overlay.classList.add("countdown-active");
  beginDisplayAnimationGuard();
  badgeEl.textContent = "PK";
  animatePkCountText("3");
  playPkTone("hover");

  petPkState.countdownTimers.push(
    window.setTimeout(() => {
      animatePkCountText("2");
      playPkTone("hover");
    }, 650),
  );
  petPkState.countdownTimers.push(
    window.setTimeout(() => {
      animatePkCountText("1");
      playPkTone("hover");
    }, 1300),
  );
  petPkState.countdownTimers.push(
    window.setTimeout(() => {
      badgeEl.textContent = "PK";
      animatePkCountText("GO");
      overlay.classList.remove("countdown-active");
      overlay.classList.add("impact-active");
      playPkTone("impact");
    }, 1950),
  );
  petPkState.countdownTimers.push(
    window.setTimeout(() => {
      overlay.classList.add("climax-active");
      playPkTone("impact");
    }, 3000),
  );
  petPkState.countdownTimers.push(
    window.setTimeout(() => {
      overlay.classList.remove("countdown-active");
      overlay.classList.remove("impact-active");
      overlay.classList.remove("climax-active");
      overlay.classList.add("result-active");
      overlay.classList.add(`winner-${result.side}`);
      resultEl.setAttribute("aria-hidden", "false");
      playPkTone(result.side === "draw" ? "hover" : "impact");
    }, 4300),
  );
  petPkState.overlayTimer = window.setTimeout(() => {
    overlay.classList.remove("active");
    overlay.classList.remove("countdown-active");
    overlay.classList.remove("impact-active");
    overlay.classList.remove("climax-active");
    overlay.classList.remove("result-active");
    overlay.classList.remove("winner-left");
    overlay.classList.remove("winner-right");
    overlay.classList.remove("winner-draw");
    clearPetPkSceneBackground(overlay);
    clearPetPkAvatarDeco(
      document.getElementById("petPkLeft")?.querySelector(".pet-pk-avatar-shell"),
    );
    clearPetPkAvatarDeco(
      document.getElementById("petPkRight")?.querySelector(".pet-pk-avatar-shell"),
    );
    resultEl.setAttribute("aria-hidden", "true");
    petPkState.overlayTimer = null;
    endDisplayAnimationGuard();
  }, 6900);
}

function startPetPkDrag(trigger, event) {
  if (isDisplayAnimationLocked()) return;
  if (isClassroomGridScrolling()) return;
  if (petPkState.cleanup) {
    finishPetPkDrag();
  }

  const sourceCard = trigger.closest(".student-card");
  const studentName = trigger.dataset.studentName || "";
  if (!sourceCard || !studentName) return;

  const sourceStudent = students.find((item) => item.name === studentName);
  if (!sourceStudent || sourceStudent.hasPet === false) return;

  let moved = false;
  let dragStarted = false;
  let lastClientX = event.clientX;
  let lastClientY = event.clientY;
  const startX = event.clientX;
  const startY = event.clientY;
  const touchProfile = getTouchInteractionProfile();
  const moveThreshold = touchProfile.petPkSlop;

  petPkState.sourceCard = sourceCard;
  petPkState.sourceTrigger = trigger;

  const visibleCards = Array.from(
    document.querySelectorAll(".page.active .student-card:not([hidden])"),
  );
  const cachedRects = visibleCards
    .filter(
      (card) => card !== sourceCard && card.querySelector(".card-pet-trigger"),
    )
    .map((card) => ({
      card,
      rect: card.getBoundingClientRect(),
    }));

  const onMove = (moveEvent) => {
    if (isClassroomGridScrolling()) {
      finishPetPkDrag();
      return;
    }
    const clientX = moveEvent.clientX;
    const clientY = moveEvent.clientY;
    lastClientX = clientX;
    lastClientY = clientY;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    const distance = Math.hypot(deltaX, deltaY);

    if (!dragStarted && distance < moveThreshold) {
      return;
    }

    dragStarted = true;
    moved = true;
    moveEvent.preventDefault();
    trigger.dataset.pkSuppressClick = "1";
    sourceCard.classList.add("pk-source-active");
    trigger.classList.add("pk-drag-origin");

    const targetCard = updatePetPkHoverTarget(
      sourceCard,
      clientX,
      clientY,
      cachedRects,
    );
    updatePetPkDragAtmosphere(clientX, clientY, Boolean(targetCard));
    ensurePetPkProxy(trigger, clientX, clientY, Boolean(targetCard));
  };

  const onEnd = () => {
    const targetCard = petPkState.hoverTargetCard;
    const targetName = targetCard?.getAttribute("data-student-name") || "";
    const targetStudent = students.find((item) => item.name === targetName);
    const releaseDistance = Math.hypot(
      lastClientX - startX,
      lastClientY - startY,
    );

    finishPetPkDrag();

    if (
      moved &&
      dragStarted &&
      releaseDistance >= moveThreshold &&
      targetCard &&
      targetStudent &&
      targetStudent.hasPet !== false
    ) {
      playPetPkAnimation(sourceStudent, targetStudent);
    }
  };

  const cleanup = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onEnd);
    document.removeEventListener("pointercancel", onEnd);
  };

  petPkState.cleanup = cleanup;
  document.addEventListener("pointermove", onMove, { passive: false });
  document.addEventListener("pointerup", onEnd);
  document.addEventListener("pointercancel", onEnd);
}

function queuePetUpgradeAnimations(upgrades) {
  if (!Array.isArray(upgrades) || upgrades.length === 0) return;
  const deduped = new Map(
    (Array.isArray(runtimeState.pendingPetUpgradeAnimations)
      ? runtimeState.pendingPetUpgradeAnimations
      : []
    ).map((item) => [Number(item.studentId), item]),
  );
  upgrades.forEach((item) => {
    const studentId = Number(item?.studentId);
    const afterLevel = Number(item?.afterLevel || 0);
    if (!Number.isFinite(studentId) || studentId <= 0) return;
    deduped.set(studentId, {
      studentId,
      afterLevel:
        Number.isFinite(afterLevel) && afterLevel > 0 ? afterLevel : null,
    });
  });
  runtimeState.pendingPetUpgradeAnimations = Array.from(deduped.values());
}

function playPendingPetUpgradeAnimations() {
  if (runtimeState.petUpgradePlaying) return;
  const pending = Array.isArray(runtimeState.pendingPetUpgradeAnimations)
    ? runtimeState.pendingPetUpgradeAnimations
    : [];
  if (pending.length === 0) return;

  const nextItem = pending.shift();
  runtimeState.pendingPetUpgradeAnimations = pending;
  if (!nextItem) return;

  const localStudent = students.find(
    (student) => Number(student.id) === Number(nextItem.studentId),
  );
  if (!localStudent) {
    playPendingPetUpgradeAnimations();
    return;
  }

  runtimeState.petUpgradePlaying = true;
  showGlobalPetUpgradeAnimation(localStudent, nextItem.afterLevel, () => {
    runtimeState.petUpgradePlaying = false;
    if (runtimeState.pendingPetUpgradeAnimations.length > 0) {
      playPendingPetUpgradeAnimations();
    }
  });
}

function showGlobalPetUpgradeAnimation(student, afterLevel, onComplete) {
  const overlay = document.getElementById("petUpgradeOverlay");
  const avatar = document.getElementById("petUpgradeAvatar");
  const seed = document.getElementById("petUpgradeSeed");
  const text = document.getElementById("petUpgradeText");
  const studentName = document.getElementById("petUpgradeStudent");
  const canvas = document.getElementById("petUpgradeParticles");
  const energyContainer = document.getElementById("petUpgradeEnergyLines");
  if (!overlay || !avatar || !text || !studentName || !student) {
    if (typeof onComplete === "function") onComplete();
    return;
  }

  /* 重置动画状态 */
  upgradeAnimationSession += 1;
  const upgradeSession = upgradeAnimationSession;
  if (overlay.classList.contains("active")) {
    endDisplayAnimationGuard();
  }
  overlay.classList.remove("active");
  overlay.classList.remove("adopt-mode");
  if (energyContainer) energyContainer.innerHTML = "";
  void overlay.offsetWidth;

  /* 提取并设置专属色彩属性 */
  let petH = null,
    petS = null,
    petL = null;
  if (window.PET_THEME_COLORS) {
    let extractId = null;

    // 优先从图片 URL 中提取前缀数字（如 "/assets/pets/400/056_森歌獭_5.png" -> "056"）
    // 因为色彩映射字典 (pet-colors.js) 是根据图片文件名生成的，文件名对应的数字最准确
    if (student.petImageUrl) {
      const match = student.petImageUrl.match(/(?:^|\/)(\d{3})_/);
      if (match) {
        extractId = match[1];
      }
    }

    // 如果从 URL 提取失败，再退而求其次使用学生对象的 petId
    if (!extractId && student.petId) {
      extractId = String(student.petId).padStart(3, "0");
    }

    if (extractId && window.PET_THEME_COLORS[extractId]) {
      const theme = window.PET_THEME_COLORS[extractId];
      petH = theme.h;
      petS = theme.s;
      petL = theme.l;
    }
  }

  if (petH !== null) {
    overlay.style.setProperty("--pet-theme-h", petH);
    overlay.style.setProperty("--pet-theme-s", `${petS}%`);
    overlay.style.setProperty("--pet-theme-l", `${petL}%`);
    overlay.style.setProperty(
      "--pet-theme-energy",
      `hsla(${petH}, ${petS}%, ${Math.min(100, petL + 20)}%, 0.9)`,
    );
    overlay.style.setProperty(
      "--pet-theme-energy-fade",
      `hsla(${petH}, ${petS}%, ${Math.min(100, petL + 20)}%, 0)`,
    );
  } else {
    overlay.style.removeProperty("--pet-theme-h");
    overlay.style.removeProperty("--pet-theme-s");
    overlay.style.removeProperty("--pet-theme-l");
    overlay.style.removeProperty("--pet-theme-energy");
    overlay.style.removeProperty("--pet-theme-energy-fade");
  }

  /* 设置内容 */
  const showcaseImageSize = getShowcasePetImageSize();
  if (seed) {
    seed.src = resolvePetAssetVariantUrl(
      STAR_SEED_IMAGE_URL,
      showcaseImageSize,
    );
  }
  avatar.src = petImgVariant(student, showcaseImageSize);
  avatar.onerror = () => {
    avatar.onerror = null;
    avatar.src = petImgVariant(student, 400);
  };
  avatar.alt = `${resolvePetDisplayName(student)} 升级形态`;
  text.textContent = `Lv.${afterLevel || student.lv || 1} 发育进化`;
  studentName.textContent = `${student.name || "该学生"} 的 ${resolvePetDisplayName(student)} 升级了`;

  /* 激活动画 */
  overlay.classList.add("active");
  beginDisplayAnimationGuard();
  if (isLowSpecMode()) {
    overlay.classList.add("pet-upgrade-lite");
  } else {
    overlay.classList.remove("pet-upgrade-lite");
  }

  /* 启动Canvas粒子爆炸效果 */
  let particleRAF = null;
  if (document.body.classList.contains("low-spec")) {
    const stageEl = overlay.querySelector(".pet-upgrade-stage");
    const stageRect = stageEl?.getBoundingClientRect();
    const cx = stageRect
      ? stageRect.left + stageRect.width / 2
      : window.innerWidth / 2;
    const cy = stageRect
      ? stageRect.top + stageRect.height / 2
      : window.innerHeight / 2;
    spawnCssParticles(cx, cy, petH);
  } else if (canvas) {
    const ctx = canvas.getContext("2d");
    const effectBudget = getDisplayEffectBudget();
    const canvasScale = effectBudget.upgradeCanvasScale;
    const w = (canvas.width = Math.max(
      1,
      Math.round(window.innerWidth * canvasScale),
    ));
    const h = (canvas.height = Math.max(
      1,
      Math.round(window.innerHeight * canvasScale),
    ));
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const cx = w / 2;
    const cy = h / 2;
    const particles = [];
    const startTime = performance.now();

    // 识别宠物题材流派 (用于生成不同的专属粒子物理与绘制形态)
    let archetype = "default";
    const petNameStr = student.petName || "";
    const isZodiac =
      student.category === "zodiac" ||
      (student.petId && Number(student.petId) >= 74);

    if (/机|电|雷|极|兽/.test(petNameStr)) {
      archetype = "electric";
    } else if (/潮汐|海|豚|泡泡|露|鲨|獭/.test(petNameStr)) {
      archetype = "water";
    } else if (/烈焰|炎|火|牛|曜/.test(petNameStr)) {
      archetype = "fire";
    } else if (/星|月|云|砂|尘|粉/.test(petNameStr)) {
      archetype = "star";
    } else if (isZodiac || /宝|喵|兔|猫|绒|幼/.test(petNameStr)) {
      archetype = "cute";
    }
    console.log("[Animation Debug] Resolved archetype:", archetype);

    // Canvas绘制辅助函数
    function drawStar(c, px, py, spikes, outerRadius, innerRadius) {
      let rot = (Math.PI / 2) * 3;
      let x = px;
      let y = py;
      let step = Math.PI / spikes;
      c.moveTo(px, py - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = px + Math.cos(rot) * outerRadius;
        y = py + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;
        x = px + Math.cos(rot) * innerRadius;
        y = py + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.closePath();
    }

    function drawHeart(c, px, py, size) {
      c.moveTo(px, py + size / 4);
      c.quadraticCurveTo(px, py - size / 2, px - size / 2, py - size / 2);
      c.quadraticCurveTo(px - size, py - size / 2, px - size, py + size / 4);
      c.quadraticCurveTo(px - size, py + size, px, py + size * 1.5);
      c.quadraticCurveTo(px + size, py + size, px + size, py + size / 4);
      c.quadraticCurveTo(
        px + size,
        py - size / 2,
        px + size / 2,
        py - size / 2,
      );
      c.quadraticCurveTo(px, py - size / 2, px, py + size / 4);
      c.closePath();
    }

    function drawParticleShape(c, p, size, alpha, elapsed) {
      c.beginPath();
      if (archetype === "star") {
        // 闪烁的十字星
        drawStar(c, p.x, p.y, 4, size * 2.2, size * 0.5);
        c.fillStyle = p.color + alpha.toFixed(3) + ")";
        c.fill();
      } else if (archetype === "cute") {
        // 萌宠心形
        drawHeart(c, p.x, p.y, size * 1.3);
        c.fillStyle = p.color + alpha.toFixed(3) + ")";
        c.fill();
      } else if (archetype === "electric") {
        // 闪电线段
        c.strokeStyle = p.color + alpha.toFixed(3) + ")";
        c.lineWidth = size * 0.8;
        c.moveTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
        c.lineTo(p.x, p.y);
        c.stroke();
      } else if (archetype === "water") {
        // 水系气泡
        c.arc(p.x, p.y, size * 1.4, 0, Math.PI * 2);
        c.strokeStyle = p.color + (alpha * 0.85).toFixed(3) + ")";
        c.lineWidth = 1.2 * canvasScale;
        c.stroke();

        c.beginPath();
        c.arc(p.x - size * 0.4, p.y - size * 0.4, size * 0.35, 0, Math.PI * 2);
        c.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        c.fill();
      } else {
        // 默认圆形
        c.arc(p.x, p.y, size, 0, Math.PI * 2);
        c.fillStyle = p.color + alpha.toFixed(3) + ")";
        c.fill();
      }
    }

    /* 爆发粒子 — 从中心向外迸射 */
    const burstCount = effectBudget.upgradeBurstParticles;
    for (let i = 0; i < burstCount; i++) {
      const angle =
        (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.4;
      const speed = (2 + Math.random() * 6) * canvasScale;
      const isGold = Math.random() > 0.3;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: (1.5 + Math.random() * 3) * canvasScale,
        life: 0.6 + Math.random() * 0.6,
        born: 0.4 + Math.random() * 0.3,
        color:
          petH !== null
            ? `hsla(${petH + (Math.random() - 0.5) * 20}, ${petS}%, ${petL + (Math.random() - 0.5) * 15}%, `
            : isGold
              ? `hsla(${40 + Math.random() * 15}, 90%, ${55 + Math.random() * 20}%, `
              : `hsla(0, 0%, ${85 + Math.random() * 15}%, `,
        type: "burst",
        decay: 0.97 + Math.random() * 0.02,
        sparkle: Math.random(),
      });
    }

    /* 持续飘散粒子 — 周围缓缓升起的星尘 */
    for (let i = 0; i < effectBudget.upgradeDriftParticles; i++) {
      particles.push({
        x: Math.random() * w,
        y: h + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.5 + Math.random() * 1.5) * canvasScale,
        r: (0.8 + Math.random() * 2) * canvasScale,
        life: 999,
        born: 0,
        color:
          petH !== null
            ? `hsla(${petH + (Math.random() - 0.5) * 10}, ${Math.max(0, petS - 10)}%, ${Math.min(100, petL + 10)}%, `
            : `hsla(${38 + Math.random() * 12}, 80%, ${60 + Math.random() * 20}%, `,
        type: "drift",
        phase: Math.random() * Math.PI * 2,
        decay: 1,
        sparkle: Math.random(),
      });
    }

    function drawParticles(now) {
      const elapsed = (now - startTime) / 1000;
      /* 5.6秒后停止粒子渲染 */
      if (elapsed > 5.6) {
        ctx.clearRect(0, 0, w, h);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      const globalFade =
        elapsed > 4.8 ? Math.max(0, 1 - (elapsed - 4.8) / 0.8) : 1;

      particles.forEach((p) => {
        if (p.type === "burst") {
          if (elapsed < p.born) return;
          const age = elapsed - p.born;
          if (age > p.life) return;

          // 物理更新 - 根据题材进行运动特征调整
          if (archetype === "electric") {
            // 闪电型折线突变
            if (Math.random() > 0.82) {
              p.vx += (Math.random() - 0.5) * 4.5 * canvasScale;
              p.vy += (Math.random() - 0.5) * 4.5 * canvasScale;
            }
            p.x += p.vx * 1.25;
            p.y += p.vy * 1.25;
          } else if (archetype === "water") {
            // 水滴漂浮阻尼大
            p.x += p.vx * 0.72 + Math.sin(elapsed * 4 + p.sparkle * 10) * 0.45;
            p.y += p.vy * 0.72;
          } else if (archetype === "fire") {
            // 火焰受浮力上升
            p.x += p.vx * 0.9;
            p.y += p.vy * 0.9 - 0.16 * canvasScale;
          } else {
            p.x += p.vx;
            p.y += p.vy;
          }

          p.vx *= p.decay;
          p.vy *= p.decay;
          p.vy += archetype === "fire" ? 0.015 : 0.04; // 火焰微粒几乎不受重力影响下坠

          const alpha = Math.max(0, 1 - age / p.life) * globalFade;
          const sparkleAlpha =
            alpha * (0.6 + 0.4 * Math.sin(elapsed * 8 + p.sparkle * 10));
          const currentRadius = p.r * (1 - (age / p.life) * 0.5);

          drawParticleShape(ctx, p, currentRadius, sparkleAlpha, elapsed);
        } else {
          // drift 粒子 (背景徐徐升起的光粉)
          if (archetype === "electric") {
            p.x += p.vx + (Math.random() - 0.5) * 0.5;
            p.y += p.vy * 1.25;
          } else if (archetype === "water") {
            // 水系气泡摇晃上升
            p.x += p.vx + Math.sin(elapsed * 1.8 + p.phase) * 0.75;
            p.y += p.vy * 0.85;
          } else if (archetype === "fire") {
            // 灰烬火焰粒子快速上升
            p.x += p.vx + Math.sin(elapsed * 1.2 + p.phase) * 0.4;
            p.y += p.vy * 1.4;
          } else {
            p.x += p.vx + Math.sin(elapsed * 1.5 + p.phase) * 0.3;
            p.y += p.vy;
          }

          if (p.y < -30) {
            p.y = h + 30;
            p.x = Math.random() * w;
          }
          const baseAlpha = 0.3 + 0.3 * Math.sin(elapsed * 2.5 + p.phase);
          const alpha = baseAlpha * globalFade;

          drawParticleShape(ctx, p, p.r, alpha, elapsed);
        }
      });
      particleRAF = requestAnimationFrame(drawParticles);
    }
    particleRAF = requestAnimationFrame(drawParticles);
  }

  const effectBudget = getDisplayEffectBudget();
  const overlayDurationMs = effectBudget.upgradeOverlayDurationMs ?? 5600;

  /* 生成能量聚合线条 — 从四周汇聚到中心（流畅模式跳过以保持性能） */
  if (energyContainer && effectBudget.upgradeEnergyLines > 0) {
    setTimeout(() => {
      const lineCount = effectBudget.upgradeEnergyLines;
      for (let i = 0; i < lineCount; i++) {
        const line = document.createElement("div");
        line.className = "pet-upgrade-energy-line";
        const angle = (360 / lineCount) * i;
        line.style.left = "50%";
        line.style.top = "50%";
        line.style.transform = `rotate(${angle}deg) translateY(-50%)`;
        line.style.animationDelay = `${i * 0.06}s`;
        energyContainer.appendChild(line);
      }
    }, 500);
  }

  /* 动画结束后清理 */
  setTimeout(() => {
    if (upgradeSession !== upgradeAnimationSession) return;
    overlay.classList.remove("active");
    overlay.classList.remove("adopt-mode");
    overlay.classList.remove("pet-upgrade-lite");
    if (particleRAF) cancelAnimationFrame(particleRAF);
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (energyContainer) energyContainer.innerHTML = "";
    endDisplayAnimationGuard();
    if (typeof onComplete === "function") onComplete();
  }, overlayDurationMs);
}

function showGlobalPetAdoptAnimation(student) {
  if (!student) return;
  const overlay = document.getElementById("petUpgradeOverlay");
  if (!overlay) return;
  showGlobalPetUpgradeAnimation(student, 1, null);
  overlay.classList.add("adopt-mode");
  const text = document.getElementById("petUpgradeText");
  const studentName = document.getElementById("petUpgradeStudent");
  if (text) text.textContent = "星种化形";
  if (studentName) {
    const petLabel = student.petName || student.petNickname || "新萌宠";
    studentName.textContent = `${student.name || "该学生"} 孕育了 ${petLabel}`;
  }
}

/* ========== 渲染榜单4-10名 ========== */
function renderLeaderboardList() {
  const wrap = document.getElementById("lbList");
  wrap.innerHTML = students
    .slice(3, 10)
    .map(
      (s, i) => `
    <div class="lb-row">
      <span class="lb-row-num">${i + 4}</span>
      <img class="lb-row-pet" src="${petImg(s)}" alt="${s.hasPet === false ? "待孕育星种" : resolvePetDisplayName(s)}">
      <div class="lb-row-info">
        <div class="lb-row-name">${s.name}</div>
        <div class="lb-row-petname">${s.hasPet === false ? "待孕育星种" : resolvePetDisplayName(s)}</div>
      </div>
      <div class="lb-row-right">
        <span class="lb-row-lv">Lv.${s.lv}</span>
        <span class="lb-row-xp">${s.pts} XP</span>
      </div>
    </div>`,
    )
    .join("");
}

const DISPLAY_HOLIDAY_PRESENTATION = {
  "children-day": {
    enableSplash: true,
    enableTransition: true,
    transition: {
      kicker: "儿童节彩蛋已开启",
      title: "六一儿童节快乐",
      copy: "愿每一颗星宠都和同学们一起闪闪发光",
    },
    splash: {
      kicker: "育英星宠 · 儿童节限定彩蛋",
      number: "6.1",
      title: "儿童节快乐",
      subtitle: "星宠派对开始啦",
      copy: "愿每位同学今天都闪闪发光",
    },
    badge: { kicker: "6.1 儿童节", title: "童心闪闪 快乐成长" },
    classroomTitle: { number: "6.1", main: "儿童节快乐", em: "今天的大屏有彩蛋" },
    sloganMain: "六一儿童节快乐",
    sloganTag: "星宠同庆",
    cardBadge: "6.1",
    pointModalBadge: "6.1 儿童节限定",
  },
  "dragon-boat-festival": {
    enableSplash: true,
    enableTransition: true,
    transition: {
      kicker: "端午节彩蛋已开启",
      title: "端午安康",
      copy: "愿每一位同学与星宠共度龙舟竞渡好时光",
    },
    splash: {
      kicker: "育英星宠 · 端午节限定彩蛋",
      number: "端午",
      title: "端午安康",
      subtitle: "粽叶飘香 龙舟竞渡",
      copy: "愿每位同学今天都元气满满",
    },
    badge: { kicker: "端午佳节", title: "粽叶飘香 龙舟竞渡" },
    classroomTitle: { number: "端午", main: "端午安康", em: "今天的大屏有彩蛋" },
    sloganMain: "端午安康",
    sloganTag: "星宠同庆",
    cardBadge: "端午",
    pointModalBadge: "端午限定",
  },
};

const DISPLAY_HOLIDAY_CONFIGS = [
  {
    key: "children-day",
    className: "display-holiday-children-day",
    matchDate(date) {
      const ymd =
        window.DisplayHolidayDates?.formatChinaYmd?.(date) ||
        formatLocalYmd(date);
      const [, month, day] = ymd.split("-").map(Number);
      return month === 6 && day === 1;
    },
  },
  {
    key: "dragon-boat-festival",
    className: "display-holiday-dragon-boat",
    matchDate(date) {
      return window.DisplayHolidayDates?.matchDragonBoatFestival?.(date) === true;
    },
  },
];

let displayHolidayDateTimer = null;
let displayHolidaySplashTimer = null;
let displayHolidaySplashPlayed = false;

function parseDisplayHolidayDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function getDisplayHolidayEvaluationDate() {
  const params = new URL(window.location.href).searchParams;
  return parseDisplayHolidayDate(params.get("holidayDate")) || new Date();
}

function resolveDisplayHoliday(date = getDisplayHolidayEvaluationDate()) {
  const params = new URL(window.location.href).searchParams;
  const override = (params.get("holiday") || "").trim().toLowerCase();
  if (override === "none" || override === "off" || override === "0") {
    return null;
  }
  if (override) {
    return (
      DISPLAY_HOLIDAY_CONFIGS.find((item) => item.key === override) || null
    );
  }
  return DISPLAY_HOLIDAY_CONFIGS.find((item) => item.matchDate(date)) || null;
}

function setHolidayText(id, text) {
  const el = document.getElementById(id);
  if (el && text != null) el.textContent = text;
}

function applyHolidayPresentation(holiday) {
  const layer = document.getElementById("classroomHolidayLayer");
  DISPLAY_HOLIDAY_CONFIGS.forEach((item) => {
    layer?.classList.toggle(
      `is-${item.key}`,
      !!holiday && holiday.key === item.key,
    );
  });

  const presentation = holiday
    ? DISPLAY_HOLIDAY_PRESENTATION[holiday.key]
    : null;
  if (!presentation) return;

  setHolidayText("transHolidayKicker", presentation.transition?.kicker);
  setHolidayText("transHolidayTitle", presentation.transition?.title);
  setHolidayText("transHolidayCopy", presentation.transition?.copy);
  setHolidayText("holidayWowKicker", presentation.splash?.kicker);
  setHolidayText("holidayWowNumber", presentation.splash?.number);
  setHolidayText("holidayWowTitle", presentation.splash?.title);
  setHolidayText("holidayWowSubtitle", presentation.splash?.subtitle);
  setHolidayText("holidayWowCopy", presentation.splash?.copy);
  setHolidayText("holidayBadgeKicker", presentation.badge?.kicker);
  setHolidayText("holidayBadgeTitle", presentation.badge?.title);
  setHolidayText(
    "holidayClassroomTitleNumber",
    presentation.classroomTitle?.number,
  );
  setHolidayText(
    "holidayClassroomTitleMain",
    presentation.classroomTitle?.main,
  );
  setHolidayText("holidayClassroomTitleEm", presentation.classroomTitle?.em);
}

function syncDisplayHolidayState(date) {
  const holiday = resolveDisplayHoliday(date);
  const classroom = document.getElementById("page-classroom");
  const layer = document.getElementById("classroomHolidayLayer");
  const splash = document.getElementById("holidayWowSplash");
  DISPLAY_HOLIDAY_CONFIGS.forEach((item) => {
    document.body.classList.toggle(item.className, holiday?.key === item.key);
    classroom?.classList.toggle(item.className, holiday?.key === item.key);
  });
  if (holiday) {
    applyHolidayPresentation(holiday);
    document.body.dataset.displayHoliday = holiday.key;
    if (classroom) classroom.dataset.displayHoliday = holiday.key;
    if (layer) layer.hidden = false;
  } else {
    delete document.body.dataset.displayHoliday;
    if (classroom) delete classroom.dataset.displayHoliday;
    if (layer) layer.hidden = true;
    splash?.classList.remove("show");
    DISPLAY_HOLIDAY_CONFIGS.forEach((item) => {
      layer?.classList.remove(`is-${item.key}`);
    });
  }
}

function playDisplayHolidaySplash(options = {}) {
  const holiday = resolveDisplayHoliday();
  const presentation = holiday
    ? DISPLAY_HOLIDAY_PRESENTATION[holiday.key]
    : null;
  if (!holiday || !presentation?.enableSplash) return;
  if (displayHolidaySplashPlayed && !options.force) return;
  const splash = document.getElementById("holidayWowSplash");
  if (!splash) return;

  displayHolidaySplashPlayed = true;
  if (displayHolidaySplashTimer) {
    clearTimeout(displayHolidaySplashTimer);
    displayHolidaySplashTimer = null;
  }
  splash.style.display = '';
  splash.classList.remove("show");
  void splash.offsetWidth;
  splash.classList.add("show");
  displayHolidaySplashTimer = setTimeout(
    () => {
      splash.classList.remove("show");
      setTimeout(() => {
        if (!splash.classList.contains("show")) {
          splash.style.display = 'none';
        }
      }, 500);
      displayHolidaySplashTimer = null;
    },
    isLowSpecMode() ? 7200 : 10700,
  );
}

function scheduleDisplayHolidayDateSync() {
  if (displayHolidayDateTimer) {
    clearTimeout(displayHolidayDateTimer);
  }
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    1,
  );
  displayHolidayDateTimer = setTimeout(() => {
    syncDisplayHolidayState();
    scheduleDisplayHolidayDateSync();
  }, Math.max(1000, nextMidnight.getTime() - now.getTime()));
}

window.syncDisplayHolidayState = syncDisplayHolidayState;
window.playDisplayHolidaySplash = playDisplayHolidaySplash;

function navigateTo(key) {
  if (key !== "toolbox") {
    cleanupToolboxRuntime({ keepTimer: false });
  }
  const target = window.DisplayUI.activatePage(key);
  if (target) {
    if (key === "exchange" && !isLowSpecMode()) {
      const stars = target.querySelector(".deco-stars");
      if (stars && !stars.hasChildNodes()) {
        createDecoStars("exStars", 28);
      }
    }
    if (key === "entry" || key === "setup" || key === "login") {
      requestAnimationFrame(() => ensureEntryStarfield(target));
    }
    if (key === "classroom") {
      setTimeout(() => {
        const bar = document.getElementById("goalBar");
        if (bar) bar.style.width = "81.9%";
      }, 300);
      enableClassroomGridDragScroll();
      unloadEntryAnimations();
      renderClassroomEntryViews({ force: true });
      syncDisplayHolidayState();
      requestAnimationFrame(() => playDisplayHolidaySplash());
    }
    if (key === "exchange") {
      renderRewardCenter();
    }
    if (key === "academic") {
      renderAcademicGrowth();
      /* 未来感增强：过场动画 → 粒子星网全屏展示 → 淡出 → 面板入场 */
      if (!isLowSpecMode()) {
        startAcademicSplash(target);
      }
    }
    if (key === "toolbox") {
      initToolboxPage();
    }
    /* 离开 academic 页时清理粒子动画 */
    if (key !== "academic") {
      cleanupAcademicParticles();
      cleanupAcademicSplash();
    }
  }

  if (key === "login") {
    dismissProfileOverlaysForAuthFlow();
    setLoginMessage("");
    hydrateLoginCredentials();
    setRealtimeConnectionStatus("hidden");
  }
  if (key === "entry") {
    runtimeState.lockOverlayForced = false;
    setRealtimeConnectionStatus("hidden");
  }
  if (key === "setup") {
    setRealtimeConnectionStatus("hidden");
  }
  if (typeof applyLockOverlay === "function") {
    applyLockOverlay();
  }
  syncDisplayHolidayState();
  flushStalePageUpdates(key);
}

function syncBottomUserName() {
  const el = document.getElementById("bottomUserName");
  if (!el) return;
  el.textContent = runtimeState.user?.name || "";
}

let currentExchangeItem = null;
let currentExchangeCost = 0;

function initiateExchange(itemName, cost) {
  currentExchangeItem = itemName;
  currentExchangeCost = parseInt(cost);
  document.getElementById("exTargetItem").innerText = itemName;
  document.getElementById("exTargetCost").innerText = cost + " 积分";

  const grid = document.getElementById("exStudentGrid");
  grid.innerHTML = students
    .map((s) => {
      const hasEnough = s.pts >= currentExchangeCost;
      const q = s.name.replace(/'/g, "\\'");
      return `
      <div class="student-select-item ${hasEnough ? "" : "disabled"}" onclick="confirmExchange('${q}')">
        <img src="${petImg(s)}" class="student-select-avatar" alt="">
        <div class="student-select-name">${s.name}</div>
        <div class="student-select-pts ${hasEnough ? "" : "insufficient"}">现有: ${s.pts}</div>
      </div>
    `;
    })
    .join("");

  document.getElementById("exStudentModal").classList.add("active");
}

function closeSelectStudentModal() {
  document.getElementById("exStudentModal").classList.remove("active");
  if (!document.getElementById("exModal").classList.contains("active")) {
    resetCurrentExchangeState();
  }
}

function confirmExchange(studentName) {
  const s = students.find((x) => x.name === studentName);
  if (!s || s.pts < currentExchangeCost) return;
  const exchangeItem = currentExchangeItem;
  const exchangeCost = currentExchangeCost;

  s.pts -= exchangeCost;
  reorderStudents();

  renderStudentGrid();
  renderTodayRank();
  renderLeaderboardList();

  closeSelectStudentModal();
  showExchangeSuccess(exchangeItem, s.name, exchangeCost);
}

function showExchangeSuccess(itemName, studentName, cost) {
  if (studentName) {
    document.getElementById("exModalDesc").innerHTML =
      `成功扣除 <span style="font-weight:700;">${studentName}</span> 的 ${cost} 积分。<br>兑换了：<span style="font-weight:700;color:var(--brand-red);">${itemName}</span>，快去找老师领取实物吧！`;
  } else {
    document.getElementById("exModalDesc").innerHTML =
      `此操作仅在展示端模拟反馈体验。<br>（您选择了：<span style="font-weight:700;color:var(--brand-red);">${itemName}</span>）`;
  }
  document.getElementById("exModal").classList.add("active");
}
function closeExchangeSuccess() {
  document.getElementById("exModal").classList.remove("active");
  resetCurrentExchangeState();
}

/* ========== D03 过场动画引擎 ========== */
let transTimers = [];
let transParticlesRAF = null;

function clearTransTimers() {
  transTimers.forEach((t) => clearTimeout(t));
  transTimers = [];
  if (transParticlesRAF) {
    cancelAnimationFrame(transParticlesRAF);
    transParticlesRAF = null;
  }
  if (transitionAnimationGuardActive) {
    transitionAnimationGuardActive = false;
    endDisplayAnimationGuard();
  }
}

function resetTransitionPage() {
  const ids = ["transBg", "transOverlay", "transGlow", "transProgress"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    el.classList.remove("animating");
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  });
  document.getElementById("transParticles").classList.remove("visible");
  document.getElementById("transStage1").className = "trans-stage";
  document.getElementById("transStage2").className = "trans-stage";
  document.getElementById("transClass").className = "trans-class";
  document
    .getElementById("transHolidayCelebration")
    ?.classList.remove("show");
  document.getElementById("transFlash").classList.remove("active");
  document.getElementById("skipBtn").style.display = "block";
}

function startTransitionAnimation() {
  clearTransTimers();
  resetTransitionPage();
  transitionAnimationGuardActive = true;
  beginDisplayAnimationGuard();

  const bg = document.getElementById("transBg");
  const overlay = document.getElementById("transOverlay");
  const glow = document.getElementById("transGlow");
  const progress = document.getElementById("transProgress");
  const canvas = document.getElementById("transParticles");
  const stage1 = document.getElementById("transStage1");
  const stage2 = document.getElementById("transStage2");
  const cls = document.getElementById("transClass");
  const holidayCelebration = document.getElementById(
    "transHolidayCelebration",
  );
  const flash = document.getElementById("transFlash");
  const skip = document.getElementById("skipBtn");

  const holiday = resolveDisplayHoliday();
  const holidayPresentation = holiday
    ? DISPLAY_HOLIDAY_PRESENTATION[holiday.key]
    : null;
  const isHoliday = !!(holiday && holidayPresentation?.enableTransition);
  if (isHoliday) {
    applyHolidayPresentation(holiday);
    const todayStr = new Date().toLocaleDateString("zh-CN", {
      timeZone: "Asia/Shanghai",
    });
    if (!window.DisplayRuntime.hasHolidaySplashPlayed(todayStr)) {
      skip.style.display = "none";
      window.DisplayRuntime.markHolidaySplashPlayed(todayStr);
    }
  }

  /* 立即启动背景层动画（CSS keyframes 8s） */
  requestAnimationFrame(() => {
    bg.classList.add("animating");
    overlay.classList.add("animating");
    glow.classList.add("animating");
    progress.classList.add("animating");
  });

  /* 粒子星网：0.3s 立即启动（背景暗色时最清晰） */
  transTimers.push(
    setTimeout(() => {
      initTransParticles(canvas);
      canvas.classList.add("visible");
    }, 300),
  );

  /* 阶段1：0.8s → 进入校园 */
  transTimers.push(
    setTimeout(() => {
      stage1.classList.add("show");
    }, 800),
  );

  /* 阶段1 淡出：2.5s */
  transTimers.push(
    setTimeout(() => {
      stage1.classList.remove("show");
      stage1.classList.add("hide");
    }, 2500),
  );

  /* 阶段2：3s → 走进教学楼 */
  transTimers.push(
    setTimeout(() => {
      stage2.classList.add("show");
    }, 3000),
  );

  /* 阶段2 淡出：4.8s */
  transTimers.push(
    setTimeout(() => {
      stage2.classList.remove("show");
      stage2.classList.add("hide");
    }, 4800),
  );

  /* 阶段3：5.2s → 班级信息 */
  transTimers.push(
    setTimeout(() => {
      cls.classList.add("show");
    }, 5200),
  );

  /* 节日彩蛋：班级信息后追加一次明确庆祝动画 */
  if (isHoliday) {
    transTimers.push(
      setTimeout(() => {
        cls.classList.remove("show");
        cls.classList.add("hide");
        holidayCelebration?.classList.add("show");
      }, 6350),
    );
  }

  const flashDelay = isHoliday ? 11000 : 7200;
  const jumpDelay = isHoliday ? 11850 : 8000;

  /* 白闪 + 跳转准备 */
  transTimers.push(
    setTimeout(() => {
      flash.classList.add("active");
      skip.style.display = "none";
    }, flashDelay),
  );

  /* 跳转到班级页 */
  transTimers.push(
    setTimeout(() => {
      clearTransTimers();
      const classroomPage = document.getElementById("page-classroom");
      classroomPage.classList.add("classroom-enter-scene");
      navigateTo("classroom");
      setTimeout(
        () => classroomPage.classList.remove("classroom-enter-scene"),
        1600,
      );
    }, jumpDelay),
  );
}

function skipTransition() {
  clearTransTimers();
  navigateTo("classroom");
}

function initTransParticles(canvas) {
  if (document.body.classList.contains("low-spec")) return;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w = (canvas.width = window.innerWidth);
  let h = (canvas.height = window.innerHeight);

  const budget = getDisplayEffectBudget();
  const COUNT = budget.transitionParticles;
  const CONNECTION_DIST = isStandardDisplay() ? 100 : 130;

  const pts = [];
  for (let i = 0; i < COUNT; i++) {
    pts.push({
      x: Math.random() * w,
      y: Math.random() * h,
      /* 基础漂移 + 向上升力 */
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(Math.random() * 0.6 + 0.15),
      r: Math.random() * 2 + 0.8,
      alpha: Math.random() * 0.5 + 0.3,
      hue: Math.random() > 0.7 ? 45 : Math.random() > 0.5 ? 175 : 38,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const t = Date.now() * 0.001;

    /* 更新粒子位置 */
    for (const p of pts) {
      p.x += p.vx + Math.sin(t + p.phase) * 0.25;
      p.y += p.vy;
      if (p.y < -20) {
        p.y = h + 20;
        p.x = Math.random() * w;
      }
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
    }

    /* 绘制连线网络 */
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const lineAlpha = (1 - dist / CONNECTION_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(240, 200, 80, ${lineAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    /* 绘制粒子 + 光晕 */
    for (const p of pts) {
      const a = p.alpha * (0.5 + 0.5 * Math.sin(t * 2.5 + p.phase));
      /* 外层光晕 */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${a * 0.1})`;
      ctx.fill();
      /* 核心粒子 */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${a})`;
      ctx.fill();
    }
    transParticlesRAF = requestAnimationFrame(draw);
  }
  draw();
}

/* ========== 登录处理 ========== */
function handleLogin() {
  const card = document.querySelector(".login-card");
  card.style.transition =
    "transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease";
  card.style.transform = "scale(0.92) translateY(-10px)";
  card.style.opacity = "0";
  setTimeout(() => {
    card.style.transition = "none";
    card.style.transform = "";
    card.style.opacity = "";
    navigateTo("transition");
    setTimeout(() => startTransitionAnimation(), 80);
  }, 500);
}

/* 榜单Tab切换 */
document.querySelectorAll(".lb-tab").forEach((tab) => {
  tab.addEventListener("click", async () => {
    document
      .querySelectorAll(".lb-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    if (runtimeState.classId) {
      await fetchLeaderboard(tab.dataset.type || "score");
    }
  });
});

/* ========== 装饰星星（榜单页用） ========== */
function createDecoStars(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.setProperty("--dur", 2 + Math.random() * 4 + "s");
    star.style.animationDelay = Math.random() * 4 + "s";
    container.appendChild(star);
  }
}

/* ========== 装饰浮动圆点（班级页用，柔和的浅色） ========== */
function createDecoDots(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const colors = [
    "rgba(41,128,185,0.5)",
    "rgba(240,180,41,0.5)",
    "rgba(39,174,96,0.4)",
    "rgba(230,70,38,0.3)",
    "rgba(155,89,182,0.3)",
  ];
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("span");
    dot.className = "dot-deco";
    const size = 4 + Math.random() * 8;
    dot.style.width = size + "px";
    dot.style.height = size + "px";
    dot.style.left = Math.random() * 100 + "%";
    dot.style.top = Math.random() * 100 + "%";
    dot.style.background = colors[Math.floor(Math.random() * colors.length)];
    dot.style.setProperty("--dur", 3 + Math.random() * 5 + "s");
    dot.style.animationDelay = Math.random() * 5 + "s";
    container.appendChild(dot);
  }
}

/** 格式化为中文日期与时分秒（本地时区） */
function formatZhDateTime(d) {
  const w = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${w} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function updateWeatherDisplay(payload = {}) {
  const chip = document.getElementById("displayWeatherChip");
  const icon = document.getElementById("displayWeatherIcon");
  const text = document.getElementById("displayWeatherText");
  if (!chip || !icon || !text) return;
  const label = payload.label || "天气加载中";
  text.textContent = label;
  icon.className = `fa-solid ${payload.icon || "fa-cloud-sun"}`;
}

async function refreshDisplayWeather() {
  updateWeatherDisplay({
    label: "天气加载中",
    icon: "fa-cloud-sun",
  });
  try {
    const weatherData = await apiFetchWithToken(`/display/weather`, null);
    updateWeatherDisplay({
      label: weatherData.label || "当前城市",
      icon: weatherData.icon || "fa-cloud",
    });
  } catch (error) {
    updateWeatherDisplay({
      label: "当前城市",
      icon: "fa-cloud",
    });
  }
}

function startDisplayLiveClock() {
  const el = document.getElementById("display-live-datetime");
  if (!el) return;
  const tick = () => {
    el.textContent = formatZhDateTime(new Date());
  };
  tick();
  setInterval(tick, 1000);
}

/* ========== 初始化 ========== */
document.addEventListener("DOMContentLoaded", () => {
  startDisplayLiveClock();
  refreshDisplayWeather();
  window.setInterval(refreshDisplayWeather, 10 * 60 * 1000);
  reorderStudents();
  renderStudentGrid();
  renderTodayRank();
  renderLeaderboardList();
  if (!isLowSpecMode()) {
    createDecoDots("classroomDots", 25);
    createDecoStars("lbStars", 40);
  }
});

/* ========== 视差与交互逻辑 ========== */
document.addEventListener("DOMContentLoaded", () => {
  initDisplayParallax();
  enableClassroomGridDragScroll();

  const interactSelectors = [
    ".lb-entry-card",
    ".star-wrap",
    ".podium-slot",
    ".lb-row",
  ];
  interactSelectors.forEach((sel) =>
    document.querySelectorAll(sel).forEach(makeInteractive),
  );
  document
    .querySelectorAll("#studentGrid .student-card")
    .forEach(bindStudentCardTapInteraction);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          interactSelectors.forEach((sel) => {
            if (node.matches && node.matches(sel)) makeInteractive(node);
            node.querySelectorAll(sel).forEach(makeInteractive);
          });
          if (node.matches?.(".student-card")) {
            bindStudentCardTapInteraction(node);
          }
          node
            .querySelectorAll(".student-card")
            .forEach(bindStudentCardTapInteraction);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
});

function initDisplayParallax() {
  if (isStandardDisplay() || isCoarsePointerDevice()) return;
  const parallaxLayers = document.querySelectorAll(
    ".deco-dots, .deco-stars, #transBg",
  );
  document.addEventListener("mousemove", (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    parallaxLayers.forEach((layer) => {
      if (!layer) return;
      // 轻微逆向移动，打造视差感
      layer.style.transform = `translate(${-dx * 15}px, ${-dy * 15}px)`;
    });
  });
}

function resetStudentCardVisualState(card) {
  if (!card) return;
  card.style.transform = "";
  card.classList.remove(
    "dragging",
    "snapping",
    "pk-source-active",
    "pk-magnetic",
    "pk-drop-ready",
    "pk-impact-burst",
  );
}

function resetAllStudentCardVisualStates() {
  document
    .querySelectorAll("#studentGrid .student-card")
    .forEach(resetStudentCardVisualState);
}

/** 班级主页学生卡片：仅单击评分/批量选中，PK 仅通过萌宠头像 */
function bindStudentCardTapInteraction(card) {
  if (!card?.classList?.contains("student-card")) return;
  if (card.dataset.studentTapReady === "1") return;
  card.dataset.studentTapReady = "1";
  card.classList.add("interact-card");

  let pointerDownX = 0;
  let pointerDownY = 0;
  let activePointerId = null;

  const detachListeners = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onEnd);
    document.removeEventListener("pointercancel", onEnd);
    activePointerId = null;
  };

  const onMove = (event) => {
    if (activePointerId === null || event.pointerId !== activePointerId) return;
    const profile = getTouchInteractionProfile();
    const dx = event.clientX - pointerDownX;
    const dy = event.clientY - pointerDownY;
    const wrap = getClassroomGridWrap();
    if (
      (isGridScrollable(wrap) && isVerticalScrollIntent(dx, dy, profile)) ||
      isClassroomGridScrolling()
    ) {
      detachListeners();
    }
  };

  const onEnd = (event) => {
    if (activePointerId === null || event.pointerId !== activePointerId) return;
    const profile = getTouchInteractionProfile();
    const releaseDistance = Math.hypot(
      event.clientX - pointerDownX,
      event.clientY - pointerDownY,
    );
    detachListeners();
    resetStudentCardVisualState(card);

    if (isClassroomGridScrolling()) return;
    if (releaseDistance > profile.tapSlop) return;

    const name = card.getAttribute("data-student-name");
    if (name === null) return;
    if (isDisplayAnimationLocked()) return;
    if (batchMode) {
      toggleBatchSelect(name, { stopPropagation() {} });
      return;
    }
    openPointModalByName(name, card);
  };

  card.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (
      event.target.closest("a") ||
      (!batchMode && event.target.closest("button")) ||
      event.target.closest("input") ||
      event.target.closest(".card-nameplate--empty")
    ) {
      return;
    }
    if (isClassroomGridScrolling()) return;

    activePointerId = event.pointerId;
    pointerDownX = event.clientX;
    pointerDownY = event.clientY;
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerup", onEnd);
    document.addEventListener("pointercancel", onEnd);
  });
}

function makeInteractive(card) {
  if (card.classList.contains("student-card")) {
    bindStudentCardTapInteraction(card);
    return;
  }
  if (card.classList.contains("interact-card")) return;
  card.classList.add("interact-card");
  const isStudentCard = () => card.classList.contains("student-card");
  let pointerDownX = 0;
  let pointerDownY = 0;
  let startX;
  let startY;
  let moveX = 0;
  let moveY = 0;
  let isTracking = false;
  let dragActivated = false;
  let hasMoved = false;
  let scrollCancelled = false;
  let pkSourceStudent = null;
  let dragFrame = 0;
  let pendingDragTransform = "";
  let activePointerId = null;
  let pointerBatchModeAtStart = false;

  const applyDragTransform = (transformValue) => {
    pendingDragTransform = transformValue;
    if (dragFrame) return;
    dragFrame = window.requestAnimationFrame(() => {
      dragFrame = 0;
      card.style.transform = pendingDragTransform;
    });
  };

  const getPointerClientXY = (event) => ({
    clientX: event.clientX,
    clientY: event.clientY,
  });

  const detachPointerListeners = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onEnd);
    document.removeEventListener("pointercancel", onEnd);
    activePointerId = null;
  };

  const activateDrag = (event) => {
    if (dragActivated) return;
    dragActivated = true;
    if (!batchMode) {
      card.classList.add("dragging");
    }
    card.setPointerCapture?.(event.pointerId);
  };

  // 考虑到大屏端为触控设备，为保障性能与防止粘滞，移除了原有的卡片 3D Tilt 跟手效果

  const onStart = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (
      event.target.closest("a") ||
      (!batchMode && event.target.closest("button")) ||
      event.target.closest("input") ||
      event.target.closest(".card-nameplate--empty")
    )
      return;
    if (isStudentCard() && isClassroomGridScrolling()) return;

    isTracking = true;
    dragActivated = false;
    hasMoved = false;
    scrollCancelled = false;
    activePointerId = event.pointerId;
    pointerBatchModeAtStart = batchMode;
    pkSourceStudent = isStudentCard() ? getStudentByCard(card) : null;
    card.classList.remove("snapping");

    const { clientX, clientY } = getPointerClientXY(event);
    pointerDownX = clientX;
    pointerDownY = clientY;
    startX = clientX - moveX;
    startY = clientY - moveY;

    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onEnd);
    document.addEventListener("pointercancel", onEnd);
  };

  const onMove = (event) => {
    if (!isTracking || scrollCancelled) return;
    if (
      activePointerId !== null &&
      event.pointerId !== undefined &&
      event.pointerId !== activePointerId
    ) {
      return;
    }
    if (batchMode) return;

    const { clientX, clientY } = getPointerClientXY(event);
    const dx = clientX - pointerDownX;
    const dy = clientY - pointerDownY;
    const distance = Math.hypot(dx, dy);
    const touchProfile = getTouchInteractionProfile();

    if (isStudentCard()) {
      const wrap = getClassroomGridWrap();
      if (
        (isGridScrollable(wrap) &&
          isVerticalScrollIntent(dx, dy, touchProfile)) ||
        isClassroomGridScrolling()
      ) {
        scrollCancelled = true;
        isTracking = false;
        detachPointerListeners();
        card.classList.remove("dragging", "pk-source-active", "pk-magnetic");
        clearPetPkDragAtmosphere();
        clearPetPkHoverTarget();
        pkSourceStudent = null;
        return;
      }
    }

    if (distance < touchProfile.tapSlop) return;

    if (!dragActivated) {
      activateDrag(event);
    }
    event.preventDefault();
    hasMoved = true;

    if (isStudentCard() && !touchProfile.cardPkEnabled) {
      return;
    }

    moveX = clientX - startX;
    moveY = clientY - startY;

    let scaleBoost = 1.08;
    let rotZ = Math.max(-9, Math.min(9, moveX * 0.045));

    if (
      pkSourceStudent &&
      pkSourceStudent.hasPet !== false &&
      !batchMode &&
      touchProfile.cardPkEnabled
    ) {
      card.classList.add("pk-source-active");
      const magneticTarget = updatePetPkHoverTarget(card, clientX, clientY);
      updatePetPkDragAtmosphere(clientX, clientY, Boolean(magneticTarget));
      if (magneticTarget) {
        const targetRect = magneticTarget.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const dxToTarget = targetCenterX - clientX;
        scaleBoost = 1.11;
        rotZ += Math.max(-4, Math.min(4, dxToTarget * 0.01));
        card.classList.add("pk-magnetic");
      } else {
        card.classList.remove("pk-magnetic");
      }
    }

    applyDragTransform(
      `translate(${moveX}px, ${moveY}px) rotateZ(${rotZ}deg) scale(${scaleBoost})`,
    );
  };

  const onEnd = (event) => {
    if (scrollCancelled) return;
    if (!isTracking) return;
    if (
      activePointerId !== null &&
      event?.pointerId !== undefined &&
      event.pointerId !== activePointerId
    ) {
      return;
    }

    const endX = event?.clientX ?? pointerDownX;
    const endY = event?.clientY ?? pointerDownY;
    const releaseDistance = Math.hypot(
      endX - pointerDownX,
      endY - pointerDownY,
    );
    const touchProfile = getTouchInteractionProfile();

    isTracking = false;
    if (event?.pointerId !== undefined) {
      try {
        if (card.hasPointerCapture?.(event.pointerId)) {
          card.releasePointerCapture(event.pointerId);
        }
      } catch {
        // 指针可能已被浏览器释放
      }
    }
    detachPointerListeners();

    if (pointerBatchModeAtStart && !batchMode) {
      pkSourceStudent = null;
      pointerBatchModeAtStart = false;
      return;
    }
    pointerBatchModeAtStart = false;

    card.classList.remove("dragging");
    card.classList.remove("pk-source-active");
    card.classList.remove("pk-magnetic");

    const targetCard = petPkState.hoverTargetCard;
    const targetStudent =
      pkSourceStudent && targetCard ? getStudentByCard(targetCard) : null;
    clearPetPkDragAtmosphere();
    clearPetPkHoverTarget();

    if (isStudentCard() && isClassroomGridScrolling()) {
      pkSourceStudent = null;
      return;
    }

    if (hasMoved && dragActivated) {
      card.classList.add("snapping");

      moveX = 0;
      moveY = 0;
      applyDragTransform(
        `translate(0px, 0px) perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`,
      );

      setTimeout(() => {
        card.classList.remove("snapping");
      }, 600);

      if (
        touchProfile.cardPkEnabled &&
        pkSourceStudent &&
        pkSourceStudent.hasPet !== false &&
        targetStudent &&
        targetStudent.hasPet !== false &&
        targetStudent.name !== pkSourceStudent.name
      ) {
        triggerCardPkImpact(card);
        triggerCardPkImpact(targetCard);
        playPetPkAnimation(pkSourceStudent, targetStudent);
      }
    } else if (releaseDistance <= touchProfile.tapSlop) {
      const name = card.getAttribute("data-student-name");
      if (name !== null) {
        card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        if (isDisplayAnimationLocked()) {
          pkSourceStudent = null;
          return;
        }
        if (batchMode) {
          toggleBatchSelect(name, { stopPropagation() {} });
        } else {
          openPointModalByName(name, card);
        }
      }
    }
    pkSourceStudent = null;
  };

  card.addEventListener("pointerdown", onStart);
}

/* ========== 加减分弹窗处理 ========== */
let currentFocusStudent = null;
let scoreActionInFlight = false;
let displayInputGuardTimer = null;
let displayAnimationGuardDepth = 0;
let upgradeAnimationSession = 0;
let transitionAnimationGuardActive = false;
let realtimeStatusWasConnected = false;

function showDisplayToast(message, options = {}) {
  return window.DisplayUI.showDisplayToast(message, options);
}

window.alert = (message) => showDisplayToast(message);

function setRealtimeConnectionStatus(mode, message) {
  return window.DisplayUI.setRealtimeStatus(mode, message, {
    suppress: mode !== "hidden" && shouldSuppressRealtimeStatusBar(),
  });
}

async function refreshDisplayDataAfterMutation(options = {}) {
  const requireRefresh =
    options.requireRefresh ?? !runtimeState.socket?.connected;
  if (!requireRefresh) return true;

  const actionLabel = options.actionLabel || "操作";
  try {
    await bootstrapDisplayData({
      authenticated: true,
      silent: true,
      rethrow: true,
      ...(options.bootstrapOptions || {}),
    });
    return true;
  } catch (_error) {
    showDisplayToast(
      options.failureMessage ||
        `${actionLabel}已提交，但界面刷新失败，请检查网络连接后重试。`,
      { duration: 4200 },
    );
    return false;
  }
}

function beginDisplayInputGuard(durationMs = 450) {
  document.body.classList.add("display-input-guard");
  window.clearTimeout(displayInputGuardTimer);
  displayInputGuardTimer = window.setTimeout(() => {
    document.body.classList.remove("display-input-guard");
    displayInputGuardTimer = null;
  }, durationMs);
}

window.DisplayUI.configure({ beginInputGuard: beginDisplayInputGuard });

function syncDisplayAnimationGuardClass() {
  document.body.classList.toggle(
    "display-animation-guard",
    displayAnimationGuardDepth > 0,
  );
}

function beginDisplayAnimationGuard() {
  displayAnimationGuardDepth += 1;
  syncDisplayAnimationGuardClass();
}

function endDisplayAnimationGuard() {
  displayAnimationGuardDepth = Math.max(0, displayAnimationGuardDepth - 1);
  syncDisplayAnimationGuardClass();
}

function isDisplayAnimationLocked() {
  return displayAnimationGuardDepth > 0;
}

function closeConfirmModal(confirmed = false) {
  return window.DisplayUI.closeConfirmModal(confirmed);
}

function showConfirmModal(options = {}) {
  return window.DisplayUI.showConfirmModal(options);
}

function showDisplayAlert(options = {}) {
  return window.DisplayUI.showDisplayAlert(options);
}

function renderModalHistory(s) {
  const wrapper = document.getElementById("pmHistory");
  if (!wrapper) return;
  const histHtml = (s.history || [])
    .slice(0, 5)
    .map(
      (h) => `
    <div class="pm-history-item fade-in">
      <div style="display:flex; flex-direction:column; gap:2px;">
        <span class="pm-history-reason">${h.reason}</span>
        <span class="pm-history-time">${h.time}</span>
      </div>
      <span class="pm-history-diff ${h.diff > 0 ? "pos" : "neg"}">${h.diff > 0 ? "+" + h.diff : h.diff}</span>
    </div>
  `,
    )
    .join("");
  wrapper.innerHTML =
    histHtml ||
    '<div style="text-align:center;color:#999;font-size:12px;padding:10px;">暂无记录</div>';
}

function openPointModalByName(name, cardEl) {
  const idx = students.findIndex((x) => x.name === name);
  if (idx < 0) return;
  openPointModalSingle(idx, cardEl);
}

function openPointModalSingle(idx, cardEl) {
  currentFocusStudent = { type: "single", idx, el: cardEl };
  const s = students[idx];
  document.getElementById("pmAvatar").src = petImg(s);
  document.getElementById("pmName").textContent = s.name;
  document.getElementById("pmPts").textContent = s.pts;
  renderModalHistory(s);
  document.getElementById("pointModal").classList.add("active");
}

function openPointModalBatch(names) {
  currentFocusStudent = { type: "batch", names };
  document.getElementById("pmAvatar").src = "images/logo.svg";
  document.getElementById("pmName").textContent =
    "已选 " + names.length + " 人";
  document.getElementById("pmPts").textContent = "—";
  document.getElementById("pmHistory").innerHTML =
    '<div style="text-align:center;color:#999;font-size:12px;padding:10px;">批量操作将写入每位选中学生</div>';
  document.getElementById("pointModal").classList.add("active");
}

function openPointModalGroup(groupNum) {
  const list = students.filter((s) => s.group === groupNum);
  const groupLabel = getGroupLabel(groupNum);
  currentFocusStudent = { type: "group", group: groupNum };
  document.getElementById("pmAvatar").src = "images/logo.svg";
  document.getElementById("pmName").textContent =
    groupLabel + "（" + list.length + " 人）";
  document.getElementById("pmPts").textContent = "—";
  document.getElementById("pmHistory").innerHTML =
    '<div style="text-align:center;color:#999;font-size:12px;padding:10px;">对本组全部学生同步加减分</div>';
  document.getElementById("pointModal").classList.add("active");
}

function closePointModal() {
  openMoreRulePanel("quick");
  closeAllHistoryModal();
  document.getElementById("pointModal")?.classList.remove("active");
  closeConfirmModal(false);
  currentFocusStudent = null;
  setAllHistoryButtonState({ visible: false });
  currentAllHistoryRecords = [];
  beginDisplayInputGuard(450);
}

function closePetProfileModal() {
  closePetProfileAllHistoryModal();
  closePetFullView();
  document.getElementById("petProfileModal")?.classList.remove("active");
  petProfileShowcaseToken += 1;
  currentProfileShowcaseStudentKey = null;
  currentProfileStudent = null;
  currentPetProfileRecords = [];
  setPetProfileAllHistoryButtonState({ visible: false });
  closeDecorationPanel();
}

/* ===== 萌宠全屏观看模式 ===== */
let petFullViewToken = 0;

function openPetFullView() {
  if (!currentProfileStudent) return;
  const overlay = document.getElementById("petFullViewOverlay");
  const avatarEl = document.getElementById("petFullViewAvatar");
  const bgEl = document.getElementById("petFullViewDecoBg");
  const frameEl = document.getElementById("petFullViewDecoFrame");
  const accessoryEl = document.getElementById("petFullViewDecoAccessory");
  const shellEl = document.getElementById("petFullViewAvatarShell");
  const nameEl = document.getElementById("petFullViewName");
  const metaEl = document.getElementById("petFullViewMeta");
  
  if (!overlay || !avatarEl || !shellEl) return;
  
  const token = ++petFullViewToken;
  const student = currentProfileStudent;
  
  // 渲染图片和装饰
  const heroSize = isLowSpecMode() ? 400 : 1024;
  const primaryUrl = petImgVariant(student, heroSize);
  const fallbackUrl = petImgVariant(student, 400);
  
  avatarEl.removeAttribute("src");
  if (primaryUrl) {
    const preload = new Image();
    preload.decoding = "async";
    const applySrc = (url) => {
      if (token !== petFullViewToken) return;
      avatarEl.src = url;
    };
    preload.onload = () => applySrc(primaryUrl);
    preload.onerror = () => {
      if (fallbackUrl) applySrc(fallbackUrl);
    };
    preload.src = primaryUrl;
  }
  
  // 渲染装饰
  const decos = student.equippedDecorations || [];
  const backdrop = decos.find((d) => d.type === THEME_BACKDROP_TYPE);
  const bg = decos.find((d) => d.type === "background");
  const frame = decos.find((d) => d.type === "frame");
  const accessory = decos.find((d) => d.type === "accessory");
  
  if (backdrop) {
    setDecoLayerElement(bgEl, backdrop, heroSize);
    setDecoLayerElement(frameEl, null, heroSize);
  } else {
    setDecoLayerElement(bgEl, bg, heroSize);
    setDecoLayerElement(frameEl, frame, heroSize);
  }
  const petCode = extractPetSpeciesCode(student);
  syncAccessoryDecoElement(accessoryEl, accessory, heroSize, petCode);
  
  if (backdrop || bg || frame || accessory) {
    shellEl.classList.add("has-deco");
    if (backdrop || bg || frame) {
      shellEl.classList.add("has-deco-scene");
    } else {
      shellEl.classList.remove("has-deco-scene");
    }
  } else {
    shellEl.classList.remove("has-deco");
    shellEl.classList.remove("has-deco-scene");
  }
  
  // 渲染信息
  const petDisplayName = resolvePetDisplayName(student);
  nameEl.textContent = petDisplayName;
  const stageStr = student.petStageName ? student.petStageName : `Lv.${student.lv || 1} · 当前形态`;
  metaEl.innerHTML = `<i class="fa-solid fa-paw" style="opacity:0.8; margin-right:4px"></i> ${escapeHtml(stageStr)}`;
  
  // 播放音效与显示
  if (typeof playPkTone === "function") playPkTone("hover");
  overlay.classList.add("active");
}

function closePetFullView() {
  const overlay = document.getElementById("petFullViewOverlay");
  if (overlay) {
    overlay.classList.remove("active");
  }
}


/** 进入登录/解锁流程前关闭档案与装扮等遮挡层 */
function dismissProfileOverlaysForAuthFlow() {
  closePetProfileModal();
  closeConfirmModal(false);
}

function profileToScore() {
  if (!currentProfileStudent) return;
  const name = currentProfileStudent.name;
  closePetProfileModal();
  setTimeout(() => {
    openPointModalByName(name, null);
  }, 100);
}

function profileToEvo() {
  if (!currentProfileStudent) return;

  const petName = currentProfileStudent.petName;
  const catalog = getAdoptCatalog();

  // 核心修复逻辑：优先通过名称匹配，因为学生的 petId/petCode 字段在正式环境中可能与图鉴 Code 不一致
  let matched = catalog.find((p) => p.name === petName);

  // 如果名称没匹配到，再尝试通过编号匹配
  if (!matched) {
    const code = currentProfileStudent.petCode || currentProfileStudent.petId;
    matched = catalog.find((p) => String(p.code) === String(code));
  }

  if (matched) {
    const code = matched.code;
    const lv = currentProfileStudent.lv || 1;
    closePetProfileModal();
    setTimeout(() => {
      openAdoptPetDetailModal(code, lv, "profile");
    }, 100);
  } else {
    // 界面反馈：如果实在找不到，提示用户
    showDisplayToast(
      `暂未在图鉴中找到名为 "${petName || "未知"}" 的萌宠进化详情。`,
    );
  }
}

function setPetProfileAllHistoryButtonState({
  visible = false,
  enabled = false,
  text = "全部记录",
} = {}) {
  const btn = document.getElementById("petProfileHistoryAllBtn");
  if (!btn) return;
  btn.style.display = visible ? "inline-flex" : "none";
  btn.disabled = !enabled;
  btn.textContent = text;
}

function renderPetProfileAllHistoryModal(studentName, records) {
  const title = document.getElementById("petProfileAllHistoryTitle");
  const list = document.getElementById("petProfileAllHistoryList");
  if (!title || !list) return;
  title.textContent = `${studentName} · 积分记录（全部）`;
  if (!Array.isArray(records) || records.length === 0) {
    list.innerHTML = '<div class="pm-empty">暂无积分记录</div>';
    return;
  }
  list.innerHTML = records
    .map(
      (record) => `
        <div class="pm-all-history-item">
          <div class="pm-all-history-main">
            <span class="pm-all-history-reason">${escapeHtml(record.title || "积分调整")}</span>
            <span class="pm-all-history-time">${escapeHtml(record.time || "--")} · ${escapeHtml(record.actor || "教师")}${record.remark ? ` · ${escapeHtml(record.remark)}` : ""}</span>
          </div>
          <span class="pm-all-history-diff ${Number(record.diff || 0) >= 0 ? "pos" : "neg"}">${Number(record.diff || 0) >= 0 ? `+${Number(record.diff || 0)}` : Number(record.diff || 0)}</span>
        </div>`,
    )
    .join("");
}

function openPetProfileAllHistoryModal() {
  if (!currentProfileStudent) return;
  const overlay = document.getElementById("petProfileAllHistoryModal");
  if (!overlay) return;
  renderPetProfileAllHistoryModal(
    currentProfileStudent.name,
    currentPetProfileRecords,
  );
  overlay.classList.add("active");
}

function closePetProfileAllHistoryModal() {
  document
    .getElementById("petProfileAllHistoryModal")
    ?.classList.remove("active");
  if (document.body.classList.contains("low-spec")) {
    const list = document.getElementById("petProfileAllHistoryList");
    if (list) list.innerHTML = "";
  }
}

function renderPetProfileLoading() {
  const history = document.getElementById("petProfileHistory");
  setPetProfileAllHistoryButtonState({
    visible: true,
    enabled: false,
    text: "加载中...",
  });
  if (history) {
    history.innerHTML =
      '<div class="pet-profile-loading">正在加载积分记录...</div>';
  }
}

const PET_NICKNAME_MAX_CHARS = 4;

function resolvePetDisplayName(student) {
  return student.petNickname || student.petName || "未命名萌宠";
}

function resolveCardCustomName(student) {
  const nickname = String(student?.petNickname || "").trim();
  if (!nickname) return "";
  return normalizePetNicknameInput(nickname);
}

function normalizePetNicknameInput(value) {
  return Array.from(String(value || "").trim())
    .slice(0, PET_NICKNAME_MAX_CHARS)
    .join("");
}

function resolveStudentPetId(student) {
  if (!student) return null;
  if (student.studentPetId) return student.studentPetId;
  const fresh =
    student.id != null ? students.find((item) => item.id === student.id) : null;
  if (fresh?.studentPetId) return fresh.studentPetId;
  if (student.name) {
    const byName = students.find((item) => item.name === student.name);
    return byName?.studentPetId || null;
  }
  return null;
}

function refreshCurrentProfileStudent() {
  if (!currentProfileStudent) return currentProfileStudent;
  const fresh =
    currentProfileStudent.id != null
      ? students.find((item) => item.id === currentProfileStudent.id)
      : students.find((item) => item.name === currentProfileStudent.name);
  if (fresh) {
    currentProfileStudent = fresh;
  }
  return currentProfileStudent;
}

function showToast(message, type = "info") {
  return window.DisplayUI.showToast(message, type);
}

function resolveAccessoryDecoSize(context = "hero") {
  if (context === "list" || context === "preview") return 400;
  return isLowSpecMode() ? 400 : 1024;
}

function getProfileShowcaseStudentKey(student) {
  if (!student) return "";
  return String(student.id ?? student.name ?? "");
}

function resetPetProfileShowcase() {
  petProfileShowcaseToken += 1;
  syncShowcaseDecoSceneClass("petProfileDecoContainer", false);
  document
    .getElementById("petProfileDecoContainer")
    ?.classList.add("is-loading");
  setDecoLayerElement(document.getElementById("petProfileDecoBg"), null);
  setDecoLayerElement(document.getElementById("petProfileDecoFrame"), null);
  syncAccessoryDecoElement(
    document.getElementById("petProfileDecoAccessory"),
    null,
  );
  const avatar = document.getElementById("petProfileAvatar");
  if (avatar) {
    avatar.removeAttribute("src");
    avatar.alt = "";
  }
}

function revealPetProfileShowcase() {
  document
    .getElementById("petProfileDecoContainer")
    ?.classList.remove("is-loading");
}

function updatePetProfileShowcase(student) {
  const token = ++petProfileShowcaseToken;
  renderPetProfileDecoLayers(student);
  const avatar = document.getElementById("petProfileAvatar");
  if (!avatar) return;

  const profileImgSize = isLowSpecMode() ? 400 : 1024;
  const primaryUrl = petImgVariant(student, profileImgSize);
  const fallbackUrl = petImgVariant(student, 400);

  const applyAvatar = (url) => {
    if (token !== petProfileShowcaseToken) return;
    if (url) {
      avatar.src = url;
      avatar.onerror = () => {
        avatar.onerror = null;
        if (fallbackUrl && avatar.src !== fallbackUrl) {
          avatar.src = fallbackUrl;
        }
      };
    } else {
      avatar.removeAttribute("src");
    }
    avatar.alt = `${student.name}的萌宠`;
    revealPetProfileShowcase();
    currentProfileShowcaseStudentKey = getProfileShowcaseStudentKey(student);
  };

  if (!primaryUrl) {
    applyAvatar("");
    return;
  }

  const preload = new Image();
  preload.decoding = "async";
  const onReady = () => {
    if (token !== petProfileShowcaseToken) return;
    applyAvatar(primaryUrl);
  };
  preload.onload = onReady;
  preload.onerror = onReady;
  preload.src = primaryUrl;
}

function syncShowcaseDecoSceneClass(containerId, hasScene) {
  document
    .getElementById(containerId)
    ?.classList.toggle("has-deco-scene", !!hasScene);
}

function renderPetProfileDecoLayers(student, prefix = "petProfile") {
  const bgEl = document.getElementById(prefix + "DecoBg");
  const frameEl = document.getElementById(prefix + "DecoFrame");
  const accessoryEl = document.getElementById(prefix + "DecoAccessory");
  const decos = student.equippedDecorations || [];
  const backdrop = decos.find((d) => d.type === THEME_BACKDROP_TYPE);
  const bg = decos.find((d) => d.type === "background");
  const frame = decos.find((d) => d.type === "frame");
  const accessory = decos.find((d) => d.type === "accessory");
  const heroSize = isLowSpecMode() ? 400 : 1024;
  if (backdrop) {
    setDecoLayerElement(bgEl, backdrop, heroSize);
    setDecoLayerElement(frameEl, null, heroSize);
  } else {
    setDecoLayerElement(bgEl, bg, heroSize);
    setDecoLayerElement(frameEl, frame, heroSize);
  }
  const petCode = extractPetSpeciesCode(student);
  syncAccessoryDecoElement(
    accessoryEl,
    accessory,
    resolveAccessoryDecoSize("hero"),
    petCode,
  );
  if (prefix === "petProfile") {
    syncShowcaseDecoSceneClass(
      "petProfileDecoContainer",
      !!(backdrop || bg || frame || accessory),
    );
  }
}

function switchPetProfileTab(tab) {
  const tabs = document.querySelectorAll("#petProfileTabs .pet-profile-tab");
  const panes = document.querySelectorAll(
    "#petProfileTabContent .pet-profile-tab-pane",
  );
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  panes.forEach((p) => p.classList.toggle("active", p.dataset.tabPane === tab));
}

function renderPetProfile(student, records = [], honors = []) {
  const freshStudent =
    student?.id != null
      ? students.find((item) => item.id === student.id)
      : students.find((item) => item.name === student?.name);
  currentProfileStudent = freshStudent || student;
  student = currentProfileStudent;
  currentPetProfileRecords = Array.isArray(records) ? records : [];
  currentPetProfileHonors = Array.isArray(honors) ? honors : [];
  const modal = document.getElementById("petProfileModal");
  const studentNameEl = document.getElementById("petProfileStudentName");
  const nicknameEl = document.getElementById("petProfileNickname");
  const subtitle = document.getElementById("petProfileSubtitle");
  const infoList = document.getElementById("petProfileInfoList");
  const honorList = document.getElementById("petProfileHonors");
  const history = document.getElementById("petProfileHistory");
  const renameHint = document.getElementById("petProfileRenameHint");
  if (!modal || !subtitle || !infoList || !history) {
    return;
  }

  const petDisplayName = resolvePetDisplayName(student);
  const showcaseKey = getProfileShowcaseStudentKey(student);
  if (showcaseKey !== currentProfileShowcaseStudentKey) {
    updatePetProfileShowcase(student);
  }

  if (studentNameEl) studentNameEl.textContent = student.name;
  if (nicknameEl) nicknameEl.textContent = petDisplayName;

  if (renameHint) {
    if (student.lastRenameAt) {
      const nextDate = new Date(
        new Date(student.lastRenameAt).getTime() + 7 * 24 * 60 * 60 * 1000,
      );
      const now = new Date();
      if (now < nextDate) {
        const days = Math.ceil((nextDate - now) / (24 * 60 * 60 * 1000));
        renameHint.textContent = `${days}天后可再次改名`;
      } else {
        renameHint.textContent = "";
      }
    } else {
      renameHint.textContent = "";
    }
  }

  const renameRow = document.getElementById("petProfileRenameRow");
  const nicknameRow = document.querySelector(".pet-profile-nickname-row");
  if (renameRow) renameRow.style.display = "none";
  if (nicknameRow) nicknameRow.style.display = "flex";

  subtitle.textContent = `Lv.${student.lv || 1} · ${student.petStageName || "当前形态"}`;

  infoList.innerHTML = [
    ["萌宠名称", student.petName || "未命名萌宠"],
    ["当前积分", String(student.pts || 0)],
    ["荣誉勋章", `${Number(student.medals || 0)} 枚`],
    ["所属小组", student.groupName || `第${student.group}组`],
  ]
    .map(
      ([label, value]) => `
      <div class="pet-profile-info-item">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>`,
    )
    .join("");

  if (honorList) {
    const honorRows = currentPetProfileHonors.slice(0, 8);
    honorList.innerHTML =
      honorRows.length > 0
        ? honorRows
            .map((item) => {
              const iconUrl = item.honorIconUrl
                ? resolveAssetUrl(item.honorIconUrl)
                : "";
              const iconMarkup = iconUrl
                ? `<img class="pet-profile-honor-badge" src="${escapeHtml(iconUrl)}" alt="${escapeHtml(item.honorName || "荣誉")}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><i class="fa-solid fa-medal pet-profile-honor-fallback" aria-hidden="true"></i>`
                : `<i class="fa-solid fa-medal" aria-hidden="true"></i>`;
              return `
            <div class="pet-profile-honor-item">
              <div class="pet-profile-honor-icon">${iconMarkup}</div>
              <div>
                <strong>${escapeHtml(item.honorName || "荣誉")}</strong>
                <span>${escapeHtml(formatHonorGrantedTime(item.grantedAt) || "最近获得")}${item.grantedByName ? ` · ${escapeHtml(item.grantedByName)}` : ""}${item.remark ? ` · ${escapeHtml(item.remark)}` : ""}</span>
              </div>
            </div>`;
            })
            .join("")
        : '<div class="pet-profile-empty">暂无荣誉记录</div>';
  }

  const previewRecords = currentPetProfileRecords.slice(0, 12);
  setPetProfileAllHistoryButtonState({
    visible: true,
    enabled: currentPetProfileRecords.length > 0,
    text: "全部记录",
  });

  history.innerHTML =
    previewRecords.length > 0
      ? previewRecords
          .map(
            (record) => `
            <div class="pet-profile-history-item">
              <div class="pet-profile-history-main">
                <div class="pet-profile-history-title">${escapeHtml(record.title)}</div>
                <div class="pet-profile-history-meta">${escapeHtml(record.time)} · ${escapeHtml(record.actor)}${record.remark ? ` · ${escapeHtml(record.remark)}` : ""}</div>
              </div>
              <div class="pet-profile-history-diff ${record.diff >= 0 ? "pos" : "neg"}">${record.diff >= 0 ? `+${record.diff}` : record.diff}</div>
            </div>`,
          )
          .join("")
      : '<div class="pet-profile-empty">暂无积分记录</div>';

  switchPetProfileTab("honors");
  modal.classList.add("active");
}

async function openPetProfileByName(name) {
  const student = students.find((item) => item.name === name);
  if (!student || student.hasPet === false) return;
  resetPetProfileShowcase();
  currentProfileShowcaseStudentKey = null;
  renderPetProfileLoading();
  document.getElementById("petProfileModal")?.classList.add("active");
  renderPetProfile(student, [], []);
  if (!student.id) return;
  const [records, honors] = await Promise.all([
    loadPetProfileRecords(student.id).catch(() => []),
    loadStudentHonorRecords(student.id).catch(() => []),
  ]);
  const latestStudent =
    students.find((item) => item.id === student.id) || student;
  renderPetProfile(latestStudent, records, honors);
}

/* ===== 宠物改名功能 ===== */
function openPetRenameInput() {
  if (isDisplayAnimationLocked()) return;

  const student = refreshCurrentProfileStudent();
  const studentPetId = resolveStudentPetId(student);
  if (!student || !studentPetId) {
    showToast("当前宠物暂不支持改名，请刷新页面后重试", "warn");
    return;
  }
  student.studentPetId = studentPetId;

  if (student.lastRenameAt) {
    const nextDate = new Date(
      new Date(student.lastRenameAt).getTime() + 7 * 24 * 60 * 60 * 1000,
    );
    if (new Date() < nextDate) {
      const days = Math.ceil((nextDate - new Date()) / (24 * 60 * 60 * 1000));
      showToast(`改名冷却中，${days}天后可再次修改`, "warn");
      return;
    }
  }

  const nicknameRow = document.querySelector(".pet-profile-nickname-row");
  const renameRow = document.getElementById("petProfileRenameRow");
  const input = document.getElementById("petProfileRenameInput");
  if (nicknameRow) nicknameRow.style.display = "none";
  if (renameRow) renameRow.style.display = "flex";
  if (input) {
    input.removeAttribute("maxlength");
    input.value = String(student.petNickname || student.petName || "").trim();
    input.focus();
    input.select();
  }
}

function cancelPetRename() {
  const nicknameRow = document.querySelector(".pet-profile-nickname-row");
  const renameRow = document.getElementById("petProfileRenameRow");
  if (nicknameRow) nicknameRow.style.display = "flex";
  if (renameRow) renameRow.style.display = "none";
}

async function submitPetRename() {
  const student = refreshCurrentProfileStudent();
  const studentPetId = resolveStudentPetId(student);
  if (!student || !studentPetId) {
    showToast("当前宠物暂不支持改名，请刷新页面后重试", "warn");
    return;
  }
  const input = document.getElementById("petProfileRenameInput");
  const nickname = (input?.value || "").trim();
  const nicknameLength = Array.from(nickname).length;
  if (!nickname || nicknameLength < 1) {
    showToast("昵称不能为空", "warn");
    return;
  }
  if (nicknameLength > PET_NICKNAME_MAX_CHARS) {
    await showDisplayAlert({
      badge: "昵称过长",
      title: `昵称长度不能超过${PET_NICKNAME_MAX_CHARS}个字`,
      description: "请把昵称调整到4个字以内后再提交。",
      confirmText: "我知道了",
    });
    return;
  }

  // 二次确认：提醒改名后有 7 天冷却期
  const confirmed = await showConfirmModal({
    tone: "warn",
    badge: "改名确认",
    icon: "fa-pen",
    title: "确认修改萌宠昵称？",
    description: `昵称将修改为「${nickname}」。修改后将进入 7 天冷却期，期间无法再次更改，请确认无误后提交。`,
    cancelText: "再想想",
    confirmText: "确认修改",
  });
  if (!confirmed) return;

  try {
    await apiFetch(`/student-pets/${studentPetId}/rename`, {
      method: "POST",
      body: JSON.stringify({ nickname }),
    });
    student.petNickname = nickname;
    student.lastRenameAt = new Date().toISOString();
    student.studentPetId = studentPetId;
    cancelPetRename();
    renderPetProfile(
      student,
      currentPetProfileRecords,
      currentPetProfileHonors,
    );
    renderStudentGrid({ force: true });
    showToast("改名成功！", "success");
  } catch (err) {
    showToast(err.message || "改名失败", "error");
  }
}

/* ===== 装饰面板功能 ===== */
let petDecoAllDecorations = [];
let petDecoUnlockedMap = {};
let petDecoCurrentFilter = "background";
let petDecoConfirmedLayers = {};
let petDecoDraft = null;
let petDecoThemeDraft = null;
/** 装扮面板中不展示的饰品 code */
const HIDDEN_DECO_PANEL_CODES = new Set(["acc_campus_cap"]);

const PET_DECO_TYPE_LABELS = {
  background: "背景",
  frame: "边框",
  accessory: "饰品",
  theme: "主题皮肤",
  theme_backdrop: "主题氛围",
};
const THEME_BACKDROP_TYPE = "theme_backdrop";
const LEGACY_THEME_LAYER_TYPES = ["background", "frame", "accessory"];
const PET_DECO_THEME_META = {
  children_day_2026: {
    name: "六一童梦",
    subtitle: "2026 儿童节主题皮肤",
    badge: "6.1",
    accent: "#ff6b9d",
    holidayKey: "children-day",
    freeRule: { kind: "annual", month: 6, day: 1 },
  },
  mini_adventure_2026: {
    name: "迷你冒险",
    subtitle: "沙盒冒险主题皮肤",
    badge: "冒险",
    accent: "#5cb85c",
  },
  goldfish_express_2026: {
    name: "金鱼列车",
    subtitle: "治愈系水下地铁·金鱼融入氛围",
    badge: "治愈",
    accent: "#ff8c42",
  },
  arcane_library_2026: {
    name: "秘典书廊",
    subtitle: "哥特图书馆主题皮肤",
    badge: "书阁",
    accent: "#2a9d8f",
  },
  ninja_flame_2026: {
    name: "火影忍者",
    subtitle: "忍者村热血冒险主题皮肤",
    badge: "忍者",
    accent: "#ff6b35",
  },
};

function createNoneDeco(type) {
  return { isNone: true, type, id: null, name: "无" };
}

function isPetDecoNone(deco) {
  return deco?.isNone === true;
}
let petDecoChangePolicy = {
  changeCost: 10,
  freeAvailable: false,
  freeChangeKind: null,
  currentScore: 0,
};

function normalizeDecoArrayPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function mergeDecorationCatalogWithKnownState(allDecos, unlocked, equipped) {
  const merged = normalizeDecoArrayPayload(allDecos).map((item) => ({ ...item }));
  const seen = new Set();
  const remember = (item) => {
    if (!item) return;
    if (item.id != null || item.decorationId != null) {
      seen.add(`id:${item.id ?? item.decorationId}`);
    }
    const fallbackKey = `${item.type || ""}:${item.name || ""}:${item.imageUrl || item.previewUrl || ""}`;
    if (fallbackKey !== "::") {
      seen.add(fallbackKey);
    }
  };
  const addKnown = (item) => {
    if (!item) return;
    const deco = {
      id: item.id ?? item.decorationId ?? null,
      code: item.code,
      name: item.name || "未命名装扮",
      type: item.type,
      imageUrl: item.imageUrl,
      previewUrl: item.previewUrl,
      unlockLevel: item.unlockLevel ?? 1,
      sortOrder: item.sortOrder ?? 999999,
      themeGroup: item.themeGroup,
      themeFreeRule: item.themeFreeRule,
      themeFreeActive: item.themeFreeActive,
      themeFreeLabel: item.themeFreeLabel,
      knownOnly: item.id == null && item.decorationId == null,
    };
    if (!deco.type || (!deco.imageUrl && !deco.previewUrl)) return;
    const key =
      deco.id != null
        ? `id:${deco.id}`
        : `${deco.type}:${deco.name}:${deco.imageUrl || deco.previewUrl || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(deco);
  };

  merged.forEach(remember);
  normalizeDecoArrayPayload(unlocked).forEach(addKnown);
  normalizeDecoArrayPayload(equipped).forEach(addKnown);
  return merged;
}

function syncConfirmedLayersFromStudent() {
  petDecoConfirmedLayers = {};
  const student = currentProfileStudent;
  (student?.equippedDecorations || []).forEach((d) => {
    const full = petDecoAllDecorations.find(
      (item) =>
        item.type === d.type &&
        (item.name === d.name || item.imageUrl === d.imageUrl),
    );
    petDecoConfirmedLayers[d.type] = full ? { ...full } : { ...d };
  });
}

function clearDecoDraft() {
  petDecoDraft = null;
  petDecoThemeDraft = null;
}

function resolvePetDecoThemeMeta(themeGroup) {
  return (
    PET_DECO_THEME_META[themeGroup] || {
      name: themeGroup,
      subtitle: "主题皮肤",
      badge: "主题",
      accent: "#2980b9",
    }
  );
}

function resolveThemeFreeRule(themeGroup) {
  const fromCatalog = petDecoAllDecorations.find(
    (deco) => deco.themeGroup === themeGroup && deco.themeFreeRule,
  );
  return fromCatalog?.themeFreeRule || PET_DECO_THEME_META[themeGroup]?.freeRule || null;
}

function formatLocalYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isThemeFreeRuleActive(rule, date = getDisplayHolidayEvaluationDate()) {
  if (!rule || typeof rule !== "object") return false;
  if (rule.kind === "annual") {
    const month = Number(rule.month);
    const day = Number(rule.day);
    return date.getMonth() + 1 === month && date.getDate() === day;
  }
  if (rule.kind === "range") {
    const ymd = formatLocalYmd(date);
    return ymd >= rule.start && ymd <= rule.end;
  }
  return false;
}

function isPetDecoThemeFreeToday(themeGroup) {
  return isThemeFreeRuleActive(resolveThemeFreeRule(themeGroup));
}

function isPetDecoFreeToday(deco) {
  if (!deco?.themeGroup) return false;
  return isPetDecoThemeFreeToday(deco.themeGroup);
}

function describeThemeFreeRuleLabel(themeGroup) {
  const rule = resolveThemeFreeRule(themeGroup);
  if (!rule) return "";
  if (rule.kind === "annual") {
    return `每年 ${rule.month} 月 ${rule.day} 日限时免费`;
  }
  if (rule.start === rule.end) {
    return `${rule.start} 限时免费`;
  }
  return `${rule.start} 至 ${rule.end} 限时免费`;
}

function resolveThemeCompositionFromItems(items) {
  const byType = new Map();
  items.forEach((row) => {
    if (!byType.has(row.type)) byType.set(row.type, row);
  });
  const backdrop = byType.get(THEME_BACKDROP_TYPE);
  if (backdrop) {
    const pieces = [backdrop];
    const accessory = byType.get("accessory");
    if (accessory) pieces.push(accessory);
    return { mode: "composite", pieces };
  }
  const legacyPieces = LEGACY_THEME_LAYER_TYPES.map((type) => byType.get(type)).filter(
    Boolean,
  );
  if (legacyPieces.length < LEGACY_THEME_LAYER_TYPES.length) return null;
  return { mode: "layers", pieces: legacyPieces };
}

function listPetDecoThemeGroupsRaw() {
  const groups = new Map();
  petDecoAllDecorations.forEach((deco) => {
    if (!deco.themeGroup) return;
    if (!groups.has(deco.themeGroup)) {
      groups.set(deco.themeGroup, {
        key: deco.themeGroup,
        items: [],
      });
    }
    groups.get(deco.themeGroup).items.push(deco);
  });
  return [...groups.values()];
}

function listPetDecoThemes() {
  return listPetDecoThemeGroupsRaw().filter((group) =>
    resolveThemeCompositionFromItems(group.items),
  );
}

function getThemeLayerDecos(themeGroup) {
  const group = listPetDecoThemes().find((item) => item.key === themeGroup);
  const empty = {
    mode: null,
    themeBackdrop: null,
    background: null,
    frame: null,
    accessory: null,
    pieces: [],
  };
  if (!group) return empty;
  const composition = resolveThemeCompositionFromItems(group.items);
  if (!composition) return empty;
  const byType = Object.fromEntries(
    composition.pieces.map((piece) => [piece.type, piece]),
  );
  return {
    mode: composition.mode,
    themeBackdrop: byType[THEME_BACKDROP_TYPE] || null,
    background: byType.background || null,
    frame: byType.frame || null,
    accessory: byType.accessory || null,
    pieces: composition.pieces,
  };
}

function getThemePreviewDeco(themeGroup) {
  const layers = getThemeLayerDecos(themeGroup);
  return layers.themeBackdrop || layers.background || null;
}

function describeThemeEquipLayersText(mode, pieces = []) {
  if (mode === "composite") {
    const hasAccessory = pieces.some((item) => item?.type === "accessory");
    return hasAccessory ? "主题氛围与饰品" : "主题氛围";
  }
  return "背景、边框与饰品";
}

function isThemeFullyEquipped(themeGroup) {
  const layers = getThemeLayerDecos(themeGroup);
  if (layers.pieces.length === 0) return false;
  const equipped = currentProfileStudent?.equippedDecorations || [];
  return layers.pieces.every((piece) =>
    equipped.some((item) => isSameDeco(item, piece)),
  );
}

function getActiveLayerChoice(type) {
  if (petDecoDraft?.type === type) return petDecoDraft.value;
  return petDecoConfirmedLayers[type] || null;
}

function revertDecoPreviewToEquipped() {
  clearDecoDraft();
  syncConfirmedLayersFromStudent();
  renderDecoPreviewLayers();
  renderDecorationGrid();
  updateDecoPreviewActions();
}

function resolvePreviewLayerDeco(type, selected) {
  if (isPetDecoNone(selected)) return null;
  if (!selected) return null;
  if (selected.imageUrl || selected.previewUrl) return selected;
  return (
    petDecoAllDecorations.find(
      (d) => d.type === type && d.id === selected.id,
    ) || null
  );
}

function resolveEquippedDecoRecord(equipped) {
  if (!equipped) return null;
  return (
    petDecoAllDecorations.find(
      (d) =>
        d.type === equipped.type &&
        (d.id === equipped.id ||
          d.name === equipped.name ||
          d.imageUrl === equipped.imageUrl),
    ) || equipped
  );
}

function getEquippedDecoByType(type) {
  const student = currentProfileStudent;
  const equipped = student?.equippedDecorations?.find((d) => d.type === type);
  return resolveEquippedDecoRecord(equipped);
}

function isSameDeco(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.id != null && b.id != null) return a.id === b.id;
  return a.name === b.name || a.imageUrl === b.imageUrl;
}

function isHiddenDecorationInPanel(deco) {
  const code = resolveDecoCode(deco);
  return code ? HIDDEN_DECO_PANEL_CODES.has(code) : false;
}

/** 已装备项排在「无xx」之后的第一位，其余保持 sortOrder */
function sortDecorationsWithEquippedFirst(items, type) {
  const equipped = getEquippedDecoByType(type);
  if (!equipped) return items;
  return [...items].sort((a, b) => {
    const aFirst = isSameDeco(a, equipped) ? 0 : 1;
    const bFirst = isSameDeco(b, equipped) ? 0 : 1;
    if (aFirst !== bFirst) return aFirst - bFirst;
    return (
      (a.sortOrder ?? 999999) - (b.sortOrder ?? 999999) ||
      (a.id ?? 0) - (b.id ?? 0)
    );
  });
}

function sortThemesWithEquippedFirst(themes) {
  return [...themes].sort((a, b) => {
    const aFirst = isThemeFullyEquipped(a.key) ? 0 : 1;
    const bFirst = isThemeFullyEquipped(b.key) ? 0 : 1;
    return aFirst - bFirst;
  });
}

function hasPendingDecoChange(type) {
  if (type === "theme") {
    return !!petDecoThemeDraft && !isThemeFullyEquipped(petDecoThemeDraft);
  }
  if (petDecoDraft?.type !== type) return false;
  const draft = petDecoDraft.value;
  const equipped = getEquippedDecoByType(type);
  if (isPetDecoNone(draft)) return !!equipped;
  if (!draft) return false;
  return !isSameDeco(draft, equipped);
}

function updateDecoPreviewActions() {
  const actions = document.getElementById("petDecoPreviewActions");
  const confirmBtn = document.getElementById("petDecoPreviewConfirmBtn");
  if (!actions) return;
  const type = petDecoCurrentFilter;
  const show = hasPendingDecoChange(type);
  actions.hidden = !show;
  actions.style.display = show ? "flex" : "none";
  if (confirmBtn) {
    const label = PET_DECO_TYPE_LABELS[type] || "装扮";
    const isRemove =
      type === "theme"
        ? false
        : isPetDecoNone(
            petDecoDraft?.type === type ? petDecoDraft.value : null,
          );
    confirmBtn.textContent =
      type === "theme"
        ? "确认更换主题皮肤"
        : isRemove
          ? `确认移除${label}`
          : `确认更换${label}`;
  }
}

function previewSelectNone(type) {
  petDecoDraft = { type, value: createNoneDeco(type) };
  renderDecoPreviewLayers();
  renderDecorationGrid();
  updateDecoPreviewActions();
}

function confirmPendingDecoChange() {
  const type = petDecoCurrentFilter;
  if (!hasPendingDecoChange(type)) return;

  if (type === "theme") {
    if (!petDecoThemeDraft) return;
    void requestThemeChangeConfirm(petDecoThemeDraft, "equip");
    return;
  }

  if (petDecoDraft?.type !== type) return;

  const selected = petDecoDraft.value;
  if (isPetDecoNone(selected)) {
    const equipped = getEquippedDecoByType(type);
    const full = resolveEquippedDecoRecord(equipped);
    if (full?.id) void requestDecoChangeConfirm(full, "unequip");
    return;
  }

  const full =
    petDecoAllDecorations.find(
      (d) => d.id === selected?.id || d.name === selected?.name,
    ) || selected;
  if (full?.id) void requestDecoChangeConfirm(full, "equip");
}

function isPetDecoLevelLocked(deco, currentLevel) {
  const unlockLevel = deco?.unlockLevel ?? 1;
  return unlockLevel > 1 && (currentLevel ?? 1) < unlockLevel;
}

function ensurePetDecoStateRecord(deco) {
  if (!petDecoUnlockedMap[deco.id]) {
    petDecoUnlockedMap[deco.id] = {
      decorationId: deco.id,
      code: deco.code,
      name: deco.name,
      type: deco.type,
      unlockLevel: deco.unlockLevel ?? 1,
      isEquipped: false,
    };
  }
  return petDecoUnlockedMap[deco.id];
}

function renderDecoChangePolicyHint() {
  const hint = document.getElementById("petDecoPolicyHint");
  if (!hint) return;

  if (petDecoCurrentFilter === "theme") {
    const freeThemes = listPetDecoThemes().filter((theme) =>
      isPetDecoThemeFreeToday(theme.key),
    );
    if (freeThemes.length > 0) {
      const names = freeThemes
        .map((theme) => resolvePetDecoThemeMeta(theme.key).name)
        .join("、");
      hint.textContent = `「${names}」今日限时免费（不扣积分，不消耗免费更换次数）`;
      hint.className = "pet-deco-policy-hint pet-deco-policy-hint--free";
      return;
    }
  }

  const cost = petDecoChangePolicy.changeCost ?? 10;
  if (petDecoChangePolicy.freeAvailable) {
    hint.textContent =
      petDecoChangePolicy.freeChangeKind === "levelup"
        ? "本次升级赠送 1 次免费更换机会"
        : "您有 1 次免费更换机会（不扣积分）";
    hint.className = "pet-deco-policy-hint pet-deco-policy-hint--free";
    return;
  }
  if (cost <= 0) {
    hint.textContent = "更换装扮暂不消耗积分";
    hint.className = "pet-deco-policy-hint";
    return;
  }
  hint.textContent = `更换装扮消耗 ${cost} 积分（当前 ${petDecoChangePolicy.currentScore ?? 0} 积分）`;
  hint.className = "pet-deco-policy-hint";
}

function syncPetProfileInfoScore(score) {
  const infoList = document.getElementById("petProfileInfoList");
  if (!infoList) return;
  infoList.querySelectorAll(".pet-profile-info-item").forEach((row) => {
    const label = row.querySelector("span");
    const value = row.querySelector("strong");
    if (label?.textContent === "当前积分" && value) {
      value.textContent = String(score);
    }
  });
}

function resetDecorationPanelScroll() {
  const grid = document.getElementById("petDecoGrid");
  if (grid) grid.scrollTop = 0;
}

async function openDecorationPanel() {
  if (isDisplayAnimationLocked()) return;

  const student = refreshCurrentProfileStudent();
  const studentPetId = resolveStudentPetId(student);
  if (!student || !studentPetId) {
    showToast("当前宠物不支持装扮，请刷新页面后重试", "warn");
    return;
  }
  student.studentPetId = studentPetId;

  const panel = document.getElementById("petDecoPanel");
  if (panel) panel.classList.add("active");
  resetDecorationPanelScroll();

  const previewAvatar = document.getElementById("petDecoPreviewAvatar");
  if (previewAvatar) {
    previewAvatar.src = petImgVariant(student, isLowSpecMode() ? 400 : 1024);
    previewAvatar.onerror = () => {
      previewAvatar.onerror = null;
      previewAvatar.src = petImgVariant(student, 400);
    };
  }

  const currentDecos = student.equippedDecorations || [];
  petDecoConfirmedLayers = {};
  clearDecoDraft();
  currentDecos.forEach((d) => {
    petDecoConfirmedLayers[d.type] = { ...d };
  });
  renderDecoPreviewLayers();

  const classId = runtimeState.classId;
  const [allDecosResult, unlockedResult, policyResult] = await Promise.allSettled([
    classId
      ? apiFetch(`/display/classes/${classId}/pet-decorations`)
      : Promise.resolve([]),
    apiFetch(`/student-pets/${studentPetId}/decorations`),
    apiFetch(`/student-pets/${studentPetId}/decorations/change-policy`),
  ]);
  const allDecos =
    allDecosResult.status === "fulfilled"
      ? normalizeDecoArrayPayload(allDecosResult.value)
      : [];
  const unlocked =
    unlockedResult.status === "fulfilled"
      ? normalizeDecoArrayPayload(unlockedResult.value)
      : [];
  if (allDecosResult.status === "rejected") {
    console.warn("加载班级装扮列表失败", allDecosResult.reason);
  }
  if (unlockedResult.status === "rejected") {
    console.warn("加载学生已解锁装扮失败", unlockedResult.reason);
  }
  if (policyResult.status === "rejected") {
    console.warn("加载装扮更换策略失败", policyResult.reason);
  }

  petDecoAllDecorations = mergeDecorationCatalogWithKnownState(
    allDecos,
    unlocked,
    currentDecos,
  );
  petDecoUnlockedMap = {};
  unlocked.forEach((d) => {
    if (d.decorationId != null) {
      petDecoUnlockedMap[d.decorationId] = d;
    }
  });
  currentDecos.forEach((d) => {
    const matched = petDecoAllDecorations.find((item) => isSameDeco(item, d));
    if (matched?.id != null && !petDecoUnlockedMap[matched.id]) {
      petDecoUnlockedMap[matched.id] = {
        decorationId: matched.id,
        code: matched.code,
        name: matched.name,
        type: matched.type,
        unlockLevel: matched.unlockLevel ?? 1,
        isEquipped: true,
      };
    }
  });
  warmDecoAssetCache(petDecoAllDecorations, resolveDecoPreviewSize());
  const policyData =
    policyResult.status === "fulfilled"
      ? (policyResult.value?.data ?? policyResult.value ?? {})
      : {};
  petDecoChangePolicy = {
    changeCost: policyData.changeCost ?? 10,
    freeAvailable: !!policyData.freeAvailable,
    freeChangeKind: policyData.freeChangeKind ?? null,
    currentScore: policyData.currentScore ?? student.pts ?? 0,
  };
  revertDecoPreviewToEquipped();

  renderDecoChangePolicyHint();

  const defaultFilter = "theme";
  petDecoCurrentFilter = defaultFilter;
  clearDecoDraft();
  document
    .querySelectorAll("#petDecoFilter .pet-deco-filter-btn")
    .forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === defaultFilter);
    });
  renderDecorationGrid();
  resetDecorationPanelScroll();
  updateDecoPreviewActions();
}

function closeDecorationPanel() {
  const panel = document.getElementById("petDecoPanel");
  if (panel) panel.classList.remove("active");
  clearDecoDraft();
  resetDecorationPanelScroll();
}

function filterDecorations(type) {
  clearDecoDraft();
  petDecoCurrentFilter = type;
  document
    .querySelectorAll("#petDecoFilter .pet-deco-filter-btn")
    .forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === type);
    });
  renderDecorationGrid();
  resetDecorationPanelScroll();
  renderDecoPreviewLayers();
  renderDecoChangePolicyHint();
  updateDecoPreviewActions();
}

function renderDecorationGrid() {
  const grid = document.getElementById("petDecoGrid");
  if (!grid) return;
  if (petDecoCurrentFilter === "theme") {
    renderThemeGrid();
    return;
  }
  const student = currentProfileStudent;
  const currentLevel = student?.lv || 1;
  const equippedSet = new Set(
    (student?.equippedDecorations || []).map((d) => String(d.name)),
  );

  const filtered = sortDecorationsWithEquippedFirst(
    petDecoAllDecorations.filter(
      (d) =>
        d.type === petDecoCurrentFilter && !isHiddenDecorationInPanel(d),
    ),
    petDecoCurrentFilter,
  );
  const typeLabel = PET_DECO_TYPE_LABELS[petDecoCurrentFilter] || "装饰";
  const gridSelection = getActiveLayerChoice(petDecoCurrentFilter);
  const noneSelected = isPetDecoNone(gridSelection);
  const noneEquipped = !getEquippedDecoByType(petDecoCurrentFilter);
  const noneCard = `
    <div class="pet-deco-card pet-deco-card--none${noneSelected ? " selected" : ""}${noneEquipped ? " equipped" : ""}"
      onclick="previewSelectNone('${petDecoCurrentFilter}')">
      ${noneEquipped ? '<span class="pet-deco-card-badge badge-equipped">当前</span>' : ""}
      <div class="pet-deco-card-none-icon" aria-hidden="true"><i class="fa-solid fa-ban"></i></div>
      <div class="pet-deco-card-name">无${typeLabel}</div>
    </div>`;

  grid.innerHTML =
    noneCard +
    (filtered.length > 0
      ? filtered
          .map((deco) => {
            const isLevelLocked = isPetDecoLevelLocked(deco, currentLevel);
            const unlocked = petDecoUnlockedMap[deco.id];
            const isEquipped = unlocked?.isEquipped === true;
            const selection = getActiveLayerChoice(deco.type);
            const isSelected =
              !isPetDecoNone(selection) && isSameDeco(selection, deco);
            const previewSrc = resolveDecoAssetUrl(deco, 400);
            const badge = isEquipped
              ? `<span class="pet-deco-card-badge badge-equipped">已装备</span>`
              : isLevelLocked
                ? `<span class="pet-deco-card-badge badge-locked"><i class="fa-solid fa-lock"></i> Lv.${deco.unlockLevel}</span>`
                : "";
            const classes = ["pet-deco-card"];
            if (isEquipped) classes.push("equipped");
            if (isLevelLocked) classes.push("locked");
            if (isSelected && !isLevelLocked) classes.push("selected");
            const onclick = isLevelLocked
              ? ""
              : `onclick="previewDecoration(${deco.id})"`;
            return `<div class="${classes.join(" ")}" ${onclick}>
          ${badge}
          <img class="pet-deco-card-img" src="${escapeHtml(previewSrc)}" alt="${escapeHtml(deco.name)}" loading="eager" decoding="async" onerror="this.style.display='none'">
          <div class="pet-deco-card-name">${escapeHtml(deco.name)}</div>
        </div>`;
          })
          .join("")
      : `<div class="pet-profile-empty" style="grid-column:1/-1">暂无其他${typeLabel}可选</div>`);
}

function renderThemeGrid() {
  const grid = document.getElementById("petDecoGrid");
  if (!grid) return;
  const student = currentProfileStudent;
  const currentLevel = student?.lv || 1;
  const themes = sortThemesWithEquippedFirst(listPetDecoThemes());

  if (themes.length === 0) {
    grid.innerHTML =
      '<div class="pet-profile-empty" style="grid-column:1/-1">暂无主题皮肤，敬请期待</div>';
    return;
  }

  grid.innerHTML = themes
    .map((theme) => {
      const meta = resolvePetDecoThemeMeta(theme.key);
      const layers = getThemeLayerDecos(theme.key);
      const previewDeco = getThemePreviewDeco(theme.key);
      const previewSrc = previewDeco
        ? resolveDecoAssetUrl(previewDeco, 400)
        : "";
      const locked = layers.pieces.some(
        (item) => item && isPetDecoLevelLocked(item, currentLevel),
      );
      const equipped = isThemeFullyEquipped(theme.key);
      const selected = petDecoThemeDraft === theme.key;
      const freeToday = isPetDecoThemeFreeToday(theme.key);
      const classes = ["pet-deco-card", "pet-deco-theme-card"];
      if (equipped) classes.push("equipped");
      if (locked) classes.push("locked");
      if (selected && !locked) classes.push("selected");
      if (freeToday) classes.push("free-today");
      const badge = equipped
        ? '<span class="pet-deco-card-badge badge-equipped">已装备</span>'
        : freeToday
          ? '<span class="pet-deco-card-badge badge-free-today">今日免费</span>'
          : `<span class="pet-deco-theme-badge">${escapeHtml(meta.badge)}</span>`;
      const freeHint = freeToday
        ? `<div class="pet-deco-theme-free-hint">${escapeHtml(describeThemeFreeRuleLabel(theme.key))}</div>`
        : `<div class="pet-deco-theme-subtitle">${escapeHtml(meta.subtitle)}</div>`;
      const onclick = locked ? "" : `onclick="previewTheme('${theme.key}')"`;
      return `<div class="${classes.join(" ")}" ${onclick} style="--theme-accent:${escapeHtml(meta.accent)}">
        ${badge}
        <img class="pet-deco-card-img" src="${escapeHtml(previewSrc)}" alt="${escapeHtml(meta.name)}" loading="eager" decoding="async" onerror="this.style.display='none'">
        <div class="pet-deco-card-name">${escapeHtml(meta.name)}</div>
        ${freeHint}
      </div>`;
    })
    .join("");
}

function previewTheme(themeGroup) {
  const layers = getThemeLayerDecos(themeGroup);
  const student = refreshCurrentProfileStudent();
  const currentLevel = student?.lv || 1;
  const locked = layers.pieces.some(
    (item) => item && isPetDecoLevelLocked(item, currentLevel),
  );
  if (locked) return;

  petDecoDraft = null;
  petDecoThemeDraft = themeGroup;
  renderDecoPreviewLayers();
  renderDecorationGrid();
  updateDecoPreviewActions();
}

function previewDecoration(decorationId) {
  const deco = petDecoAllDecorations.find((d) => d.id === decorationId);
  if (!deco) return;

  const student = refreshCurrentProfileStudent();
  if (isPetDecoLevelLocked(deco, student?.lv || 1)) return;

  petDecoDraft = {
    type: deco.type,
    value: { ...deco, imageUrl: deco.imageUrl },
  };
  petDecoThemeDraft = null;

  renderDecoPreviewLayers();
  renderDecorationGrid();
  updateDecoPreviewActions();
}

async function requestDecoChangeConfirm(deco, action) {
  const student = refreshCurrentProfileStudent();
  const studentPetId = resolveStudentPetId(student);
  if (!student || !studentPetId || !deco?.id) return;

  if (action === "equip" && isPetDecoLevelLocked(deco, student.lv || 1)) return;

  const unlocked = ensurePetDecoStateRecord(deco);
  const typeLabel = PET_DECO_TYPE_LABELS[deco.type] || "装饰";

  if (action === "equip" && unlocked.isEquipped) {
    revertDecoPreviewToEquipped();
    return;
  }

  if (action === "unequip" && !unlocked.isEquipped) {
    revertDecoPreviewToEquipped();
    return;
  }

  const cost = petDecoChangePolicy.changeCost ?? 10;
  const pts = student.pts ?? petDecoChangePolicy.currentScore ?? 0;
  const themeFreeToday = action === "equip" && isPetDecoFreeToday(deco);

  if (
    action === "equip" &&
    !themeFreeToday &&
    !petDecoChangePolicy.freeAvailable &&
    cost > 0 &&
    pts < cost
  ) {
    await showDisplayAlert({
      title: "积分不足",
      description: `更换装扮需要 ${cost} 积分，当前仅有 ${pts} 积分。`,
    });
    revertDecoPreviewToEquipped();
    return;
  }

  const description =
    action === "unequip"
      ? `确定移除当前${typeLabel}「${deco.name}」吗？不消耗积分。`
      : themeFreeToday
        ? `今天是主题皮肤限时免费日，确定装备「${deco.name}」吗？不扣积分，也不消耗免费更换次数。`
        : petDecoChangePolicy.freeAvailable
          ? petDecoChangePolicy.freeChangeKind === "levelup"
            ? `确定装备「${deco.name}」吗？将使用本次升级赠送的 1 次免费更换机会（不扣积分）。`
            : `确定装备「${deco.name}」吗？将使用 1 次免费更换机会（不扣积分）。`
          : cost <= 0
            ? `确定装备「${deco.name}」吗？本次不消耗积分。`
            : `确定装备「${deco.name}」吗？将消耗 ${cost} 积分（当前 ${pts} 积分）。`;

  const confirmed = await showConfirmModal({
    tone:
      action === "equip" && !themeFreeToday && !petDecoChangePolicy.freeAvailable
        ? "warn"
        : "success",
    badge: "更换装扮",
    icon: "fa-palette",
    title: action === "unequip" ? `确认移除${typeLabel}` : "确认更换装扮",
    description,
    confirmText: action === "unequip" ? "确认移除" : "确认装备",
  });

  if (!confirmed) {
    revertDecoPreviewToEquipped();
    return;
  }

  petDecoDraft = null;
  await performEquipDecoration(deco, action);
}

async function requestThemeChangeConfirm(themeGroup, action) {
  const student = refreshCurrentProfileStudent();
  const studentPetId = resolveStudentPetId(student);
  if (!student || !studentPetId || !themeGroup) return;

  const meta = resolvePetDecoThemeMeta(themeGroup);
  const layers = getThemeLayerDecos(themeGroup);
  const layerText = describeThemeEquipLayersText(layers.mode, layers.pieces);
  const currentLevel = student.lv || 1;
  const locked = layers.pieces.some(
    (item) => item && isPetDecoLevelLocked(item, currentLevel),
  );
  if (action === "equip" && locked) return;

  if (action === "equip" && isThemeFullyEquipped(themeGroup)) {
    revertDecoPreviewToEquipped();
    return;
  }

  const cost = petDecoChangePolicy.changeCost ?? 10;
  const pts = student.pts ?? petDecoChangePolicy.currentScore ?? 0;
  const themeFreeToday = action === "equip" && isPetDecoThemeFreeToday(themeGroup);

  if (
    action === "equip" &&
    !themeFreeToday &&
    !petDecoChangePolicy.freeAvailable &&
    cost > 0 &&
    pts < cost
  ) {
    await showDisplayAlert({
      title: "积分不足",
      description: `更换主题皮肤需要 ${cost} 积分，当前仅有 ${pts} 积分。`,
    });
    revertDecoPreviewToEquipped();
    return;
  }

  const description =
    action === "unequip"
      ? `确定卸下主题皮肤「${meta.name}」吗？将移除该主题的${layerText}，不消耗积分。`
      : themeFreeToday
        ? `今天是「${meta.name}」限时免费日，确定装备吗？将一次性更换${layerText}，不扣积分，也不消耗免费更换次数。`
        : petDecoChangePolicy.freeAvailable
          ? petDecoChangePolicy.freeChangeKind === "levelup"
            ? `确定装备主题皮肤「${meta.name}」吗？将一次性更换${layerText}，并使用本次升级赠送的 1 次免费更换机会（不扣积分）。`
            : `确定装备主题皮肤「${meta.name}」吗？将一次性更换${layerText}，并使用 1 次免费更换机会（不扣积分）。`
          : cost <= 0
            ? `确定装备主题皮肤「${meta.name}」吗？将一次性更换${layerText}。`
            : `确定装备主题皮肤「${meta.name}」吗？将一次性更换${layerText}，并消耗 ${cost} 积分（当前 ${pts} 积分）。`;

  const confirmed = await showConfirmModal({
    tone:
      action === "equip" && !themeFreeToday && !petDecoChangePolicy.freeAvailable
        ? "warn"
        : "success",
    badge: "主题皮肤",
    icon: "fa-wand-magic-sparkles",
    title: action === "unequip" ? "确认卸下主题皮肤" : "确认更换主题皮肤",
    description,
    confirmText: action === "unequip" ? "确认卸下" : "确认装备",
  });

  if (!confirmed) {
    revertDecoPreviewToEquipped();
    return;
  }

  clearDecoDraft();
  await performEquipTheme(themeGroup, action);
}

async function performEquipTheme(themeGroup, action) {
  const student = refreshCurrentProfileStudent();
  const studentPetId = resolveStudentPetId(student);
  if (!student || !studentPetId) return;

  const layers = getThemeLayerDecos(themeGroup);
  const pieces = layers.pieces;
  if (pieces.length === 0) {
    showToast("主题皮肤素材不完整", "warn");
    return;
  }

  const themeEquipTypes =
    layers.mode === "composite"
      ? [THEME_BACKDROP_TYPE, "accessory", "background", "frame"]
      : ["background", "frame", "accessory"];

  try {
    const resp = await apiFetch(
      `/student-pets/${studentPetId}/decorations/equip-theme`,
      {
        method: "POST",
        body: JSON.stringify({ themeGroup, action }),
      },
    );
    const data = resp?.data ?? resp ?? {};

    if (action === "equip") {
      Object.values(petDecoUnlockedMap).forEach((item) => {
        const decoInfo = petDecoAllDecorations.find(
          (ad) => ad.id === item.decorationId,
        );
        if (decoInfo && themeEquipTypes.includes(decoInfo.type)) {
          item.isEquipped = false;
        }
      });
      pieces.forEach((piece) => {
        const record = ensurePetDecoStateRecord(piece);
        record.isEquipped = true;
        petDecoConfirmedLayers[piece.type] = {
          ...piece,
          imageUrl: piece.imageUrl,
        };
      });
      if (layers.mode === "composite") {
        delete petDecoConfirmedLayers.background;
        delete petDecoConfirmedLayers.frame;
      }
    } else {
      pieces.forEach((piece) => {
        const record = petDecoUnlockedMap[piece.id];
        if (record) record.isEquipped = false;
        delete petDecoConfirmedLayers[piece.type];
      });
    }

    student.equippedDecorations = Object.values(petDecoUnlockedMap)
      .filter((item) => item.isEquipped)
      .map((item) => {
        const info = petDecoAllDecorations.find(
          (ad) => ad.id === item.decorationId,
        );
        return info
          ? {
              type: info.type,
              code: info.code,
              imageUrl: info.imageUrl,
              previewUrl: info.previewUrl,
              name: info.name,
            }
          : null;
      })
      .filter(Boolean);

    if (typeof data.currentScore === "number") {
      student.pts = data.currentScore;
      petDecoChangePolicy.currentScore = data.currentScore;
      syncPetProfileInfoScore(data.currentScore);
    }
    petDecoChangePolicy.freeAvailable = !!data.freeAvailable;
    petDecoChangePolicy.freeChangeKind = data.freeChangeKind ?? null;

    const meta = resolvePetDecoThemeMeta(themeGroup);
    if (data.usedThemeFreePromo) {
      showToast(`「${meta.name}」限时免费，已装备主题皮肤`, "success");
    } else if (data.usedFreeChange) {
      showToast(
        data.freeChangeKindUsed === "levelup"
          ? "已使用升级免费更换机会"
          : "已使用免费更换机会",
        "success",
      );
    } else if (data.costPaid > 0) {
      showToast(`主题皮肤已更换，消耗 ${data.costPaid} 积分`, "success");
    } else if (action === "equip") {
      showToast(`已装备主题皮肤「${meta.name}」`, "success");
    } else {
      showToast("已卸下主题皮肤", "info");
    }

    clearDecoDraft();
    renderDecoChangePolicyHint();
    renderDecorationGrid();
    updateDecoPreviewActions();
    renderPetProfileDecoLayers(student);
    renderStudentGrid({ force: true });
    closeDecorationPanel();
  } catch (err) {
    revertDecoPreviewToEquipped();
    showToast(err.message || "更换失败", "error");
  }
}

function resolvePreviewBackdropAndFrame() {
  if (
    petDecoDraft?.type === "background" ||
    petDecoDraft?.type === "frame"
  ) {
    return {
      bg: resolvePreviewLayerDeco(
        "background",
        getActiveLayerChoice("background"),
      ),
      frame: resolvePreviewLayerDeco("frame", getActiveLayerChoice("frame")),
    };
  }

  const backdropEquipped = getEquippedDecoByType(THEME_BACKDROP_TYPE);
  if (backdropEquipped) {
    return { bg: backdropEquipped, frame: null };
  }

  return {
    bg: resolvePreviewLayerDeco(
      "background",
      getActiveLayerChoice("background"),
    ),
    frame: resolvePreviewLayerDeco("frame", getActiveLayerChoice("frame")),
  };
}

function renderDecoPreviewLayers() {
  let bg;
  let frame;
  let accessory;
  if (petDecoThemeDraft) {
    const layers = getThemeLayerDecos(petDecoThemeDraft);
    if (layers.themeBackdrop) {
      bg = layers.themeBackdrop;
      frame = null;
    } else {
      bg = layers.background;
      frame = layers.frame;
    }
    accessory = layers.accessory;
  } else {
    const previewLayers = resolvePreviewBackdropAndFrame();
    bg = previewLayers.bg;
    frame = previewLayers.frame;
    accessory = resolvePreviewLayerDeco(
      "accessory",
      getActiveLayerChoice("accessory"),
    );
  }
  const bgEl = document.getElementById("petDecoPreviewBg");
  const frameEl = document.getElementById("petDecoPreviewFrame");
  const accessoryEl = document.getElementById("petDecoPreviewAccessory");
  const previewSize = resolveDecoPreviewSize();
  setDecoLayerElement(bgEl, bg, previewSize);
  setDecoLayerElement(frameEl, frame, previewSize);
  const student = refreshCurrentProfileStudent();
  const petCode = extractPetSpeciesCode(student);
  syncAccessoryDecoElement(
    accessoryEl,
    accessory,
    resolveAccessoryDecoSize("preview"),
    petCode,
  );
  syncShowcaseDecoSceneClass(
    "petDecoPreviewContainer",
    !!(bg || frame || accessory),
  );
}

async function performEquipDecoration(deco, action) {
  const student = refreshCurrentProfileStudent();
  const studentPetId = resolveStudentPetId(student);
  if (!student || !studentPetId) return;

  if (isPetDecoLevelLocked(deco, student.lv || 1)) return;

  const unlocked = ensurePetDecoStateRecord(deco);

  try {
    const resp = await apiFetch(
      `/student-pets/${studentPetId}/decorations/equip`,
      {
        method: "POST",
        body: JSON.stringify({ decorationId: deco.id, action }),
      },
    );
    const data = resp?.data ?? resp ?? {};

    if (action === "equip") {
      Object.values(petDecoUnlockedMap).forEach((d) => {
        const decoInfo = petDecoAllDecorations.find(
          (ad) => ad.id === d.decorationId,
        );
        if (!decoInfo) return;
        if (decoInfo.type === deco.type) d.isEquipped = false;
        if (
          deco.type === THEME_BACKDROP_TYPE &&
          (decoInfo.type === "background" || decoInfo.type === "frame")
        ) {
          d.isEquipped = false;
        }
        if (
          (deco.type === "background" || deco.type === "frame") &&
          decoInfo.type === THEME_BACKDROP_TYPE
        ) {
          d.isEquipped = false;
        }
      });
      unlocked.isEquipped = true;
    } else {
      unlocked.isEquipped = false;
    }

    const equipped = Object.values(petDecoUnlockedMap)
      .filter((d) => d.isEquipped)
      .map((d) => {
        const info = petDecoAllDecorations.find(
          (ad) => ad.id === d.decorationId,
        );
        return info
          ? {
              type: info.type,
              code: info.code,
              imageUrl: info.imageUrl,
              previewUrl: info.previewUrl,
              name: info.name,
            }
          : null;
      })
      .filter(Boolean);
    student.equippedDecorations = equipped;

    if (typeof data.currentScore === "number") {
      student.pts = data.currentScore;
      petDecoChangePolicy.currentScore = data.currentScore;
      syncPetProfileInfoScore(data.currentScore);
    }
    petDecoChangePolicy.freeAvailable = !!data.freeAvailable;
    petDecoChangePolicy.freeChangeKind = data.freeChangeKind ?? null;

    if (data.usedThemeFreePromo) {
      showToast("主题皮肤限时免费，装扮已更换", "success");
    } else if (data.usedFreeChange) {
      showToast(
        data.freeChangeKindUsed === "levelup"
          ? "已使用升级免费更换机会"
          : "已使用免费更换机会",
        "success",
      );
    } else if (data.costPaid > 0) {
      showToast(`装扮已更换，消耗 ${data.costPaid} 积分`, "success");
    } else if (action === "equip") {
      showToast("装扮已更换", "success");
    } else {
      showToast("已卸下装饰", "info");
    }

    if (action === "equip") {
      petDecoConfirmedLayers[deco.type] = { ...deco, imageUrl: deco.imageUrl };
      if (deco.type === THEME_BACKDROP_TYPE) {
        delete petDecoConfirmedLayers.background;
        delete petDecoConfirmedLayers.frame;
      }
      if (deco.type === "background" || deco.type === "frame") {
        delete petDecoConfirmedLayers[THEME_BACKDROP_TYPE];
      }
    } else {
      delete petDecoConfirmedLayers[deco.type];
    }
    clearDecoDraft();

    renderDecoChangePolicyHint();
    renderDecorationGrid();
    updateDecoPreviewActions();
    renderPetProfileDecoLayers(student);
    renderStudentGrid({ force: true });
    closeDecorationPanel();
  } catch (err) {
    revertDecoPreviewToEquipped();
    showToast(err.message || "更换失败", "error");
  }
}

function applyPointToStudent(s, diff, reason, cardEl) {
  s.pts += diff;
  s.history = s.history || [];
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  s.history.unshift({
    reason: reason || "快速调整",
    diff: diff,
    time: timeStr,
  });
  let isLevelUp = false;
  while (s.pts >= s.lv * 100 && diff > 0) {
    s.lv++;
    isLevelUp = true;
  }
  if (cardEl) {
    const petImgEl = cardEl.querySelector(".card-pet-img");
    if (petImgEl) {
      petImgEl.classList.remove("card-hit-flash");
      void petImgEl.offsetWidth;
      petImgEl.classList.add("card-hit-flash");
    }
    if (isLevelUp) {
      const lvlUpBtn = document.createElement("div");
      lvlUpBtn.className = "level-up-anim";
      lvlUpBtn.setAttribute("data-text", `Lv.${s.lv} 发育进化`);
      cardEl.appendChild(lvlUpBtn);
      setTimeout(() => lvlUpBtn.remove(), 2000);
    }
  }
}

async function updatePoint(btnEl, diff, reason) {
  if (scoreActionInFlight) return;
  if (currentFocusStudent === null) return;
  scoreActionInFlight = true;
  const ctx = currentFocusStudent;
  let targetText = "当前对象";
  if (ctx.type === "single") {
    targetText = students[ctx.idx]?.name || "当前学生";
  } else if (ctx.type === "batch") {
    targetText = `已选 ${ctx.names.length} 名学生`;
  } else if (ctx.type === "group") {
    targetText = `第 ${ctx.group} 组`;
  }
  try {
    const confirmed = await showConfirmModal({
      tone: diff > 0 ? "success" : "warn",
      badge: diff > 0 ? "加分确认" : "扣分确认",
      icon: diff > 0 ? "fa-plus" : "fa-minus",
      title: `确认${diff > 0 ? "加分" : "扣分"}吗？`,
      description: `${targetText}\n原因：${reason || "快速调整"}\n分值：${diff > 0 ? `+${diff}` : diff}`,
      confirmText: diff > 0 ? "确认加分" : "确认扣分",
    });
    if (!confirmed) return;

    if (ctx.type === "single") {
      const s = students[ctx.idx];
      applyPointToStudent(s, diff, reason, ctx.el);
      document.getElementById("pmPts").innerHTML =
        `<span style="animation: hitFlash 0.5s">${s.pts}</span>`;
      renderModalHistory(s);
    } else if (ctx.type === "batch") {
      ctx.names.forEach((name) => {
        const s = students.find((x) => x.name === name);
        if (s) applyPointToStudent(s, diff, reason, null);
      });
    } else if (ctx.type === "group") {
      students
        .filter((s) => s.group === ctx.group)
        .forEach((s) => applyPointToStudent(s, diff, reason, null));
    }

    playScoreSound(diff);

    const floatSpan = document.createElement("span");
    floatSpan.className = "point-float-anim";
    floatSpan.textContent = diff > 0 ? `+${diff}` : `${diff}`;
    floatSpan.style.color =
      diff > 0 ? "var(--success-green)" : "var(--brand-red)";
    if (ctx.type === "single" && ctx.el) {
      const cardBounds = ctx.el.getBoundingClientRect();
      floatSpan.style.left = cardBounds.left + cardBounds.width / 2 - 15 + "px";
      floatSpan.style.top = cardBounds.top + cardBounds.height / 2 - 20 + "px";
    } else {
      floatSpan.style.left = "50%";
      floatSpan.style.top = "42%";
    }
    document.body.appendChild(floatSpan);
    setTimeout(() => floatSpan.remove(), 1500);

    setTimeout(() => {
      closePointModal();
    }, 300);
    scheduleDebouncedRenders();
  } finally {
    window.setTimeout(() => {
      scoreActionInFlight = false;
    }, 450);
    closeConfirmModal(false);
  }
}

let renderDebounceTimer = null;
function scheduleDebouncedRenders() {
  if (renderDebounceTimer) return;
  renderDebounceTimer = setTimeout(() => {
    renderDebounceTimer = null;
    reorderStudents();
    renderStudentGrid();
    renderTodayRank();
    renderLeaderboardList();
  }, 16);
}

/* ========== 原型接入真实数据：Display Web ========== */
const runtimeState = {
  classId: null,
  terminalCode: "display-web-demo",
  terminalName: "",
  terminalInitialized: false,
  token: "",
  setupAdminToken: "",
  setupAdminRoleCode: "",
  user: null,
  scopes: [],
  classAssignments: [],
  availableClasses: [],
  classBindings: [],
  home: null,
  groups: [],
  groupMap: new Map(),
  scoreRules: [],
  petCatalog: [],
  rewards: [],
  academicGrowth: null,
  academicRenderKey: "",
  selectedAcademicExamId: null,
  selectedAcademicStudentId: null,
  selectedAcademicAiStudentId: null,
  academicAiCache: new Map(),
  academicAiRequests: new Map(),
  lastAcademicAiOpenKey: "",
  lastAcademicAiOpenAt: 0,
  leaderboardType: "score",
  leaderboardRows: [],
  todayRankTab: "group",
  todayRankTabUserSelected: false,
  classCountdownTimer: null,
  lockStatus: "locked",
  unlockSessionId: null,
  unlockedUntil: null,
  lastUnlockRenewAt: 0,
  unlockRenewPromise: null,
  lastLockedAt: null,
  lockOverlayForced: false,
  pendingLoginResult: null,
  setupStep: 1,
  setupMode: "initialize",
  selectedSetupClassId: null,
  selectedSetupGradeName: "",
  setupClassGridDrag: null,
  socket: null,
  socketAuthed: false,
  subscribedClassId: null,
  subscribedDisplayCode: null,
  realtimeRefreshTimer: null,
  realtimeRefreshPromise: null,
  pendingRealtimeEvents: new Set(),
  lastDisplayDataSignature: "",
  studentGridRenderKey: "",
  pendingPetUpgradeAnimations: [],
  petUpgradePlaying: false,
  stalePages: new Set(),
  pendingScoreEffects: null,
  immediateScoreBatch: null,
  scoreRealtimeFlushTimer: null,
  marqueeRefreshTimer: null,
  recentHonors: [],
  classHonors: [],
  honorMarqueeHighlightTimer: null,
  scoreGridReorderTimer: null,
  scoreGridReorderDueAt: 0,
  metaPollTimer: null,
  deferredDisplayDataTimer: null,
  deferredDisplayDataPromise: null,
  displayHeartbeatTimer: null,
  toolbox: {
    activeMode: "home",
    activeTool: null,
    isImmersive: false,
    audioStream: null,
    audioContext: null,
    analyser: null,
    audioData: null,
    audioRAF: null,
    audioLevel: 0,
    audioRenderLastAt: 0,
    paused: false,
    settings: {
      energyMode: "reading",
      energyTarget: 90,
      energyDuration: 0,
      gardenTarget: 0,
      gardenThreshold: 34,
      luckyScope: "class",
      luckyGroupNo: "",
      luckyRepeat: false,
      luckyExcludedIds: [],
      timerDuration: 300,
    },
    energyMode: "reading",
    energyRunning: false,
    energyScore: 0,
    energyPeak: 0,
    energyDb: null,
    energyStartedAt: 0,
    energySamples: [],
    energyPkScores: new Map(),
    gardenRunning: false,
    gardenQuietSeconds: 0,
    gardenLastTick: 0,
    gardenDb: null,
    luckyScope: "class",
    luckyDrawnIds: new Set(),
    luckyHistory: [],
    luckyExcludedIds: new Set(),
    luckyRolling: false,
    luckyRollRAF: null,
    luckyRollStartedAt: 0,
    luckyRollDuration: 0,
    luckyRollPool: [],
    luckySelected: null,
    luckyRollLastCenterIndex: -1,
    timerDuration: 300,
    timerRemaining: 300000,
    timerStartedAt: 0,
    timerRemainingMs: 300000,
    timerDurationMs: 300000,
    timerDeadlineAt: 0,
    timerRAF: null,
    timerRunning: false,
    timerPaused: false,
  },
};

const displayRulePanelState = {
  activeType: "add",
  searchKeyword: "",
  sceneCode: "all",
};

const DISPLAY_SCENE_LABELS = {
  classroom: "课堂表现",
  homework: "作业",
  exam: "周清和阶段评价",
  competition: "竞赛",
  dictation: "背诵及听默写",
  moral: "学生管理",
};

const DISPLAY_SCENE_ORDER = [
  "classroom",
  "homework",
  "exam",
  "competition",
  "dictation",
  "moral",
];

const ACADEMIC_RENDER_LIMITS = {
  default: {
    subjectCount: 6,
    classRows: 10,
    signalRows: 7,
    trendPoints: 5,
  },
  lowMemory: {
    subjectCount: 5,
    classRows: 6,
    signalRows: 5,
    trendPoints: 4,
  },
};

function isCoarsePointerDevice() {
  if (typeof window.matchMedia !== "function") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches
  );
}

/** 触控手势阈值：coarse 端更宽松，减少滑动误触 */
function getTouchInteractionProfile() {
  const coarse = isCoarsePointerDevice();
  return {
    tapSlop: coarse ? 10 : 8,
    scrollSlop: coarse ? 10 : 8,
    scrollDominanceRatio: 1.2,
    petPkSlop: coarse ? 24 : 14,
    scrollClickSuppressMs: 120,
    cardPkEnabled: false,
  };
}

function isGridScrollable(wrap) {
  if (!wrap) return false;
  return wrap.scrollHeight > wrap.clientHeight + 2;
}

function isVerticalScrollIntent(dx, dy, profile) {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const distance = Math.hypot(dx, dy);
  if (distance < profile.scrollSlop) return false;
  if (absDy < profile.scrollSlop) return false;
  return absDy / Math.max(absDx, 1) >= profile.scrollDominanceRatio;
}

function getClassroomGridWrap() {
  return document.querySelector("#page-classroom .student-grid-wrap");
}

function isClassroomGridScrolling() {
  const wrap = getClassroomGridWrap();
  return (
    wrap?.dataset?.dragMoved === "1" || wrap?.dataset?.dragSuppressClick === "1"
  );
}

function readLowSpecModeEnabled() {
  return window.DisplayRuntime.readLowSpecModeEnabled();
}

function writeLowSpecModeEnabled(enabled) {
  try {
    window.DisplayRuntime.writeLowSpecModeEnabled(enabled);
  } catch (error) {
    console.warn("无法保存流畅模式设置", error);
  }
}

function syncDisplayPerformanceBodyState() {
  const performanceTier = getDisplayPerformanceTier();
  const lowSpecEnabled = readLowSpecModeEnabled();
  document.body.classList.toggle("low-spec", lowSpecEnabled);
  document.body.dataset.displayPerformance = performanceTier;
  document.body.dataset.lowSpecMode = lowSpecEnabled ? "true" : "false";
  document.body.classList.toggle("low-memory-display", isLowMemoryDisplay());
  document.body.classList.toggle("standard-display", isStandardDisplay());
  document.body.classList.toggle(
    "high-quality-display",
    isHighQualityDisplay(),
  );
  const switchEl = document.getElementById("settingsLowSpecSwitch");
  if (switchEl) {
    switchEl.checked = lowSpecEnabled;
  }
}

const VALID_GRID_DENSITIES = new Set(["standard", "compact", "panorama"]);
const PANORAMA_LAYOUT_CSS_VARS = [
  "--grid-columns",
  "--grid-gap",
  "--card-padding-top",
  "--card-padding-x",
  "--card-padding-bottom",
  "--card-border-radius",
  "--card-avatar-size",
  "--card-trigger-size",
  "--card-trigger-padding",
  "--card-trigger-margin-bottom",
  "--card-avatar-border",
  "--card-name-size",
  "--card-name-margin",
  "--card-info-size",
  "--card-level-size",
  "--card-points-size",
  "--card-rank-badge-size",
  "--card-rank-badge-font",
  "--card-group-tag-size",
  "--card-batch-check-size",
];

let gridDensity = "compact";
let sidebarCollapsed = false;
let panoramaLayoutTimer = null;

function readGridDensity() {
  return window.DisplayRuntime.readGridDensity(VALID_GRID_DENSITIES, "compact");
}

function writeGridDensity(mode) {
  try {
    window.DisplayRuntime.writeGridDensity(mode);
  } catch (error) {
    console.warn("无法保存视图密度设置", error);
  }
}

function readSidebarCollapsed() {
  return window.DisplayRuntime.readSidebarCollapsed();
}

function writeSidebarCollapsed(collapsed) {
  try {
    window.DisplayRuntime.writeSidebarCollapsed(collapsed);
  } catch (error) {
    console.warn("无法保存侧栏折叠设置", error);
  }
}

function clearPanoramaInlineStyles() {
  const classroom = document.getElementById("page-classroom");
  if (!classroom) return;
  PANORAMA_LAYOUT_CSS_VARS.forEach((prop) => {
    classroom.style.removeProperty(prop);
  });
}

function computePanoramaGridLayout() {
  const classroom = document.getElementById("page-classroom");
  const gridWrap = document.querySelector("#page-classroom .student-grid-wrap");
  const toolbar = document.querySelector("#page-classroom .classroom-toolbar");
  if (!classroom || !gridWrap || gridDensity !== "panorama") return;

  const visibleCount = Math.max(getVisibleStudentIndices().length, 1);
  const wrapStyles = window.getComputedStyle(gridWrap);
  const paddingTop = Number.parseFloat(wrapStyles.paddingTop) || 16;
  const paddingBottom = Number.parseFloat(wrapStyles.paddingBottom) || 16;
  const toolbarHeight = toolbar ? toolbar.offsetHeight : 72;
  const availableW = gridWrap.clientWidth - 8;
  const availableH =
    gridWrap.clientHeight - toolbarHeight - paddingTop - paddingBottom;

  if (availableW <= 0 || availableH <= 0) return;

  const CARD_MIN_HEIGHT = 88;
  const MIN_COLS = 4;
  const GAP = 8;
  const maxCols = Math.max(MIN_COLS, Math.floor(availableW / 100));

  let bestCols = MIN_COLS;
  for (let cols = maxCols; cols >= MIN_COLS; cols -= 1) {
    const rows = Math.ceil(visibleCount / cols);
    const cardH = (availableH - GAP * Math.max(rows - 1, 0)) / rows;
    if (cardH >= CARD_MIN_HEIGHT) {
      bestCols = cols;
      break;
    }
  }

  const rows = Math.ceil(visibleCount / bestCols);
  const cardH = Math.max(
    CARD_MIN_HEIGHT,
    (availableH - GAP * Math.max(rows - 1, 0)) / rows,
  );
  const avatarSize = Math.min(56, Math.max(40, Math.floor(cardH * 0.45)));
  const triggerSize = Math.min(68, avatarSize + 12);
  const triggerPadding = Math.max(4, Math.floor(triggerSize * 0.07));
  const triggerMarginBottom = Math.max(2, Math.floor(cardH * 0.04));
  const cardPadding = Math.max(6, Math.floor(cardH * 0.07));
  const nameSize = cardH < 100 ? 12 : 13;
  const infoSize = cardH < 100 ? 9 : 10;
  const levelSize = cardH < 100 ? 8 : 9;
  const pointsSize = cardH < 100 ? 10 : 11;
  const rankBadgeSize = cardH < 100 ? 18 : 20;
  const rankBadgeFont = cardH < 100 ? 9 : 10;
  const groupTagSize = cardH < 100 ? 8 : 9;
  const batchCheckSize = cardH < 100 ? 16 : 18;

  classroom.style.setProperty("--grid-columns", String(bestCols));
  classroom.style.setProperty("--grid-gap", `${GAP}px`);
  classroom.style.setProperty("--card-padding-top", `${cardPadding}px`);
  classroom.style.setProperty(
    "--card-padding-x",
    `${Math.max(6, cardPadding - 1)}px`,
  );
  classroom.style.setProperty("--card-padding-bottom", `${cardPadding}px`);
  classroom.style.setProperty(
    "--card-border-radius",
    cardH < 100 ? "8px" : "10px",
  );
  classroom.style.setProperty("--card-avatar-size", `${avatarSize}px`);
  classroom.style.setProperty("--card-trigger-size", `${triggerSize}px`);
  classroom.style.setProperty("--card-trigger-padding", `${triggerPadding}px`);
  classroom.style.setProperty(
    "--card-trigger-margin-bottom",
    `${triggerMarginBottom}px`,
  );
  classroom.style.setProperty(
    "--card-avatar-border",
    avatarSize >= 52 ? "2px" : "2px",
  );
  classroom.style.setProperty("--card-name-size", `${nameSize}px`);
  classroom.style.setProperty(
    "--card-name-margin",
    `${Math.max(1, Math.floor(cardH * 0.02))}px`,
  );
  classroom.style.setProperty("--card-info-size", `${infoSize}px`);
  classroom.style.setProperty("--card-level-size", `${levelSize}px`);
  classroom.style.setProperty("--card-points-size", `${pointsSize}px`);
  classroom.style.setProperty("--card-rank-badge-size", `${rankBadgeSize}px`);
  classroom.style.setProperty("--card-rank-badge-font", `${rankBadgeFont}px`);
  classroom.style.setProperty("--card-group-tag-size", `${groupTagSize}px`);
  classroom.style.setProperty("--card-batch-check-size", `${batchCheckSize}px`);
}

function schedulePanoramaLayout() {
  if (panoramaLayoutTimer) {
    clearTimeout(panoramaLayoutTimer);
  }
  panoramaLayoutTimer = setTimeout(() => {
    panoramaLayoutTimer = null;
    if (gridDensity === "panorama") {
      computePanoramaGridLayout();
    }
  }, 150);
}

function syncGridDensityUi() {
  document.querySelectorAll("[data-grid-density-btn]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.gridDensityBtn === gridDensity);
  });

  const sidebarBtn = document.getElementById("sidebarCollapseBtn");
  if (sidebarBtn) {
    sidebarBtn.setAttribute(
      "aria-pressed",
      sidebarCollapsed ? "true" : "false",
    );
    sidebarBtn.title = sidebarCollapsed ? "展开侧栏" : "折叠侧栏";
    const icon = sidebarBtn.querySelector("i");
    if (icon) {
      icon.className = sidebarCollapsed
        ? "fa-solid fa-chevron-left"
        : "fa-solid fa-chevron-right";
    }
  }

  const sidebarSwitch = document.getElementById(
    "settingsSidebarCollapsedSwitch",
  );
  if (sidebarSwitch) {
    sidebarSwitch.checked = sidebarCollapsed;
  }
}

function syncGridDensityState() {
  gridDensity = readGridDensity();
  sidebarCollapsed = readSidebarCollapsed();
  const classroom = document.getElementById("page-classroom");
  if (!classroom) return;

  classroom.dataset.gridDensity = gridDensity;
  classroom.classList.toggle("sidebar-collapsed", sidebarCollapsed);

  if (gridDensity === "panorama") {
    computePanoramaGridLayout();
  } else {
    clearPanoramaInlineStyles();
  }

  syncGridDensityUi();
}

function setGridDensity(mode) {
  if (!VALID_GRID_DENSITIES.has(mode)) return;
  gridDensity = mode;
  writeGridDensity(mode);
  syncGridDensityState();
  schedulePanoramaLayout();
}

function toggleSidebarCollapsed(force) {
  sidebarCollapsed = typeof force === "boolean" ? force : !sidebarCollapsed;
  writeSidebarCollapsed(sidebarCollapsed);
  syncGridDensityState();
  if (gridDensity === "panorama") {
    schedulePanoramaLayout();
  }
}

function bindGridDensityUi() {
  window.addEventListener("resize", schedulePanoramaLayout);
}

window.setGridDensity = setGridDensity;
window.toggleSidebarCollapsed = toggleSidebarCollapsed;

function getDisplayPerformanceTier() {
  return window.DisplayRuntime.getDisplayPerformanceTier({
    coarsePointer: isCoarsePointerDevice(),
  });
}

function isStandardDisplay() {
  return window.DisplayRuntime.isStandardDisplay(getDisplayPerformanceTier());
}

function isHighQualityDisplay() {
  return window.DisplayRuntime.isHighQualityDisplay(getDisplayPerformanceTier());
}

function isLowSpecMode() {
  return window.DisplayRuntime.isLowSpecMode(getDisplayPerformanceTier());
}

function getDisplayEffectBudget() {
  return window.DisplayRuntime.getDisplayEffectBudget(getDisplayPerformanceTier());
}

function isLowMemoryDisplay() {
  return isLowSpecMode();
}

function getAcademicRenderLimits() {
  return isLowMemoryDisplay()
    ? ACADEMIC_RENDER_LIMITS.lowMemory
    : ACADEMIC_RENDER_LIMITS.default;
}

/** 学业大屏完整渲染签名：任一可见区块变化才重渲染，避免 WebSocket 推送触发的无效 innerHTML 抹掉滚动位置 */
function academicGrowthRenderSignature(data, limits) {
  const listSig = (rows) =>
    (rows || [])
      .slice(0, limits.signalRows)
      .map((r) =>
        [
          academicStudentKey(r.studentId),
          r.totalScore ?? "",
          r.rankDelta ?? "",
          r.className ?? "",
        ].join(":"),
      )
      .join("|");
  const rowSig = (rows) =>
    (rows || [])
      .map((r) =>
        [
          academicStudentKey(r.studentId),
          r.studentName ?? "",
          r.classRank ?? "",
          r.totalScore ?? "",
          r.rankDelta ?? "",
          (r.subjectScores || []).join(","),
          r.groupName ?? "",
        ].join(";"),
      )
      .join("|");
  const trendSig = (trend) =>
    (trend || [])
      .slice(-limits.trendPoints)
      .map((t) => `${t.examName ?? ""}:${t.averageScore ?? ""}`)
      .join("|");
  const classSig = (rows) =>
    (rows || [])
      .slice(0, limits.classRows)
      .map(
        (r) =>
          `${r.className ?? ""}:${r.academicIndex ?? ""}:${r.riskLevel ?? ""}:${r.isCurrentClass ? "1" : "0"}`,
      )
      .join("|");
  const subjectSig = (subs) =>
    (subs || [])
      .slice(0, limits.subjectCount)
      .map((s) => `${s.subjectName ?? ""}:${s.averageScore ?? ""}`)
      .join("|");

  const metrics = data.metrics || {};
  return [
    data.latestExam?.id || data.latestExam?.name || "none",
    data.previousExam?.id || data.previousExam?.name || "none",
    data.gradeName ?? "",
    data.className ?? "",
    data.insight || "",
    metrics.academicIndex ?? "",
    metrics.averageScore ?? "",
    metrics.coverageRate ?? "",
    metrics.participantCount ?? "",
    metrics.progressCount ?? "",
    metrics.riskCount ?? metrics.declineCount ?? "",
    metrics.gradeBaselineIndex ?? metrics.currentClassAcademicIndex ?? "",
    metrics.gradeAverage ?? metrics.currentClassAverage ?? "",
    rowSig(data.studentRows),
    listSig(data.progressLeaders),
    listSig(data.riskStudents),
    trendSig(data.trend),
    classSig(data.classSummaries),
    subjectSig(data.subjects),
    (data.subjectColumns || [])
      .slice(0, limits.subjectCount)
      .map((c) => c.subjectName || "")
      .join(","),
    limits.signalRows,
    limits.subjectCount,
    limits.classRows,
    limits.trendPoints,
    isLowMemoryDisplay() ? "low" : "normal",
  ].join("::");
}

function resolveRuntimeParams() {
  const { terminalCode, terminalName } = window.DisplayRuntime.resolveRuntimeParams();
  runtimeState.classId = null;
  runtimeState.terminalCode = terminalCode;
  runtimeState.terminalName = terminalName;
}

function createTerminalCode() {
  return window.DisplayRuntime.createTerminalCode();
}

function getApiBase() {
  return window.DisplayRuntime.getApiBase();
}

function getAssetBase() {
  return window.DisplayRuntime.getAssetBase();
}

function resolveAssetUrl(url) {
  return window.DisplayRuntime.resolveAssetUrl(url);
}

function giftImageVariant(url, size = 480) {
  return window.DisplayRuntime.giftImageVariant(url, size);
}

function resolveDisplayImageUrl(url) {
  return window.DisplayRuntime.resolveDisplayImageUrl(url);
}

function resolveDecoAssetUrl(deco, size = 400) {
  return window.DisplayRuntime.resolveDecoAssetUrl(deco, size);
}

function resolvePetAssetVariantUrl(url, size = 400) {
  return window.DisplayRuntime.resolvePetAssetVariantUrl(
    url,
    size,
    isHighQualityDisplay(),
  );
}

function getShowcasePetImageSize() {
  return isHighQualityDisplay() ? 1024 : 400;
}

function petImgVariant(s, size = 400) {
  if (s.hasPet === false) {
    return resolvePetAssetVariantUrl(STAR_SEED_IMAGE_URL, size);
  }
  if (s.petImageUrl) return resolvePetAssetVariantUrl(s.petImageUrl, size);
  if (s.avatarUrl) return resolveAssetUrl(s.avatarUrl);
  return "images/logo.svg";
}

function getSocketBase() {
  return window.DisplayRuntime.getSocketBase();
}

async function apiFetch(path, options = {}) {
  return apiFetchWithToken(path, runtimeState.token, options);
}

function shouldAutoRenewUnlock(path, options = {}) {
  return window.DisplayAuth.shouldAutoRenewUnlock({
    path,
    method: options.method,
    token: runtimeState.token,
    user: runtimeState.user,
    classId: runtimeState.classId,
    lockStatus: runtimeState.lockStatus,
  });
}

function shouldRenewUnlockSoon(options = {}) {
  return window.DisplayAuth.shouldRenewUnlockSoon({
    unlockedUntil: runtimeState.unlockedUntil,
    force: options.force === true,
    thresholdMs: options.thresholdMs,
  });
}

async function renewDisplayUnlockSession(options = {}) {
  const now = Date.now();
  const throttleMs = options.throttleMs ?? 60 * 1000;
  const force = options.force === true;
  if (!runtimeState.token || !runtimeState.user || !runtimeState.classId) {
    return null;
  }
  if (runtimeState.lockStatus !== "active") return null;
  if (!shouldRenewUnlockSoon(options)) return null;
  if (
    !force &&
    runtimeState.lastUnlockRenewAt &&
    now - runtimeState.lastUnlockRenewAt < throttleMs
  ) {
    return null;
  }
  if (runtimeState.unlockRenewPromise) {
    return runtimeState.unlockRenewPromise;
  }
  runtimeState.unlockRenewPromise = apiFetchWithToken(
    "/display/unlock-renew",
    runtimeState.token,
    {
      method: "POST",
      body: JSON.stringify({
        classId: runtimeState.classId,
        displayTerminalCode: runtimeState.terminalCode,
      }),
    },
  )
    .then((result) => {
      if (result?.status === "active") {
        runtimeState.lastUnlockRenewAt = Date.now();
        runtimeState.lockStatus = "active";
        runtimeState.unlockSessionId = result.unlockSessionId || null;
        runtimeState.unlockedUntil = result.expiredAt || null;
        runtimeState.lastLockedAt = null;
      } else {
        runtimeState.lastUnlockRenewAt = 0;
      }
      return result;
    })
    .catch((error) => {
      console.warn("续期展示端解锁会话失败", error);
      return null;
    })
    .finally(() => {
      runtimeState.unlockRenewPromise = null;
    });
  return runtimeState.unlockRenewPromise;
}

async function apiFetchWithToken(path, token, options = {}) {
  let unlockRenewResult = null;
  if (shouldAutoRenewUnlock(path, options) && shouldRenewUnlockSoon()) {
    unlockRenewResult = await renewDisplayUnlockSession();
    if (unlockRenewResult && unlockRenewResult.status !== "active") {
      requireUnlockRelogin({
        preserveClassId: true,
        lockedAt:
          unlockRenewResult.expiredAt || new Date().toISOString(),
        forceOverlay: false,
      });
      applyLockOverlay();
      throw new Error("教师操作已锁定，请重新登录后再试");
    }
  }
  const { data, renewedToken } = await window.DisplayRuntime.fetchApiJson(
    path,
    token,
    options,
  );
  if (renewedToken && token) {
    if (token === runtimeState.token) {
      setPersistentToken(renewedToken);
    } else if (token === runtimeState.setupAdminToken) {
      runtimeState.setupAdminToken = renewedToken;
    }
  }
  return data;
}

function setLoginMessage(message, type = "error") {
  const el = document.getElementById("loginMessage");
  if (!el) return;
  el.textContent = message || "";
  el.style.color = type === "success" ? "#1e8e5a" : "#d64343";
}

function requestDisplayFullscreen() {
  return window.DisplayRuntime.requestFullscreen();
}

function getDisplayFullscreenElement() {
  return window.DisplayRuntime.getFullscreenElement();
}

function syncDisplayFullscreenButton() {
  return window.DisplayRuntime.syncFullscreenButton();
}

async function exitDisplayFullscreen() {
  return window.DisplayRuntime.exitFullscreen();
}

function isDisplayDesktopRuntime() {
  return window.DisplayRuntime.isDesktopRuntime();
}

async function minimizeDisplayWindow() {
  if (!isDisplayDesktopRuntime()) {
    return;
  }
  try {
    await window.DisplayRuntime.minimizeDesktopWindow();
  } catch (error) {
    showDisplayToast(error?.message || "窗口最小化失败，请重试。");
  }
}

function syncDisplayMinimizeButton() {
  document.body.classList.toggle(
    "display-desktop-runtime",
    isDisplayDesktopRuntime(),
  );
  const button = document.getElementById("classroomMinimizeBtn");
  if (!button) return;
  button.hidden = !isDisplayDesktopRuntime();
  if (!button.hidden) {
    button.title = "最小化窗口";
  }
}

function enterDisplayLogin() {
  requestDisplayFullscreen();
  navigateTo("login");
}

function getStoredLoginCredentials() {
  return window.DisplayRuntime.getStoredLoginCredentials();
}

function getStoredLoginAccounts() {
  return window.DisplayRuntime.getStoredLoginAccounts();
}

function setStoredLoginCredentials(username, displayName = "") {
  const normalizedUsername = window.DisplayRuntime.setStoredLoginCredentials(
    username,
    displayName,
  );
  if (!normalizedUsername) return;
  renderSavedLoginAccounts(normalizedUsername);
}

function getStoredSetupUsername() {
  return window.DisplayRuntime.getStoredSetupUsername();
}

function setStoredSetupUsername(username) {
  window.DisplayRuntime.setStoredSetupUsername(username);
}

function hydrateSetupUsername() {
  const input = document.getElementById("setupAdminUsername");
  if (!input) return;
  input.value = getStoredSetupUsername();
}

function removeStoredLoginAccount(username) {
  return window.DisplayRuntime.removeStoredLoginAccount(username);
}

function renderSavedLoginAccounts(selectedUsername = "") {
  const field = document.getElementById("loginSavedAccountField");
  const select = document.getElementById("loginSavedAccount");
  const deleteButton = document.getElementById("loginDeleteSavedAccount");
  if (!field || !select) return;
  const accounts = getStoredLoginAccounts();
  field.hidden = accounts.length === 0;
  select.innerHTML = "";
  if (!accounts.length) {
    if (deleteButton) deleteButton.disabled = true;
    return;
  }
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "选择已保存账号快速登录";
  select.appendChild(placeholder);
  accounts.forEach((account) => {
    const option = document.createElement("option");
    option.value = account.username;
    option.textContent =
      account.displayName && account.displayName !== account.username
        ? `${account.displayName}（${account.username}）`
        : account.username;
    select.appendChild(option);
  });
  select.value = selectedUsername || "";
  if (deleteButton) deleteButton.disabled = !select.value;
}

function hydrateLoginCredentials() {
  const accounts = getStoredLoginAccounts();
  const stored = accounts[0] || getStoredLoginCredentials();
  renderSavedLoginAccounts();
  if (!stored) return;
  const usernameInput = document.getElementById("loginUsername");
  if (usernameInput) usernameInput.value = stored.username;
}

function clearDisplayPasswordInputs() {
  ["loginPassword", "setupAdminPassword"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.value = "";
    }
  });
}

function suppressPasswordManagerPrompts() {
  const inputConfigs = [
    { id: "loginUsername", autocomplete: "off", readonly: false },
    { id: "loginPassword", autocomplete: "new-password", readonly: true },
    { id: "setupAdminUsername", autocomplete: "off", readonly: false },
    { id: "setupAdminPassword", autocomplete: "new-password", readonly: true },
  ];
  inputConfigs.forEach(({ id, autocomplete, readonly }) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.setAttribute("autocomplete", autocomplete);
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("data-lpignore", "true");
    input.setAttribute("data-1p-ignore", "true");
    if (readonly) {
      input.readOnly = true;
      const unlock = () => {
        input.readOnly = false;
      };
      input.addEventListener("focus", unlock, { once: true });
      input.addEventListener("pointerdown", unlock, { once: true });
      input.addEventListener("touchstart", unlock, { once: true });
    }
  });
}

function fillLoginCredentials(account) {
  if (!account) return false;
  const usernameInput = document.getElementById("loginUsername");
  const passwordInput = document.getElementById("loginPassword");
  if (usernameInput) usernameInput.value = account.username;
  if (passwordInput) {
    passwordInput.value = "";
    passwordInput.focus();
  }
  return Boolean(account.username);
}

function handleSavedAccountChange() {
  requestDisplayFullscreen();
  const select = document.getElementById("loginSavedAccount");
  const deleteButton = document.getElementById("loginDeleteSavedAccount");
  const selectedUsername = select?.value;
  if (deleteButton) deleteButton.disabled = !selectedUsername;
  if (!selectedUsername) return;
  const account = getStoredLoginAccounts().find(
    (item) => item.username === selectedUsername,
  );
  if (!fillLoginCredentials(account)) {
    setLoginMessage("该账号信息无效，请重新输入");
    return;
  }
  setLoginMessage("已填入账号，请输入密码后登录");
}

function handleDeleteSavedAccount() {
  requestDisplayFullscreen();
  const select = document.getElementById("loginSavedAccount");
  const selectedUsername = select?.value?.trim();
  if (!selectedUsername) {
    setLoginMessage("请先选择需要删除的已保存账号");
    return;
  }
  const account = getStoredLoginAccounts().find(
    (item) => item.username === selectedUsername,
  );
  if (!account || !removeStoredLoginAccount(selectedUsername)) {
    setLoginMessage("删除失败，请稍后重试");
    return;
  }
  renderSavedLoginAccounts();
  const usernameInput = document.getElementById("loginUsername");
  const passwordInput = document.getElementById("loginPassword");
  if (usernameInput?.value?.trim() === selectedUsername) {
    usernameInput.value = "";
  }
  if (passwordInput) {
    passwordInput.value = "";
  }
  setLoginMessage(
    `已删除保存账号：${account.displayName || selectedUsername}`,
    "success",
  );
}

function setPersistentToken(token) {
  runtimeState.token = token || "";
  window.DisplayRuntime.setPersistentToken(token);
  if (runtimeState.socket) {
    runtimeState.socket.auth = {
      ...(runtimeState.socket.auth || {}),
      token: runtimeState.token || runtimeState.setupAdminToken || "",
      terminalCode: runtimeState.terminalCode || "",
    };
    if (
      runtimeState.token ||
      runtimeState.setupAdminToken ||
      runtimeState.terminalCode
    ) {
      if (!runtimeState.socket.connected) {
        runtimeState.socket.connect();
      }
    } else {
      // 仅当终端身份和登录态都不存在时才主动断开长连接
      if (runtimeState.socket.connected) {
        runtimeState.socket.disconnect();
      }
    }
  }
}

function clearAuthState(options = {}) {
  const preserveClassId = options.preserveClassId !== false;
  const preserveToken = options.preserveToken === true;
  if (!preserveToken) {
    setPersistentToken("");
  } else {
    runtimeState.token = "";
  }
  runtimeState.user = null;
  runtimeState.scopes = [];
  runtimeState.classAssignments = [];
  runtimeState.availableClasses = [];
  runtimeState.classBindings = [];
  runtimeState.pendingLoginResult = null;
  runtimeState.lockStatus = "locked";
  runtimeState.unlockSessionId = null;
  runtimeState.unlockedUntil = null;
  runtimeState.lastUnlockRenewAt = 0;
  runtimeState.unlockRenewPromise = null;
  runtimeState.lockOverlayForced = false;
  if (!preserveClassId) {
    runtimeState.classId = null;
    window.DisplayRuntime.clearDisplayClassId();
  }
  syncBottomUserName();
  subscribeRealtimeRooms();
}

async function restoreAuthSession() {
  const token = window.DisplayRuntime.getPersistentToken();
  if (!token) {
    return false;
  }
  try {
    const result = await apiFetchWithToken("/auth/me", token);
    if (!result?.user) {
      setPersistentToken("");
      return false;
    }
    setPersistentToken(token);
    runtimeState.user = result.user;
    runtimeState.scopes = result.scopes || [];
    runtimeState.classAssignments = result.classAssignments || [];
    syncBottomUserName();
    subscribeRealtimeRooms();
    return true;
  } catch {
    setPersistentToken("");
    return false;
  }
}

function requireUnlockRelogin(options = {}) {
  const preserveClassId = options.preserveClassId !== false;
  const lockedAt = options.lockedAt || null;
  const forceOverlay = options.forceOverlay ?? true;
  clearAuthState({ preserveClassId });
  runtimeState.lockStatus = "locked";
  runtimeState.lastLockedAt = lockedAt;
  runtimeState.lockOverlayForced = forceOverlay;
}

function getClassScopeIds(scopes = runtimeState.scopes) {
  return window.DisplayAuth.getClassScopeIds(
    scopes,
    runtimeState.classAssignments || [],
  );
}

function isDisplayAdminRole(roleCode = runtimeState.user?.roleCode) {
  return window.DisplayAuth.isDisplayAdminRole(roleCode);
}

function canInitializeDisplayTerminalRole(roleCode) {
  return window.DisplayAuth.canInitializeDisplayTerminalRole(roleCode);
}

/** 系统管理员可绕过「一班级一终端」限制，用于线上测试大屏 */
function canOverrideClassDisplayBinding(roleCode = runtimeState.setupAdminRoleCode) {
  return window.DisplayAuth.canOverrideClassDisplayBinding(roleCode);
}

function canCurrentUserAccessClass(classId) {
  return window.DisplayAuth.canAccessClass({
    roleCode: runtimeState.user?.roleCode,
    scopes: runtimeState.scopes,
    classAssignments: runtimeState.classAssignments,
    classId,
  });
}

function isHomeroomTeacher() {
  return runtimeState.user?.roleCode === "homeroom_teacher";
}

function isHomeroomOfCurrentClass() {
  return window.DisplayAuth.isHomeroomOfClass({
    roleCode: runtimeState.user?.roleCode,
    user: runtimeState.user,
    classId: runtimeState.classId,
    classAssignments: runtimeState.classAssignments,
  });
}

function canAdoptPet() {
  return window.DisplayAuth.canAdoptPet({
    roleCode: runtimeState.user?.roleCode,
    user: runtimeState.user,
    token: runtimeState.token,
    classId: runtimeState.classId,
    scopes: runtimeState.scopes,
    classAssignments: runtimeState.classAssignments,
  });
}

/** 班主任及以上权限 + 终端未锁定（与领养等班级档案操作一致） */
function blockHomeroomLockedOperation(featureName) {
  return blockHomeroomOnlyOperation(featureName);
}

function getOperationLockedAlertCopy(featureName) {
  return window.DisplayAuth.getOperationLockedAlertCopy(featureName);
}

/** 终端锁定时拦截并提示（锁定后会清除登录态，须优先于「需班主任登录」判断） */
function blockOperationIfLocked(featureName) {
  if (runtimeState.lockStatus === "active") return false;
  runtimeState.lockOverlayForced = true;
  closeDecorationPanel();
  applyLockOverlay();
  void showDisplayAlert(getOperationLockedAlertCopy(featureName));
  return true;
}

function getHomeroomOnlyAlertCopy(featureName) {
  return window.DisplayAuth.getHomeroomOnlyAlertCopy(featureName);
}

function blockHomeroomOnlyOperation(featureName) {
  const copy = getHomeroomOnlyAlertCopy(featureName);
  if (blockOperationIfLocked(featureName)) return true;
  if (!runtimeState.user || !runtimeState.token) {
    void showDisplayAlert(copy.login);
    return true;
  }
  if (!isHomeroomOfCurrentClass()) {
    void showDisplayAlert(copy.restricted);
    return true;
  }
  return false;
}

function getGroupOptions() {
  return runtimeState.groups
    .map((group) => ({
      id: group.id || null,
      groupNo: Number(group.groupNo),
      name: group.name || `第${group.groupNo}组`,
      groupScore: Number(group.groupScore ?? 0),
    }))
    .filter((group) => Number.isFinite(group.groupNo))
    .sort((a, b) => a.groupNo - b.groupNo);
}

function getGroupLabel(groupNo) {
  if (groupNo == null || groupNo === "") return "未分组";
  const targetNo = Number(groupNo);
  const group = runtimeState.groups.find(
    (item) => Number(item.groupNo) === targetNo,
  );
  return group?.name || `第${targetNo}组`;
}

function getActiveDisplayPage() {
  return document.querySelector(".page.active")?.id || "";
}

function shouldReceiveCallOnlyRealtimeEvents() {
  return getActiveDisplayPage() === "page-login";
}

function shouldSuppressRealtimeStatusBar() {
  const pageId = getActiveDisplayPage();
  if (!pageId) return true;
  return (
    pageId === "page-entry" ||
    pageId === "page-login" ||
    pageId === "page-setup"
  );
}

function isClassroomPageActive() {
  return getActiveDisplayPage() === "page-classroom";
}

function markPageStale(pageKey) {
  if (!runtimeState.stalePages) {
    runtimeState.stalePages = new Set();
  }
  runtimeState.stalePages.add(pageKey);
}

function createEmptyScoreEffectsBucket() {
  return {
    byStudent: new Map(),
    upgrades: new Map(),
    classScoreDelta: 0,
    eventCount: 0,
    suppressSound: false,
  };
}

function ensurePendingScoreEffects() {
  if (!runtimeState.pendingScoreEffects) {
    runtimeState.pendingScoreEffects = createEmptyScoreEffectsBucket();
  }
  return runtimeState.pendingScoreEffects;
}

function ensureImmediateScoreBatch() {
  if (!runtimeState.immediateScoreBatch) {
    runtimeState.immediateScoreBatch = createEmptyScoreEffectsBucket();
  }
  return runtimeState.immediateScoreBatch;
}

function shouldSuppressScoreSoundForPayload(payload) {
  if (!payload) return false;
  return payload.suppressScoreSound === true;
}

function accumulateScoreEffects(bucket, payload) {
  if (!bucket || !payload) return;
  const changes = Array.isArray(payload.changes) ? payload.changes : [];
  if (shouldSuppressScoreSoundForPayload(payload)) {
    bucket.suppressSound = true;
  }
  changes.forEach((change) => {
    const studentId = Number(change?.studentId);
    if (!Number.isFinite(studentId) || studentId <= 0) return;
    const prev = bucket.byStudent.get(studentId) || {
      studentId,
      netDelta: 0,
      currentScore: null,
      currentPetLevel: null,
    };
    const scoreDelta = Number(change.scoreDelta || 0);
    prev.netDelta += Number.isFinite(scoreDelta) ? scoreDelta : 0;
    if (change.currentScore != null) {
      prev.currentScore = Number(change.currentScore);
    }
    if (change.currentPetLevel != null) {
      prev.currentPetLevel = Number(change.currentPetLevel);
    }
    bucket.byStudent.set(studentId, prev);
  });

  (Array.isArray(payload.upgrades) ? payload.upgrades : []).forEach((item) => {
    const studentId = Number(item?.studentId);
    const afterLevel = Number(item?.afterLevel || 0);
    if (!Number.isFinite(studentId) || studentId <= 0) return;
    bucket.upgrades.set(studentId, {
      studentId,
      afterLevel:
        Number.isFinite(afterLevel) && afterLevel > 0 ? afterLevel : null,
    });
  });

  if (typeof payload.classScoreDelta === "number") {
    bucket.classScoreDelta += payload.classScoreDelta;
  }
  bucket.eventCount += 1;
}

function scoreEffectsToRows(bucket) {
  if (!bucket) return [];
  return Array.from(bucket.byStudent.values()).filter(
    (row) => row.netDelta !== 0 || row.currentScore != null,
  );
}

function patchHomeFromConfigPayload(payload) {
  if (!payload) return;
  if (!runtimeState.home) runtimeState.home = {};
  if (payload.slogan !== undefined) runtimeState.home.slogan = payload.slogan;
  if (payload.targetScore !== undefined) {
    runtimeState.home.targetScore = payload.targetScore;
  }
  if (payload.countdown !== undefined) {
    runtimeState.home.countdown = payload.countdown;
  }
  if (payload.scoreSummary) {
    runtimeState.home.scoreSummary = {
      ...(runtimeState.home.scoreSummary || {}),
      ...payload.scoreSummary,
    };
  }
}

function patchStudentsFromScorePayload(payload) {
  const changes = Array.isArray(payload?.changes) ? payload.changes : [];
  changes.forEach((change) => {
    const student = students.find(
      (item) => Number(item.id) === Number(change.studentId),
    );
    if (!student) return;
    if (change.currentScore != null) {
      student.pts = Number(change.currentScore);
    }
    if (change.currentPetLevel != null) {
      student.lv = Number(change.currentPetLevel);
    }
  });

  if (runtimeState.home?.scoreSummary) {
    if (payload?.classCurrentScore != null) {
      runtimeState.home.scoreSummary.classScore = Number(
        payload.classCurrentScore,
      );
    }
    if (changes.length > 0) {
      runtimeState.home.scoreSummary.currentScoreTotal = students.reduce(
        (sum, item) => sum + Number(item.pts || 0),
        0,
      );
    }
  }
}

const SCORE_ANIM_STAGGER_MS = 120;
const SCORE_FLOAT_ANIM_MS = 1400;
const SCORE_FLOAT_TAIL_MS = 180;

function computeScoreAnimDuration(animCount) {
  const budget = getDisplayEffectBudget();
  const staggerMs = budget.scoreAnimStaggerMs ?? SCORE_ANIM_STAGGER_MS;
  const floatMs = budget.scoreFloatDurationMs ?? SCORE_FLOAT_ANIM_MS;
  const tailMs = budget.scoreFloatTailMs ?? SCORE_FLOAT_TAIL_MS;
  const count = Math.max(0, Number(animCount) || 0);
  if (count <= 0) return 0;
  return (count - 1) * staggerMs + floatMs + tailMs;
}

function patchScoreCardFields(card, student) {
  if (!card || !student) return;
  const pointsEl = card.querySelector(".card-points");
  if (pointsEl) pointsEl.textContent = `${student.pts}分`;
  const levelEl = card.querySelector(".card-level");
  if (levelEl) {
    levelEl.textContent = `Lv.${student.lv}`;
    levelEl.setAttribute("data-lv", lvCategory(student.lv));
  }
}

function cancelPendingScoreGridReorder() {
  if (runtimeState.scoreGridReorderTimer) {
    clearTimeout(runtimeState.scoreGridReorderTimer);
    runtimeState.scoreGridReorderTimer = null;
  }
  runtimeState.scoreGridReorderDueAt = 0;
}

function isScoreVisualsPending() {
  return Boolean(
    runtimeState.scoreGridReorderTimer ||
    runtimeState.scoreRealtimeFlushTimer ||
    runtimeState.scoreGridReorderDueAt ||
    runtimeState.immediateScoreBatch?.eventCount,
  );
}

function applyPendingScoreGridReorder() {
  cancelPendingScoreGridReorder();
  reorderStudents();
  if (!isClassroomPageActive()) return;
  renderStudentGrid({ force: true });
  renderTodayRank();
}

function scheduleScoreGridReorderAfterAnim(animCount) {
  const delay = computeScoreAnimDuration(animCount);
  if (delay <= 0) {
    applyPendingScoreGridReorder();
    return;
  }

  const dueAt = Date.now() + delay;
  if (dueAt > (runtimeState.scoreGridReorderDueAt || 0)) {
    runtimeState.scoreGridReorderDueAt = dueAt;
  }

  if (runtimeState.scoreGridReorderTimer) {
    clearTimeout(runtimeState.scoreGridReorderTimer);
  }

  const remaining = Math.max(
    0,
    runtimeState.scoreGridReorderDueAt - Date.now(),
  );
  runtimeState.scoreGridReorderTimer = setTimeout(() => {
    runtimeState.scoreGridReorderTimer = null;
    runtimeState.scoreGridReorderDueAt = 0;
    applyPendingScoreGridReorder();
  }, remaining);
}

function playSingleStudentScoreAnim(row, options = {}) {
  const studentId = Number(row?.studentId);
  const netDelta = Number(row?.netDelta || 0);
  if (!Number.isFinite(studentId) || studentId <= 0 || netDelta === 0) return;

  const student = students.find((item) => Number(item.id) === studentId);
  if (!student) return;
  if (row.currentScore != null) student.pts = Number(row.currentScore);
  if (row.currentPetLevel != null) student.lv = Number(row.currentPetLevel);

  const card = document.querySelector(`[data-student-id="${studentId}"]`);
  if (card) {
    patchScoreCardFields(card, student);
    const petImgEl = card.querySelector(".card-pet-img");
    if (petImgEl) {
      petImgEl.classList.remove("card-hit-flash");
      void petImgEl.offsetWidth;
      petImgEl.classList.add("card-hit-flash");
    }
    if (!options.suppressSound) {
      playScoreSound(netDelta);
    }
    const cardBounds = card.getBoundingClientRect();
    const floatSpan = document.createElement("span");
    floatSpan.className = "point-float-anim";
    floatSpan.textContent = netDelta > 0 ? `+${netDelta}` : `${netDelta}`;
    floatSpan.style.color =
      netDelta > 0 ? "var(--success-green)" : "var(--brand-red)";
    floatSpan.style.left = `${cardBounds.left + cardBounds.width / 2 - 15}px`;
    floatSpan.style.top = `${cardBounds.top + cardBounds.height / 2 - 20}px`;
    document.body.appendChild(floatSpan);
    const floatMs =
      getDisplayEffectBudget().scoreFloatDurationMs ?? SCORE_FLOAT_ANIM_MS;
    setTimeout(() => floatSpan.remove(), floatMs + 100);
  }
}

function playRemoteScoreAnimations(rows, options = {}) {
  const mode = options.mode || "immediate";
  const suppressSound = Boolean(options.suppressSound);
  const budget = getDisplayEffectBudget();
  const staggerMs =
    options.staggerMs ?? budget.scoreAnimStaggerMs ?? SCORE_ANIM_STAGGER_MS;
  const list = Array.isArray(rows)
    ? rows.filter((row) => row.netDelta !== 0)
    : [];
  if (list.length === 0) return;

  // 方案 A：流畅模式下彻底取消动画效果，直接同步改值并瞬间重排，完全杜绝同步布局抖动
  if (readLowSpecModeEnabled()) {
    list.forEach((row) => {
      const studentId = Number(row.studentId);
      const student = students.find((item) => Number(item.id) === studentId);
      if (!student) return;
      if (row.currentScore != null) student.pts = Number(row.currentScore);
      if (row.currentPetLevel != null) student.lv = Number(row.currentPetLevel);
      const card = document.querySelector(`[data-student-id="${studentId}"]`);
      if (card) {
        patchScoreCardFields(card, student);
      }
    });
    syncClassroomMeta();
    applyPendingScoreGridReorder();
    return;
  }

  const cap = budget.remoteScoreAnimCap ?? (isStandardDisplay() ? 3 : 8);
  const toAnimate =
    mode === "deferred" && list.length > cap
      ? [...list]
          .sort((a, b) => Math.abs(b.netDelta) - Math.abs(a.netDelta))
          .slice(0, cap)
      : list;

  const animatedIds = new Set(toAnimate.map((row) => Number(row.studentId)));
  list.forEach((row) => {
    const studentId = Number(row.studentId);
    const student = students.find((item) => Number(item.id) === studentId);
    if (!student) return;
    if (row.currentScore != null) student.pts = Number(row.currentScore);
    if (row.currentPetLevel != null) student.lv = Number(row.currentPetLevel);
    if (animatedIds.has(studentId)) return;
    const card = document.querySelector(`[data-student-id="${studentId}"]`);
    patchScoreCardFields(card, student);
  });

  toAnimate.forEach((row, index) => {
    setTimeout(
      () => playSingleStudentScoreAnim(row, { suppressSound }),
      index * staggerMs,
    );
  });

  syncClassroomMeta();
  scheduleScoreGridReorderAfterAnim(toAnimate.length);
}

function queueScoreUpgradesFromBucket(bucket) {
  if (!bucket) return;
  const upgrades = Array.from(bucket.upgrades.values()).map((item) => ({
    studentId: item.studentId,
    afterLevel: item.afterLevel,
  }));
  queuePetUpgradeAnimations(upgrades);
}

async function refreshClassMeta() {
  if (!runtimeState.classId) return;
  const home = await apiFetch(`/display/classes/${runtimeState.classId}/home`);
  runtimeState.home = home;
  if (Array.isArray(home?.recentHonors)) {
    mergeRecentHonors(home.recentHonors);
    renderHonorFeed();
  }
  if (Array.isArray(home?.classHonors)) {
    mergeClassHonors(home.classHonors);
  } else {
    await refreshClassHonors().catch(() => []);
  }
  syncClassroomMeta();
  renderClassCountdown();
}

function syncStudentCollectionFromRoster(rosterData) {
  cancelPendingScoreGridReorder();
  const rosterGroups = Array.isArray(rosterData?.groups)
    ? rosterData.groups
    : [];
  const rosterStudents = Array.isArray(rosterData?.students)
    ? rosterData.students
    : [];
  runtimeState.groups = rosterGroups.map((group) => ({
    id: group.id,
    groupNo: group.groupNo,
    name: group.name,
    groupScore: Number(group.groupScore ?? 0),
    groupTotalScore: Number(group.groupTotalScore ?? 0),
    students: rosterStudents
      .filter((student) => Number(student.groupNo) === Number(group.groupNo))
      .map((student) => ({
        id: student.id,
        name: student.name,
        currentScore: student.currentScore,
      })),
  }));

  const groupMap = new Map();
  rosterStudents.forEach((row) => {
    if (row.groupNo == null) return;
    groupMap.set(row.id, {
      id: null,
      groupNo: row.groupNo,
      name: row.groupName,
    });
  });
  runtimeState.groupMap = groupMap;

  const mapped = rosterStudents.map((row) => ({
    id: row.id,
    name: row.name,
    petId: row.pet?.id ? String(row.pet.id).padStart(3, "0") : null,
    studentPetId: row.pet?.studentPetId || row.pet?.petId || null,
    petName: row.pet?.name || null,
    petNickname: row.pet?.nickname || null,
    lastRenameAt: row.pet?.lastRenameAt || null,
    equippedDecorations: row.pet?.equippedDecorations || [],
    ext:
      row.pet?.currentImageUrl?.split(".").pop() ||
      row.pet?.coverUrl?.split(".").pop() ||
      "jpg",
    lv: row.currentPetLevel || row.pet?.currentLevel || 1,
    pts: row.currentScore || 0,
    totalScore: row.totalScore || 0,
    medals: Number(row.honorsCount || 0),
    hasPet: Boolean(row.pet?.currentImageUrl || row.pet?.coverUrl),
    petImageUrl: row.pet?.currentImageUrl || row.pet?.coverUrl || null,
    petStageName: row.pet?.currentStageName || null,
    petTotalScore: row.pet?.totalScore || 0,
    avatarUrl: row.avatarUrl || null,
    group: row.groupNo ?? null,
    groupName: row.groupName || null,
    history: [],
  }));

  students.splice(0, students.length, ...mapped);
  reorderStudents();
  warmStudentPetImages(students);
}

async function refreshStudentRoster() {
  if (!runtimeState.classId) return;
  const roster = await apiFetch(
    `/display/classes/${runtimeState.classId}/roster`,
  );
  syncStudentCollectionFromRoster(roster);
  updateGroupToolbar();
}

async function refreshLeaderboardOnly() {
  if (!runtimeState.classId) return;
  await fetchLeaderboard(runtimeState.leaderboardType || "score");
}

function flushClassroomScoreVisuals(batch, options = {}) {
  const mode = options.mode || "immediate";
  const rows = scoreEffectsToRows(batch);
  const activeRows = rows.filter((row) => row.netDelta !== 0);
  const cap =
    getDisplayEffectBudget().remoteScoreAnimCap ??
    (isStandardDisplay() ? 3 : 8);
  const animCount =
    mode === "deferred" && activeRows.length > cap ? cap : activeRows.length;
  playRemoteScoreAnimations(rows, {
    mode,
    suppressSound: Boolean(batch?.suppressSound),
  });
  queueScoreUpgradesFromBucket(batch);
  setTimeout(() => {
    playPendingPetUpgradeAnimations();
  }, computeScoreAnimDuration(animCount));
}

function flushClassroomStaleUpdates(options = {}) {
  const animationMode = options.animationMode || "none";
  syncClassroomMeta();
  renderClassCountdown();

  if (
    animationMode === "deferred" &&
    runtimeState.pendingScoreEffects?.eventCount
  ) {
    flushClassroomScoreVisuals(runtimeState.pendingScoreEffects, {
      mode: "deferred",
    });
    runtimeState.pendingScoreEffects = createEmptyScoreEffectsBucket();
  } else {
    renderStudentGrid({ force: true });
    renderTodayRank();
    playPendingPetUpgradeAnimations();
  }

  runtimeState.stalePages?.delete("classroom");
}

function flushStalePageUpdates(pageKey) {
  if (pageKey === "classroom" && runtimeState.stalePages?.has("classroom")) {
    flushClassroomStaleUpdates({
      animationMode:
        runtimeState.pendingScoreEffects?.eventCount > 0 ? "deferred" : "none",
    });
    return;
  }
  if (
    pageKey === "leaderboard" &&
    runtimeState.stalePages?.has("leaderboard")
  ) {
    refreshLeaderboardOnly().finally(() => {
      runtimeState.stalePages.delete("leaderboard");
    });
    return;
  }
  if (pageKey === "exchange" && runtimeState.stalePages?.has("exchange")) {
    runtimeState.stalePages.delete("exchange");
  }
}

function handleClassLeaderboardChanged() {
  markPageStale("leaderboard");
  if (getActiveDisplayPage() === "page-leaderboard") {
    refreshLeaderboardOnly().finally(() => {
      runtimeState.stalePages?.delete("leaderboard");
    });
  }
}

function handleClassConfigChanged(payload) {
  patchHomeFromConfigPayload(payload);
  markPageStale("classroom");
  if (isClassroomPageActive()) {
    syncClassroomMeta();
    renderClassCountdown();
    runtimeState.stalePages.delete("classroom");
  }
}

function handleClassScoreChanged(payload) {
  patchStudentsFromScorePayload(payload);

  markPageStale("classroom");
  markPageStale("leaderboard");
  markPageStale("exchange");
  scheduleMarqueeRefresh();

  if (isClassroomPageActive()) {
    accumulateScoreEffects(ensureImmediateScoreBatch(), payload);
    scheduleScoreRealtimeFlush();
    return;
  }

  accumulateScoreEffects(ensurePendingScoreEffects(), payload);
}

async function handleClassStudentOrGroupChanged() {
  markPageStale("classroom");
  markPageStale("leaderboard");
  markPageStale("exchange");
  if (isClassroomPageActive()) {
    await refreshStudentRoster();
    renderStudentGrid({ force: true });
    renderTodayRank();
    runtimeState.stalePages.delete("classroom");
  }
}

function handleRewardOrderCreated(payload) {
  if (payload?.scoreSummary) {
    patchHomeFromConfigPayload({ scoreSummary: payload.scoreSummary });
  }
  markPageStale("classroom");
  markPageStale("exchange");
  scheduleMarqueeRefresh();
  if (isClassroomPageActive()) {
    refreshStudentRoster()
      .then(() => {
        syncClassroomMeta();
        renderStudentGrid({ force: true });
        renderTodayRank();
      })
      .catch(() => {});
    runtimeState.stalePages.delete("classroom");
  }
}

function scheduleScoreRealtimeFlush() {
  if (!runtimeState.classId || !isClassroomPageActive()) return;
  if (runtimeState.scoreRealtimeFlushTimer) {
    clearTimeout(runtimeState.scoreRealtimeFlushTimer);
  }
  const flushDelay = getDisplayEffectBudget().realtimeRefreshDelay ?? 100;
  runtimeState.scoreRealtimeFlushTimer = setTimeout(() => {
    runtimeState.scoreRealtimeFlushTimer = null;
    const batch = runtimeState.immediateScoreBatch;
    runtimeState.immediateScoreBatch = null;
    if (!batch || batch.eventCount === 0) return;
    flushClassroomScoreVisuals(batch, { mode: "immediate" });
    runtimeState.stalePages?.delete("classroom");
    refreshLeaderboardOnly().catch(() => {});
  }, flushDelay);
}

function startClassMetaPoll() {
  stopClassMetaPoll();
  if (!isClassroomPageActive()) return;
  runtimeState.metaPollTimer = window.setInterval(() => {
    if (runtimeState.socket?.connected || !isClassroomPageActive()) return;
    refreshClassMeta().catch(() => {});
  }, 60000);
}

function stopClassMetaPoll() {
  if (runtimeState.metaPollTimer) {
    clearInterval(runtimeState.metaPollTimer);
    runtimeState.metaPollTimer = null;
  }
}

function startDisplayHeartbeat() {
  stopDisplayHeartbeat();
  const socket = runtimeState.socket;
  if (!socket || !socket.connected || !runtimeState.terminalCode) return;
  runtimeState.displayHeartbeatTimer = window.setInterval(() => {
    if (!runtimeState.socket?.connected || !runtimeState.terminalCode) return;
    runtimeState.socket.emit("subscribe.display", {
      terminalCode: runtimeState.terminalCode,
    });
  }, 30000);
}

function stopDisplayHeartbeat() {
  if (runtimeState.displayHeartbeatTimer) {
    clearInterval(runtimeState.displayHeartbeatTimer);
    runtimeState.displayHeartbeatTimer = null;
  }
}

function connectRealtime() {
  if (runtimeState.socket || typeof window.io !== "function") return;
  setRealtimeConnectionStatus("connecting", "正在连接实时服务…");
  const socket = window.io(`${getSocketBase()}/ws`, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    auth: {
      token: runtimeState.token || runtimeState.setupAdminToken || "",
      terminalCode: runtimeState.terminalCode || "",
    },
  });
  runtimeState.socket = socket;

  socket.on("connect", () => {
    if (realtimeStatusWasConnected) {
      showDisplayToast("实时连接已恢复", { duration: 2200 });
    }
    realtimeStatusWasConnected = true;
    runtimeState.socketAuthed = false;
  });
  socket.on("auth.ready", (payload) => {
    if (payload?.ok === false) {
      runtimeState.socketAuthed = false;
      setRealtimeConnectionStatus(
        realtimeStatusWasConnected ? "reconnecting" : "connecting",
        realtimeStatusWasConnected
          ? "实时连接已断开，正在自动重试…"
          : "无法连接实时服务，正在重试…",
      );
      return;
    }
    runtimeState.socketAuthed = true;
    setRealtimeConnectionStatus("hidden");
    subscribeRealtimeRooms();
    startDisplayHeartbeat();
    stopClassMetaPoll();
    if (runtimeState.stalePages?.size) {
      const active = getActiveDisplayPage();
      if (active === "page-classroom") {
        flushClassroomStaleUpdates({
          animationMode:
            runtimeState.pendingScoreEffects?.eventCount > 0
              ? "deferred"
              : "none",
        });
      }
    }
  });
  socket.on("connect_error", (error) => {
    console.warn("[display-realtime] connect_error:", error?.message || error);
    setRealtimeConnectionStatus(
      realtimeStatusWasConnected ? "reconnecting" : "connecting",
      realtimeStatusWasConnected
        ? "实时连接已断开，正在自动重试…"
        : "无法连接实时服务，正在重试…",
    );
  });
  socket.on("disconnect", (reason) => {
    console.warn("[display-realtime] disconnected:", reason);
    runtimeState.socketAuthed = false;
    // 连接断开时清除订阅状态缓存，确保重新连接鉴权成功后能重新向后端订阅房间
    runtimeState.subscribedDisplayCode = null;
    runtimeState.subscribedClassId = null;
    stopDisplayHeartbeat();
    setRealtimeConnectionStatus(
      "disconnected",
      "实时连接已断开，请检查网络或稍后重试",
    );
    startClassMetaPoll();
  });

  socket.on("class.config.changed", (payload) => {
    if (shouldReceiveCallOnlyRealtimeEvents()) {
      return;
    }
    if (
      payload?.classId &&
      Number(payload.classId) !== Number(runtimeState.classId)
    ) {
      return;
    }
    handleClassConfigChanged(payload);
  });

  socket.on("class.score.changed", (payload) => {
    if (shouldReceiveCallOnlyRealtimeEvents()) {
      return;
    }
    if (
      payload?.classId &&
      Number(payload.classId) !== Number(runtimeState.classId)
    ) {
      return;
    }
    handleClassScoreChanged(payload);
  });

  socket.on("class.honor.granted", (payload) => {
    if (shouldReceiveCallOnlyRealtimeEvents()) {
      return;
    }
    if (
      payload?.classId &&
      Number(payload.classId) !== Number(runtimeState.classId)
    ) {
      return;
    }
    handleClassHonorGranted(payload);
  });

  socket.on("class.leaderboard.changed", (payload) => {
    if (shouldReceiveCallOnlyRealtimeEvents()) {
      return;
    }
    if (
      payload?.classId &&
      Number(payload.classId) !== Number(runtimeState.classId)
    ) {
      return;
    }
    handleClassLeaderboardChanged();
  });

  ["class.student.changed", "class.group.changed"].forEach((eventName) => {
    socket.on(eventName, (payload) => {
      if (shouldReceiveCallOnlyRealtimeEvents()) {
        return;
      }
      if (
        payload?.classId &&
        Number(payload.classId) !== Number(runtimeState.classId)
      ) {
        return;
      }
      handleClassStudentOrGroupChanged().catch(() => {});
    });
  });

  socket.on("class.group_score.changed", (payload) => {
    if (shouldReceiveCallOnlyRealtimeEvents()) {
      return;
    }
    if (
      payload?.classId &&
      Number(payload.classId) !== Number(runtimeState.classId)
    ) {
      return;
    }
    if (
      document.getElementById("groupManageModal")?.classList.contains("active")
    ) {
      refreshGroupScoreData().catch(() => {});
      if (
        document
          .getElementById("groupScoreRecordsModal")
          ?.classList.contains("active")
      ) {
        loadGroupScoreRecords().catch(() => {});
      }
    } else {
      apiFetch(`/classes/${runtimeState.classId}/groups`)
        .then((latestGroups) => {
          if (Array.isArray(latestGroups)) {
            runtimeState.groups = latestGroups;
            renderTodayRank();
          }
        })
        .catch(() => {});
    }
  });

  socket.on("reward.order.created", (payload) => {
    if (shouldReceiveCallOnlyRealtimeEvents()) {
      return;
    }
    if (
      payload?.classId &&
      Number(payload.classId) !== Number(runtimeState.classId)
    ) {
      return;
    }
    handleRewardOrderCreated(payload);
  });

  socket.on("display.unlock.changed", (payload) => {
    if (shouldReceiveCallOnlyRealtimeEvents()) {
      return;
    }
    if (
      payload?.displayTerminalCode &&
      payload.displayTerminalCode !== runtimeState.terminalCode
    ) {
      return;
    }
    if (runtimeState.classId) {
      refreshUnlockStatus().catch(() => {});
    }
  });

  socket.on("call.queue.changed", (payload) => {
    handleCallQueueChanged(payload);
  });
}

function subscribeRealtimeRooms() {
  const socket = runtimeState.socket;
  if (!socket || !socket.connected || !runtimeState.socketAuthed) return;

  if (!runtimeState.terminalCode && runtimeState.subscribedDisplayCode) {
    socket.emit("unsubscribe.room", {
      room: `display:${runtimeState.subscribedDisplayCode}`,
    });
    runtimeState.subscribedDisplayCode = null;
  } else if (
    runtimeState.terminalCode &&
    runtimeState.subscribedDisplayCode !== runtimeState.terminalCode
  ) {
    if (runtimeState.subscribedDisplayCode) {
      socket.emit("unsubscribe.room", {
        room: `display:${runtimeState.subscribedDisplayCode}`,
      });
    }
    socket.emit("subscribe.display", {
      terminalCode: runtimeState.terminalCode,
    });
    runtimeState.subscribedDisplayCode = runtimeState.terminalCode;
  }

  if (!runtimeState.classId && runtimeState.subscribedClassId) {
    socket.emit("unsubscribe.room", {
      room: `class:${runtimeState.subscribedClassId}`,
    });
    runtimeState.subscribedClassId = null;
  } else if (
    runtimeState.classId &&
    runtimeState.subscribedClassId !== runtimeState.classId
  ) {
    if (runtimeState.subscribedClassId) {
      socket.emit("unsubscribe.room", {
        room: `class:${runtimeState.subscribedClassId}`,
      });
    }
    socket.emit("subscribe.class", { classId: runtimeState.classId });
    runtimeState.subscribedClassId = runtimeState.classId;
  }
}

function scheduleRealtimeRefresh(eventName = "unknown") {
  if (!runtimeState.classId) return;
  if (eventName === "class.config.changed") {
    handleClassConfigChanged({});
    return;
  }
  bootstrapDisplayData({
    authenticated: Boolean(runtimeState.token && runtimeState.user),
    silent: true,
    reason: "realtime-fallback",
  }).catch(() => {});
}

function goSetupStep(step) {
  runtimeState.setupStep = step;
  for (let i = 1; i <= 4; i += 1) {
    document
      .getElementById(`setupStep${i}`)
      ?.classList.toggle("active", i === Math.min(step, 4));
  }
  for (let i = 1; i <= 5; i += 1) {
    document
      .getElementById(`setupPanel${i}`)
      ?.classList.toggle("active", i === step);
  }
  if (step === 2) {
    const codeEl = document.getElementById("setupTerminalCode");
    const nameInput = document.getElementById("setupTerminalName");
    if (codeEl) codeEl.textContent = runtimeState.terminalCode;
    if (nameInput) nameInput.value = runtimeState.terminalName;
  }
}

function syncSetupMode() {
  const isRebind = runtimeState.setupMode === "rebind";
  const textMap = {
    brandTitle: isRebind ? "重新绑定展示终端" : "启用班级展示终端",
    brandCopy: isRebind
      ? "如需更换当前终端绑定的班级，请由班主任或学校管理账号重新授权并完成改绑。完成后，终端将默认进入新的班级展示空间。"
      : "本终端完成初始化后，将自动进入对应班级的展示空间。以后学生可随时查看积分和萌宠成长，教师在需要时解锁操作即可。",
    welcomeTitle: isRebind
      ? "重新绑定当前展示终端"
      : "欢迎启用育英星宠展示终端",
    welcomeDesc: isRebind
      ? "这一过程会保留当前终端编号，并重新由班主任或学校管理账号授权选择新的绑定班级。改绑完成后，系统会返回首页。"
      : "这一过程仅需几步：识别当前终端、完成账号授权，并将本终端绑定到指定班级。绑定完成后，系统会自动进入该班的展示主页。",
    welcomeAction: isRebind ? "开始重新绑定" : "开始初始化",
    authTitle: isRebind
      ? "请由班主任或管理员确认改绑"
      : "请由班主任或管理员完成授权",
    authDesc: isRebind
      ? "为保证终端绑定安全，重新绑定班级也需要由班主任及以上账号完成授权。授权成功后，即可继续选择新的班级。"
      : "为保证终端绑定安全，班主任及以上账号可完成首次启用和后续改绑。授权成功后，即可继续选择本终端要绑定的班级。",
    bindTitle: isRebind ? "选择新的默认展示班级" : "选择本终端要进入的班级",
    bindDesc: isRebind
      ? "请先筛选年级，再勾选要绑定的班级。确认后，当前终端会切换为新班级的大屏展示端。"
      : "请先筛选年级，再勾选要绑定的班级。绑定成功后，这块大屏默认会进入对应班级的展示页，后续也可再次改绑。",
    bindAction: isRebind ? "确认重新绑定" : "确认绑定并启用终端",
    successTitle: isRebind ? "终端重新绑定完成" : "终端初始化完成",
  };

  const bindings = [
    ["setupBrandTitle", textMap.brandTitle],
    ["setupBrandCopy", textMap.brandCopy],
    ["setupWelcomeTitle", textMap.welcomeTitle],
    ["setupWelcomeDesc", textMap.welcomeDesc],
    ["setupWelcomeActionBtn", textMap.welcomeAction],
    ["setupAuthTitle", textMap.authTitle],
    ["setupAuthDesc", textMap.authDesc],
    ["setupBindTitle", textMap.bindTitle],
    ["setupBindDesc", textMap.bindDesc],
    ["setupBindActionBtn", textMap.bindAction],
    ["setupSuccessTitle", textMap.successTitle],
  ];

  bindings.forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  });

  document
    .getElementById("setupCloseBtn")
    ?.classList.toggle("visible", isRebind);
}

function setSetupMessage(targetId, message, type = "error") {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.textContent = message || "";
  el.style.color = type === "success" ? "#1e8e5a" : "#d64343";
}

async function openTerminalRebind() {
  runtimeState.setupMode = "rebind";
  runtimeState.setupAdminToken = "";
  runtimeState.setupAdminRoleCode = "";
  runtimeState.selectedSetupClassId = runtimeState.classId;
  setSetupMessage("setupAdminMessage", "");
  setSetupMessage("setupBindMessage", "");
  syncSetupMode();
  clearAuthState({ preserveClassId: true });
  try {
    const terminalState = await loadTerminalState();
    runtimeState.classId = terminalState.classId || runtimeState.classId;
    runtimeState.selectedSetupClassId = runtimeState.classId;
  } catch (error) {
    console.error(error);
  }
  navigateTo("setup");
  hydrateSetupUsername();
  goSetupStep(2);
}

function closeTerminalRebind() {
  runtimeState.setupMode = "initialize";
  runtimeState.setupAdminToken = "";
  runtimeState.setupAdminRoleCode = "";
  runtimeState.selectedSetupGradeName = "";
  setSetupMessage("setupAdminMessage", "");
  setSetupMessage("setupBindMessage", "");
  syncSetupMode();
  navigateTo("entry");
}

function getClassBindingsByClassId(classId) {
  return (runtimeState.classBindings || []).filter(
    (item) => Number(item.classId) === Number(classId),
  );
}

function isSetupClassSelectable(classId) {
  const bindings = getClassBindingsByClassId(classId);
  if (bindings.length === 0) return true;
  if (bindings.some((b) => b.terminalCode === runtimeState.terminalCode))
    return true;
  if (bindings.length < 2) return true;
  return canOverrideClassDisplayBinding();
}

function getSetupClassBindingHint(classId) {
  const others = getClassBindingsByClassId(classId).filter(
    (b) => b.terminalCode !== runtimeState.terminalCode,
  );
  if (others.length === 0) return "";
  const labels = others.map((b) => b.terminalName || b.terminalCode);
  if (others.length >= 2 && !canOverrideClassDisplayBinding()) {
    return `已绑定终端：${labels.join("、")}（已达上限）`;
  }
  if (others.length >= 2 && canOverrideClassDisplayBinding()) {
    return `已绑定终端：${labels.join("、")}（管理员可强制绑定）`;
  }
  return `已绑定终端：${labels.join("、")}`;
}

function normalizeGradeName(row) {
  return String(row?.gradeName || "未设置年级").trim() || "未设置年级";
}

function getSetupGradeNames() {
  const seen = new Set();
  return runtimeState.availableClasses
    .map((row) => normalizeGradeName(row))
    .filter((gradeName) => {
      if (seen.has(gradeName)) return false;
      seen.add(gradeName);
      return true;
    });
}

function getFilteredSetupClasses() {
  if (!runtimeState.selectedSetupGradeName) {
    return [];
  }
  return runtimeState.availableClasses.filter(
    (row) => normalizeGradeName(row) === runtimeState.selectedSetupGradeName,
  );
}

function ensureSelectedSetupGrade() {
  const gradeNames = getSetupGradeNames();
  const selectedRow = runtimeState.availableClasses.find(
    (row) => Number(row.id) === Number(runtimeState.selectedSetupClassId),
  );
  if (selectedRow) {
    runtimeState.selectedSetupGradeName = normalizeGradeName(selectedRow);
    return;
  }
  if (
    runtimeState.selectedSetupGradeName &&
    gradeNames.includes(runtimeState.selectedSetupGradeName)
  ) {
    return;
  }
  runtimeState.selectedSetupGradeName = gradeNames[0] || "";
}

function renderSetupGradeFilter() {
  const wrap = document.getElementById("setupGradeFilter");
  if (!wrap) return;
  const gradeNames = getSetupGradeNames();
  if (gradeNames.length === 0) {
    wrap.innerHTML = '<div class="setup-empty">暂无可绑定班级</div>';
    return;
  }
  const gradeCounts = runtimeState.availableClasses.reduce((acc, row) => {
    const gradeName = normalizeGradeName(row);
    acc.set(gradeName, (acc.get(gradeName) || 0) + 1);
    return acc;
  }, new Map());
  wrap.innerHTML = gradeNames
    .map((gradeName) => {
      return `
        <button
          type="button"
          class="setup-grade-chip ${runtimeState.selectedSetupGradeName === gradeName ? "active" : ""}"
          data-setup-grade-name="${escapeHtml(gradeName)}"
          onclick="selectSetupGrade(${escapeHtml(JSON.stringify(gradeName))})"
        >
          <span>${escapeHtml(gradeName)}</span>
          <b>${gradeCounts.get(gradeName) || 0}</b>
        </button>`;
    })
    .join("");
}

function syncSetupClassSelection() {
  const wrap = document.getElementById("setupClassGrid");
  if (!wrap) return;
  const selectedClassId = String(runtimeState.selectedSetupClassId ?? "");
  wrap.querySelectorAll(".setup-class-card").forEach((button) => {
    button.classList.toggle(
      "selected",
      button.dataset.classId === selectedClassId,
    );
  });
}

function selectSetupGrade(gradeName) {
  runtimeState.selectedSetupGradeName = gradeName;
  const filtered = getFilteredSetupClasses();
  if (
    !filtered.some(
      (row) => Number(row.id) === Number(runtimeState.selectedSetupClassId),
    ) ||
    !isSetupClassSelectable(runtimeState.selectedSetupClassId)
  ) {
    runtimeState.selectedSetupClassId = null;
  }
  renderSetupClassGrid();
}

function bindSetupClassGridDrag() {
  const wrap = document.getElementById("setupClassGrid");
  if (!wrap || runtimeState.setupClassGridDrag === wrap) return;
  runtimeState.setupClassGridDrag = wrap;
  let pointerId = null;
  let pointerType = "";
  let isPointerDown = false;
  let isDragging = false;
  let didDrag = false;
  let startY = 0;
  let startScrollTop = 0;

  wrap.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || wrap.scrollHeight <= wrap.clientHeight) return;
    if (event.pointerType === "mouse") return;
    pointerId = event.pointerId;
    pointerType = event.pointerType || "";
    isPointerDown = true;
    isDragging = false;
    didDrag = false;
    startY = event.clientY;
    startScrollTop = wrap.scrollTop;
  });
  wrap.addEventListener("pointermove", (event) => {
    if (!isPointerDown || event.pointerId !== pointerId) return;
    if (Math.abs(event.clientY - startY) > 4) {
      didDrag = true;
      isDragging = true;
      wrap.classList.add("dragging");
      if (!wrap.hasPointerCapture?.(event.pointerId)) {
        wrap.setPointerCapture?.(event.pointerId);
      }
    }
    if (!isDragging) return;
    event.preventDefault();
    wrap.scrollTop = startScrollTop - (event.clientY - startY);
  });
  ["pointerup", "pointercancel"].forEach((eventName) => {
    wrap.addEventListener(eventName, (event) => {
      if (!isPointerDown || event.pointerId !== pointerId) return;
      isPointerDown = false;
      isDragging = false;
      pointerId = null;
      pointerType = "";
      wrap.classList.remove("dragging");
      try {
        if (
          !wrap.hasPointerCapture ||
          wrap.hasPointerCapture(event.pointerId)
        ) {
          wrap.releasePointerCapture?.(event.pointerId);
        }
      } catch {
        // ignore capture release failures from embedded shells
      }
    });
  });
  wrap.addEventListener("pointerleave", () => {
    if (!isPointerDown || pointerType === "mouse") return;
    if (!isDragging) return;
    isPointerDown = false;
    isDragging = false;
    pointerId = null;
    pointerType = "";
    wrap.classList.remove("dragging");
  });
  wrap.addEventListener(
    "click",
    (event) => {
      if (!didDrag) return;
      event.preventDefault();
      event.stopPropagation();
      didDrag = false;
    },
    true,
  );
}

function renderSetupClassGrid() {
  const wrap = document.getElementById("setupClassGrid");
  if (!wrap) return;
  ensureSelectedSetupGrade();
  renderSetupGradeFilter();
  bindSetupClassGridDrag();
  const filteredClasses = getFilteredSetupClasses();
  if (filteredClasses.length === 0) {
    wrap.innerHTML = '<div class="setup-empty">当前年级暂无可绑定班级</div>';
    return;
  }
  wrap.innerHTML = filteredClasses
    .map((row) => {
      const selectable = isSetupClassSelectable(row.id);
      const bindingHint = getSetupClassBindingHint(row.id);
      const selected =
        Number(runtimeState.selectedSetupClassId) === Number(row.id);
      return `
            <button type="button" class="setup-class-card ${selected ? "selected" : ""} ${selectable ? "" : "disabled"}" data-class-id="${row.id}" ${selectable ? "" : "disabled"} onclick="selectSetupClass(${row.id})">
              <span class="setup-class-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
              <div class="setup-class-name">${escapeHtml(row.gradeName || "")} ${escapeHtml(row.name)}</div>
              <div class="setup-class-sub">
                班主任：${escapeHtml(row.homeroomTeacher?.name || "未设置")}<br />
                口号：${escapeHtml(row.slogan || "未设置")}${bindingHint ? `<br /><span class="setup-class-bound">${escapeHtml(bindingHint)}</span>` : ""}
              </div>
            </button>`;
    })
    .join("");
}

function selectSetupClass(classId) {
  const nextClassId = Number(classId);
  if (!Number.isFinite(nextClassId)) return;
  if (!isSetupClassSelectable(nextClassId)) {
    setSetupMessage(
      "setupBindMessage",
      "该班级已绑定 2 个终端，一个班级最多同时绑定两个终端",
    );
    return;
  }
  if (runtimeState.selectedSetupClassId === nextClassId) return;
  runtimeState.selectedSetupClassId = nextClassId;
  setSetupMessage("setupBindMessage", "");
  syncSetupClassSelection();
}

async function handleSetupAdminLogin() {
  const username = document.getElementById("setupAdminUsername")?.value?.trim();
  const password = document.getElementById("setupAdminPassword")?.value || "";
  if (!username || !password) {
    setSetupMessage("setupAdminMessage", "请输入班主任或管理员账号和密码");
    return;
  }
  setSetupMessage("setupAdminMessage", "");
  try {
    const result = await apiFetchWithToken("/auth/login", "", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        terminalType: "display",
      }),
    });
    if (!canInitializeDisplayTerminalRole(result.user?.roleCode)) {
      throw new Error("当前账号无权绑定展示终端，请使用班主任或学校管理账号");
    }
    runtimeState.setupAdminToken = result.token;
    runtimeState.setupAdminRoleCode = result.user?.roleCode || "";
    setStoredSetupUsername(username);
    const [classes, bindings] = await Promise.all([
      apiFetchWithToken("/classes", runtimeState.setupAdminToken),
      apiFetchWithToken(
        `/display/class-bindings?terminalCode=${encodeURIComponent(runtimeState.terminalCode)}`,
        runtimeState.setupAdminToken,
      ),
    ]);
    runtimeState.availableClasses = classes || [];
    runtimeState.classBindings = bindings || [];
    runtimeState.selectedSetupClassId =
      runtimeState.setupMode === "rebind" &&
      runtimeState.availableClasses.some(
        (row) => Number(row.id) === Number(runtimeState.classId),
      )
        ? Number(runtimeState.classId)
        : null;
    runtimeState.selectedSetupGradeName = "";
    renderSetupClassGrid();
    setSetupMessage("setupAdminMessage", "授权成功", "success");
    goSetupStep(4);
  } catch (error) {
    runtimeState.setupAdminToken = "";
    runtimeState.setupAdminRoleCode = "";
    setSetupMessage("setupAdminMessage", error.message || "授权失败");
  } finally {
    clearDisplayPasswordInputs();
  }
}

async function confirmTerminalInitialize() {
  const terminalNameInput = document.getElementById("setupTerminalName");
  runtimeState.terminalName =
    terminalNameInput?.value?.trim() || runtimeState.terminalName;
  if (!runtimeState.setupAdminToken) {
    setSetupMessage("setupBindMessage", "请先完成账号授权");
    goSetupStep(3);
    return;
  }
  if (!runtimeState.selectedSetupClassId) {
    setSetupMessage("setupBindMessage", "请选择要绑定的班级");
    return;
  }
  if (!isSetupClassSelectable(runtimeState.selectedSetupClassId)) {
    setSetupMessage(
      "setupBindMessage",
      "该班级已绑定 2 个终端，一个班级最多同时绑定两个终端",
    );
    return;
  }
  if (!runtimeState.terminalName) {
    setSetupMessage("setupBindMessage", "请填写终端名称");
    goSetupStep(2);
    return;
  }
  setSetupMessage("setupBindMessage", "");
  try {
    const result = await apiFetchWithToken(
      "/display/terminal-initialize",
      runtimeState.setupAdminToken,
      {
        method: "POST",
        body: JSON.stringify({
          terminalCode: runtimeState.terminalCode,
          terminalName: runtimeState.terminalName,
          classId: runtimeState.selectedSetupClassId,
        }),
      },
    );
    window.DisplayRuntime.setTerminalName(runtimeState.terminalName);
    runtimeState.classId = result.classId;
    runtimeState.terminalInitialized = true;
    const latestTerminalState = await loadTerminalState().catch(() => ({
      terminalCode: result.terminalCode,
      terminalName: result.terminalName,
      isInitialized: true,
      classId: result.classId,
      classInfo: result.classInfo || null,
    }));
    runtimeState.classId = latestTerminalState.classId || result.classId;
    runtimeState.terminalInitialized = Boolean(
      latestTerminalState.isInitialized,
    );
    syncLoginTerminalInfoFromTerminalState(latestTerminalState);
    applyTerminalClassInfoToHome(
      latestTerminalState.classInfo || result.classInfo || null,
    );
    subscribeRealtimeRooms();
    const successText = document.getElementById("setupSuccessText");
    const successPrefix =
      runtimeState.setupMode === "rebind" ? "已成功重新绑定至" : "已成功绑定至";
    if (successText) {
      successText.innerHTML = `当前展示终端${successPrefix} <strong style="color:var(--brand-red);">${escapeHtml(
        result.classInfo?.gradeName || "",
      )} ${escapeHtml(result.classInfo?.className || "")}</strong>，<br />正在返回教师登录页。`;
    }
    goSetupStep(5);
    window.setTimeout(async () => {
      runtimeState.setupAdminToken = "";
      runtimeState.setupAdminRoleCode = "";
      await bootstrapDisplayData({
        authenticated: false,
        silent: true,
        deferNonCritical: true,
        renderInitialViews: false,
      });
      navigateTo("entry");
    }, 1800);
  } catch (error) {
    setSetupMessage("setupBindMessage", error.message || "终端绑定失败");
  }
}

async function loadTerminalState() {
  const state = await apiFetchWithToken(
    `/display/terminal-state?terminalCode=${encodeURIComponent(runtimeState.terminalCode)}`,
    "",
  );
  runtimeState.terminalName = state.terminalName || runtimeState.terminalName;
  if (runtimeState.terminalName) {
    window.DisplayRuntime.setTerminalName(runtimeState.terminalName);
  }
  runtimeState.terminalInitialized = Boolean(state.isInitialized);
  runtimeState.classId = state.classId || null;
  syncLoginTerminalInfoFromTerminalState(state);
  return state;
}

function updateLockMeta(lines = []) {
  return window.DisplayUI.renderLockMeta(lines);
}

function applyLockOverlay() {
  syncBottomUserName();
  window.DisplayUI.renderLockOverlay(
    window.DisplayAuth.createLockOverlayViewModel({
      activePageId: document.querySelector(".page.active")?.id || "",
      classId: runtimeState.classId,
      className: runtimeState.home?.className || "",
      lastLockedAt: runtimeState.lastLockedAt,
      lockOverlayForced: runtimeState.lockOverlayForced,
      lockStatus: runtimeState.lockStatus,
      terminalCode: runtimeState.terminalCode,
      unlockedUntil: runtimeState.unlockedUntil,
      user: runtimeState.user,
    }),
  );
  syncCallOverlayAction();
}

function ensureOperationUnlocked() {
  if (runtimeState.lockStatus === "active") {
    if (shouldRenewUnlockSoon()) {
      renewDisplayUnlockSession().catch(() => {});
    }
    return true;
  }
  runtimeState.lockOverlayForced = true;
  applyLockOverlay();
  return false;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function petImg(s) {
  return petImgVariant(s, 400);
}

function leaderboardPetImg(row, localStudent) {
  if (localStudent) return petImg(localStudent);
  return petImg({
    hasPet:
      row.hasPet !== undefined
        ? row.hasPet
        : Boolean(row.petImageUrl || row.petName),
    petImageUrl: row.petImageUrl || null,
    avatarUrl: row.avatarUrl || null,
    petName: row.petName,
    name: row.name,
  });
}

function getRankedStudentsByScore() {
  return [...students].sort(
    (a, b) => b.pts - a.pts || a.name.localeCompare(b.name, "zh-CN"),
  );
}

function updateGroupToolbar() {
  const allBtn = document.getElementById("gfAll");
  const chips = document.getElementById("groupFilterChips");
  if (allBtn) allBtn.classList.toggle("active", groupFilter === null);
  if (!chips) return;
  const groups = getGroupOptions();
  chips.innerHTML = groups
    .map(
      (group) => `
        <button
          type="button"
          class="toolbar-chip ${groupFilter === group.groupNo ? "active" : ""}"
          onclick="setGroupFilter(${group.groupNo})"
        >
          ${escapeHtml(group.name || `第${group.groupNo}组`)}
        </button>`,
    )
    .join("");
  if (
    groupFilter !== null &&
    !groups.some((group) => group.groupNo === groupFilter)
  ) {
    groupFilter = null;
    if (allBtn) allBtn.classList.add("active");
  }
}

function syncClassroomMeta() {
  const home = runtimeState.home;
  if (!home) return;
  const className = home.className || "育英星宠";
  const teacherName = home.homeroomTeacher?.name || "未设置";
  const slogan = home.slogan || "待设置";
  const targetScore = Number(home.targetScore || 0);
  const currentScore = Number(home.scoreSummary?.currentScoreTotal || 0);
  const goalPercent =
    targetScore > 0 ? Math.min(100, (currentScore / targetScore) * 100) : 0;

  const topBarClass = document.getElementById("classroomClassName");
  const topBarSlogan = document.getElementById("classroomSlogan");
  const transClass = document.getElementById("transClassName");
  const transTeacher = document.getElementById("transClassTeacher");
  const transMotto = document.getElementById("transClassMotto");
  const lbSubtitle = document.getElementById("leaderboardSubtitle");
  const goalCurrent = document.getElementById("goalCurrentLabel");
  const goalTargetLabel = document.getElementById("goalTargetLabel");
  const goalTargetValue = document.getElementById("goalTargetValue");
  const bottomTotal = document.getElementById("bottomTotalScore");
  const bar = document.getElementById("goalBar");
  const loginTitle = document.getElementById("loginPageTitle");
  const loginSummary = document.getElementById("loginClassSummary");
  const loginTerminalMeta = document.getElementById("loginTerminalMeta");
  const entryTerminal = document.getElementById("entryTerminalName");
  const entryTitle = document.getElementById("entryClassTitle");
  const entrySummary = document.getElementById("entryClassSummary");
  const entryTeacher = document.getElementById("entryTeacherName");

  if (topBarClass) topBarClass.textContent = className;
  if (topBarSlogan)
    topBarSlogan.innerHTML = escapeHtml(slogan).replace(/\s+/g, " &nbsp; ");
  if (transClass) transClass.textContent = className;
  if (transTeacher) transTeacher.textContent = `班主任：${teacherName}`;
  if (transMotto)
    transMotto.innerHTML = escapeHtml(slogan).replace(/\s+/g, " &nbsp; ");
  if (lbSubtitle) lbSubtitle.textContent = `${className}同学成就与贡献`;
  if (goalCurrent) goalCurrent.textContent = String(currentScore);
  if (goalTargetLabel) goalTargetLabel.textContent = String(targetScore || 0);
  if (goalTargetValue) goalTargetValue.textContent = String(targetScore || 0);
  if (bottomTotal) bottomTotal.textContent = String(currentScore);
  if (bar) {
    bar.style.width = `${goalPercent.toFixed(1)}%`;
  }
  if (loginTitle)
    loginTitle.textContent = `${classroomGradeLabel(home)} ${className}`;
  if (loginSummary) {
    const parts = [`班主任：${teacherName}`];
    if (slogan) parts.push(`班级口号：${slogan}`);
    loginSummary.textContent = parts.join(" ｜ ");
  }
  if (loginTerminalMeta) {
    loginTerminalMeta.textContent = `终端名称：${runtimeState.terminalName || runtimeState.terminalCode}`;
  }
  if (entryTerminal) {
    entryTerminal.textContent =
      runtimeState.terminalName || runtimeState.terminalCode;
  }
  if (entryTitle) {
    entryTitle.textContent = `${classroomGradeLabel(home)} ${className}`.trim();
  }
  if (entrySummary) {
    entrySummary.textContent = `班级口号：${slogan || "待设置"}`;
  }
  if (entryTeacher) {
    entryTeacher.textContent = `班主任：${teacherName}`;
  }
  syncClassHonorBadgeViews();
}

function classroomGradeLabel(home) {
  return home?.gradeName ? `${home.gradeName}` : "";
}

function applyTerminalClassInfoToHome(classInfo) {
  if (!classInfo) return;
  runtimeState.home = {
    ...(runtimeState.home || {}),
    gradeName: classInfo.gradeName || runtimeState.home?.gradeName || "",
    className: classInfo.className || runtimeState.home?.className || "",
    slogan: classInfo.slogan || runtimeState.home?.slogan || "",
    homeroomTeacher: {
      ...(runtimeState.home?.homeroomTeacher || {}),
      name:
        classInfo.homeroomTeacherName ||
        runtimeState.home?.homeroomTeacher?.name ||
        "",
    },
  };
  if (Array.isArray(classInfo.classHonors)) {
    runtimeState.classHonors = [];
    mergeClassHonors(classInfo.classHonors);
  }
  syncClassroomMeta();
}

function syncLoginTerminalInfoFromTerminalState(terminalState) {
  const loginTitle = document.getElementById("loginPageTitle");
  const loginSummary = document.getElementById("loginClassSummary");
  const loginTerminalMeta = document.getElementById("loginTerminalMeta");
  const entryTerminal = document.getElementById("entryTerminalName");
  const entryTitle = document.getElementById("entryClassTitle");
  const entrySummary = document.getElementById("entryClassSummary");
  const entryTeacher = document.getElementById("entryTeacherName");
  if (!terminalState) return;
  if (loginTitle && terminalState.classInfo) {
    loginTitle.textContent =
      `${terminalState.classInfo.gradeName || ""} ${terminalState.classInfo.className || ""}`.trim();
  }
  if (loginSummary) {
    const parts = [];
    if (terminalState.classInfo?.homeroomTeacherName) {
      parts.push(`班主任：${terminalState.classInfo.homeroomTeacherName}`);
    }
    if (terminalState.classInfo?.slogan) {
      parts.push(`班级口号：${terminalState.classInfo.slogan}`);
    }
    loginSummary.textContent =
      parts.length > 0 ? parts.join(" ｜ ") : "请教师登录进入操作模式";
  }
  if (loginTerminalMeta) {
    loginTerminalMeta.textContent = `终端名称：${runtimeState.terminalName || terminalState.terminalName || runtimeState.terminalCode}`;
  }
  if (entryTerminal) {
    entryTerminal.textContent =
      runtimeState.terminalName ||
      terminalState.terminalName ||
      runtimeState.terminalCode;
  }
  if (entryTitle && terminalState.classInfo) {
    entryTitle.textContent =
      `${terminalState.classInfo.gradeName || ""} ${terminalState.classInfo.className || ""}`.trim();
  }
  if (entrySummary) {
    entrySummary.textContent = `班级口号：${terminalState.classInfo?.slogan || "待设置"}`;
  }
  if (entryTeacher) {
    entryTeacher.textContent = `班主任：${terminalState.classInfo?.homeroomTeacherName || "待设置"}`;
  }
  if (Array.isArray(terminalState.classInfo?.classHonors)) {
    mergeClassHonors(terminalState.classInfo.classHonors);
  }
  syncClassHonorBadgeViews();
}

function syncTodayStar() {
  const ranked = getRankedStudentsByScore();
  const topStudent = ranked[0];
  if (!topStudent) return;
  const image = document.getElementById("todayStarImage");
  const name = document.getElementById("todayStarName");
  const label = document.getElementById("todayStarLabel");
  const card = document.getElementById("todayStarCard");
  if (image) {
    image.src = petImg(topStudent);
    image.alt = topStudent.petName || topStudent.name;
  }
  if (name) name.textContent = topStudent.name;
  if (label) {
    const petText =
      topStudent.hasPet === false
        ? "待孕育星种"
        : `${topStudent.petName || "萌宠"} · Lv.${topStudent.lv}`;
    label.innerHTML =
      `<i class="fa-solid fa-star" aria-hidden="true"></i> 今日领先 · ${escapeHtml(petText)} ` +
      `<i class="fa-solid fa-star" aria-hidden="true"></i>`;
  }
}

function openTodayStarProfile() {
  const ranked = getRankedStudentsByScore();
  const topStudent = ranked[0];
  if (!topStudent) return;
  openPetProfileByName(topStudent.name);
}

function handleTodayStarKeydown(event) {
  if (!event) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openTodayStarProfile();
  }
}

function resolveMarqueeRuleLabel(item) {
  if (item?.ruleName) return item.ruleName;
  const rule = runtimeState.scoreRules.find((row) => row.id === item?.ruleId);
  if (rule?.name) return rule.name;
  if (item?.remark) return item.remark;
  return "积分调整";
}

function formatHonorGrantedTime(value) {
  if (!value) return "";
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return "";
  return `${String(time.getMonth() + 1).padStart(2, "0")}-${String(time.getDate()).padStart(2, "0")} ${String(
    time.getHours(),
  ).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
}

function normalizeHonorRecord(item) {
  if (!item) return null;
  return {
    id: item.id ?? item.recordId ?? null,
    honorId: item.honorId ?? null,
    honorName: item.honorName || "荣誉勋章",
    honorIconUrl: item.honorIconUrl ?? null,
    targetType: item.targetType || "student",
    studentId: item.studentId ?? null,
    studentName: item.studentName ?? null,
    grantedAt: item.grantedAt || null,
    remark: item.remark ?? null,
    grantedByName: item.grantedByName ?? item.operatorName ?? null,
  };
}

function buildHonorMarqueeLine(item) {
  const honorName = escapeHtml(item.honorName || "荣誉勋章");
  if (item.targetType === "class") {
    return `<span class="marquee-honor-line">🏆 全班 获得荣誉「${honorName}」</span>`;
  }
  const studentName = escapeHtml(
    item.studentName ||
      students.find((row) => row.id === item.studentId)?.name ||
      "同学",
  );
  return `<span class="marquee-honor-line">🎖 ${studentName} 获得荣誉「${honorName}」</span>`;
}

function mergeRecentHonors(records = []) {
  const normalized = records.map(normalizeHonorRecord).filter(Boolean);
  const seen = new Set();
  const merged = [];
  [...normalized, ...(runtimeState.recentHonors || [])].forEach((item) => {
    const key = `${item.id || ""}:${item.honorId || ""}:${item.studentId || ""}:${item.grantedAt || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });
  runtimeState.recentHonors = merged.slice(0, 12);
  return runtimeState.recentHonors;
}

const CLASS_HONOR_BADGE_LIMIT = 6;

function mergeClassHonors(records = []) {
  const normalized = records
    .map(normalizeHonorRecord)
    .filter((item) => item && item.targetType === "class");
  const seen = new Set();
  const merged = [];
  [...normalized, ...(runtimeState.classHonors || [])].forEach((item) => {
    const key = item.honorId ?? item.id;
    if (key == null || seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });
  merged.sort(
    (a, b) =>
      new Date(b.grantedAt || 0).getTime() -
      new Date(a.grantedAt || 0).getTime(),
  );
  runtimeState.classHonors = merged;
  return runtimeState.classHonors;
}

function renderClassHonorBadgeHtml(item) {
  const title = escapeHtml(item.honorName || "集体荣誉");
  const iconUrl = item.honorIconUrl ? resolveAssetUrl(item.honorIconUrl) : "";
  if (iconUrl) {
    return `<span class="class-honor-badge" title="${title}"><img src="${escapeHtml(iconUrl)}" alt="${title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><i class="fa-solid fa-people-group class-honor-badge-fallback" aria-hidden="true"></i></span>`;
  }
  return `<span class="class-honor-badge class-honor-badge--fallback" title="${title}"><i class="fa-solid fa-people-group" aria-hidden="true"></i></span>`;
}

function renderClassHonorBadgesHtml(
  honors = runtimeState.classHonors,
  options = {},
) {
  const limit = options.limit ?? CLASS_HONOR_BADGE_LIMIT;
  const rows = Array.isArray(honors) ? honors : [];
  if (!rows.length) return "";
  const visible = rows.slice(0, limit);
  const badges = visible.map(renderClassHonorBadgeHtml).join("");
  if (rows.length <= limit) return badges;
  return `${badges}<span class="class-honor-badge class-honor-badge--more" title="更多集体荣誉">+${rows.length - limit}</span>`;
}

function syncClassHonorBadgeViews() {
  const html = renderClassHonorBadgesHtml(runtimeState.classHonors);
  [
    "classroomClassHonors",
    "entryClassHonors",
    "loginClassHonors",
    "transClassHonors",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html;
    el.hidden = !html;
  });
}

async function refreshClassHonors() {
  if (!runtimeState.classId) return [];
  const rows = await apiFetch(
    `/display/classes/${runtimeState.classId}/honor-records?targetType=class`,
  ).catch(() => []);
  mergeClassHonors(rows || []);
  syncClassHonorBadgeViews();
  return runtimeState.classHonors;
}

function renderHonorBadgeIcon(item, options = {}) {
  const isClass = options.isClass ?? item.targetType === "class";
  const iconUrl = item.honorIconUrl ? resolveAssetUrl(item.honorIconUrl) : "";
  const fallbackClass = isClass ? "fa-people-group" : "fa-medal";
  if (!iconUrl) {
    return `<div class="honor-feed-icon" aria-hidden="true"><i class="fa-solid ${fallbackClass}"></i></div>`;
  }
  return `
    <div class="honor-feed-icon honor-feed-icon--image" aria-hidden="true">
      <img
        class="honor-feed-badge"
        src="${escapeHtml(iconUrl)}"
        alt="${escapeHtml(item.honorName || "荣誉")}"
        loading="lazy"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
      />
      <i class="fa-solid ${fallbackClass} honor-feed-badge-fallback"></i>
    </div>`;
}

function renderHonorFeed(honors = runtimeState.recentHonors) {
  const list = document.getElementById("honorFeedList");
  if (!list) return;
  const rows = Array.isArray(honors) ? honors.slice(0, 6) : [];
  if (!rows.length) {
    list.innerHTML =
      '<div class="honor-feed-empty">暂无荣誉记录，教师颁发后将在此展示</div>';
    return;
  }
  list.innerHTML = rows
    .map((item) => {
      const isClass = item.targetType === "class";
      const title = isClass
        ? `全班 · ${escapeHtml(item.honorName || "荣誉")}`
        : `${escapeHtml(item.studentName || "同学")} · ${escapeHtml(item.honorName || "荣誉")}`;
      const meta = [
        formatHonorGrantedTime(item.grantedAt),
        item.grantedByName ? `颁发：${escapeHtml(item.grantedByName)}` : "",
        item.remark ? escapeHtml(item.remark) : "",
      ]
        .filter(Boolean)
        .join(" · ");
      return `
      <div class="honor-feed-item">
        ${renderHonorBadgeIcon(item, { isClass })}
        <div class="honor-feed-main">
          <div class="honor-feed-title">${title}</div>
          <div class="honor-feed-meta">${meta || "刚刚颁发"}</div>
        </div>
      </div>`;
    })
    .join("");
}

function pulseHonorMarquee() {
  const track = document.querySelector(".marquee-track");
  if (!track) return;
  track.classList.add("honor-highlight");
  if (runtimeState.honorMarqueeHighlightTimer) {
    clearTimeout(runtimeState.honorMarqueeHighlightTimer);
  }
  runtimeState.honorMarqueeHighlightTimer = setTimeout(() => {
    track.classList.remove("honor-highlight");
    runtimeState.honorMarqueeHighlightTimer = null;
  }, 2600);
}

function syncMarquee(
  scoreRecords = [],
  honorRecords = runtimeState.recentHonors,
) {
  const fallback = "最近动态：课堂表现、作业表现、班级荣誉会在这里实时滚动展示";
  const scoreLines = (scoreRecords || [])
    .filter((item) => item?.studentId != null)
    .slice(0, 4)
    .map((item) => {
      const student = students.find((student) => student.id === item.studentId);
      const score = Number(item.scoreDelta || 0);
      const delta = score > 0 ? `+${score}` : `${score}`;
      return `${student?.name || "学生"} ${resolveMarqueeRuleLabel(item)} ${delta}分`;
    });
  const honorLines = (honorRecords || [])
    .slice(0, 4)
    .map(buildHonorMarqueeLine);
  const segments = [...honorLines, ...scoreLines];
  const text =
    segments.length > 0
      ? `最近动态：${segments.join(" &nbsp;│&nbsp; ")}`
      : fallback;
  const primary = document.getElementById("marqueeTextPrimary");
  const secondary = document.getElementById("marqueeTextSecondary");
  if (primary) primary.innerHTML = text;
  if (secondary) secondary.innerHTML = text;
}

async function refreshHonorFeed() {
  if (!runtimeState.classId) return [];
  const rows = await apiFetch(
    `/display/classes/${runtimeState.classId}/honor-records`,
  ).catch(() => []);
  mergeRecentHonors(rows || []);
  renderHonorFeed();
  return runtimeState.recentHonors;
}

async function refreshMarquee() {
  if (!runtimeState.classId) return;
  const [recentRecords, honorRecords] = await Promise.all([
    apiFetch(`/score-records?classId=${runtimeState.classId}`).catch(() => []),
    refreshHonorFeed().catch(() => runtimeState.recentHonors || []),
  ]);
  syncMarquee(recentRecords || [], honorRecords || []);
}

function handleClassHonorGranted(payload) {
  const honor = normalizeHonorRecord(payload);
  if (!honor) return;
  mergeRecentHonors([honor]);
  renderHonorFeed();
  syncMarquee([], runtimeState.recentHonors);
  pulseHonorMarquee();

  if (honor.targetType === "class") {
    mergeClassHonors([honor]);
    syncClassHonorBadgeViews();
  }

  if (honor.targetType === "student" && honor.studentId) {
    const student = students.find((row) => row.id === honor.studentId);
    if (student) {
      student.medals = Number(student.medals || 0) + 1;
      if (!isScoreVisualsPending()) {
        renderStudentGrid({ force: true });
      }
    }
  }

  showDisplayToast(
    honor.targetType === "class"
      ? `全班获得荣誉「${honor.honorName}」`
      : `${honor.studentName || "同学"}获得荣誉「${honor.honorName}」`,
    { duration: 3200 },
  );
}

function scheduleMarqueeRefresh() {
  if (!runtimeState.classId) return;
  if (runtimeState.marqueeRefreshTimer) {
    clearTimeout(runtimeState.marqueeRefreshTimer);
  }
  runtimeState.marqueeRefreshTimer = setTimeout(() => {
    runtimeState.marqueeRefreshTimer = null;
    refreshMarquee().catch(() => {});
  }, 400);
}

function hasTodayRankGroups() {
  return getGroupScoreRankingRows().length > 0;
}

function syncTodayRankTabs(activeTab, hasGroups) {
  const tabs = document.getElementById("todayRankTabs");
  const groupTab = document.getElementById("todayRankGroupTab");
  const studentTab = document.getElementById("todayRankStudentTab");
  if (!tabs || !groupTab || !studentTab) return;

  tabs.hidden = !hasGroups;
  groupTab.classList.toggle("active", activeTab === "group");
  studentTab.classList.toggle("active", activeTab === "student");
  groupTab.setAttribute("aria-selected", activeTab === "group" ? "true" : "false");
  studentTab.setAttribute(
    "aria-selected",
    activeTab === "student" ? "true" : "false",
  );
}

function setTodayRankTab(tab) {
  if (tab === "group" && !hasTodayRankGroups()) {
    runtimeState.todayRankTab = "student";
  } else if (tab === "student" || tab === "group") {
    runtimeState.todayRankTab = tab;
    runtimeState.todayRankTabUserSelected = true;
  }
  renderTodayRank();
}

function renderStudentTodayRank() {
  return getRankedStudentsByScore()
    .slice(0, 3)
    .map((s, i) => {
      const cls = i === 0 ? "r1" : i === 1 ? "r2" : i === 2 ? "r3" : "rn";
      const sub =
        s.hasPet === false
          ? "待孕育星种"
          : `${resolvePetDisplayName(s)} · Lv.${s.lv}`;
      const safeName = s.name.replace(/'/g, "\\'");
      return `
      <button type="button" class="rank-item" onclick="openPetProfileByName('${safeName}')">
        <span class="rank-num ${cls}">${i + 1}</span>
        <img class="rank-pet-sm" src="${petImg(s)}" alt="${escapeHtml(sub)}" onerror="this.src='images/logo.svg'">
        <div class="rank-info">
          <div class="rank-name">${escapeHtml(s.name)}</div>
          <div class="rank-pts">${escapeHtml(sub)}</div>
        </div>
        <span class="rank-score">${s.pts}</span>
      </button>`;
    })
    .join("");
}

function renderGroupTodayRank() {
  const rows = getGroupScoreRankingRows();
  if (rows.length === 0) {
    return '<div class="rank-empty">当前班级还没有小组，已自动切换为学生排行。</div>';
  }
  return rows
    .map((row, index) => {
      const cls = index === 0 ? "r1" : index === 1 ? "r2" : index === 2 ? "r3" : "rn";
      const sourceGroup = runtimeState.groups.find(
        (item) => Number(item.groupNo) === Number(row.groupNo),
      );
      const memberCount = Array.isArray(sourceGroup?.students)
        ? sourceGroup.students.length
        : 0;
      return `
      <button
        type="button"
        class="rank-item"
        onclick="openGroupScoreAdjustModal(${row.id ? Number(row.id) : "null"})"
      >
        <span class="rank-num ${cls}">${index + 1}</span>
        <span class="rank-group-badge">G${row.groupNo}</span>
        <div class="rank-info">
          <div class="rank-name">${escapeHtml(row.name)}</div>
          <div class="rank-pts">${memberCount > 0 ? `${memberCount} 位成员` : "暂无成员"}</div>
        </div>
        <span class="rank-score">${row.groupScore > 0 ? "+" : ""}${row.groupScore}</span>
      </button>`;
    })
    .join("");
}

function renderTodayRank() {
  const wrap = document.getElementById("todayRank");
  if (!wrap) return;
  const hasGroups = hasTodayRankGroups();
  if (!hasGroups) {
    runtimeState.todayRankTab = "student";
    runtimeState.todayRankTabUserSelected = false;
  } else if (!runtimeState.todayRankTabUserSelected) {
    runtimeState.todayRankTab = "group";
  }
  const activeTab = hasGroups
    ? runtimeState.todayRankTab || "group"
    : "student";
  syncTodayRankTabs(activeTab, hasGroups);
  wrap.innerHTML =
    activeTab === "group" ? renderGroupTodayRank() : renderStudentTodayRank();
}

function padCountdownPart(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function formatClassCountdownDeadline(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function clearClassCountdownTimer() {
  if (runtimeState.classCountdownTimer) {
    window.clearInterval(runtimeState.classCountdownTimer);
    runtimeState.classCountdownTimer = null;
  }
}

function renderClassCountdown() {
  const card = document.getElementById("classCountdownCard");
  if (!card) return;
  clearClassCountdownTimer();

  const countdown = runtimeState.home?.countdown;
  const deadlineAt = countdown?.deadlineAt
    ? new Date(countdown.deadlineAt)
    : null;
  if (!countdown?.title || !deadlineAt || Number.isNaN(deadlineAt.getTime())) {
    card.hidden = true;
    card.classList.remove("is-ended");
    return;
  }

  const title = document.getElementById("classCountdownTitle");
  const deadline = document.getElementById("classCountdownDeadline");
  if (title) title.textContent = countdown.title;
  if (deadline)
    deadline.textContent = `截止时间 ${formatClassCountdownDeadline(deadlineAt)}`;
  card.hidden = false;
  card.classList.remove("is-ended");

  const ended = document.getElementById("classCountdownEnded");
  if (ended) ended.setAttribute("aria-hidden", "true");

  const tick = () => {
    const remaining = deadlineAt.getTime() - Date.now();
    if (remaining <= 0) {
      card.classList.add("is-ended");
      if (ended) ended.setAttribute("aria-hidden", "false");
      clearClassCountdownTimer();
      return;
    }

    card.classList.remove("is-ended");
    if (ended) ended.setAttribute("aria-hidden", "true");
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const daysEl = document.getElementById("classCountdownDays");
    const hoursEl = document.getElementById("classCountdownHours");
    const minutesEl = document.getElementById("classCountdownMinutes");
    const secondsEl = document.getElementById("classCountdownSeconds");
    if (daysEl) daysEl.textContent = padCountdownPart(days);
    if (hoursEl) hoursEl.textContent = padCountdownPart(hours);
    if (minutesEl) minutesEl.textContent = padCountdownPart(minutes);
    if (secondsEl) secondsEl.textContent = padCountdownPart(seconds);
  };

  tick();
  runtimeState.classCountdownTimer = window.setInterval(tick, 1000);
}

function resolveLeaderboardMetric(row) {
  if (runtimeState.leaderboardType === "pet-level") {
    return { value: row.currentPetLevel || 1, unit: "级" };
  }
  if (runtimeState.leaderboardType === "honor") {
    return {
      value:
        row.honorsCount ??
        students.find((item) => item.id === row.id)?.medals ??
        0,
      unit: "枚",
    };
  }
  return { value: row.currentScore || 0, unit: "分" };
}

function renderLeaderboardTop3() {
  const slots = document.querySelectorAll(".podium-slot");
  const podiumOrder = [1, 0, 2];
  slots.forEach((slot, slotIndex) => {
    const row = runtimeState.leaderboardRows[podiumOrder[slotIndex]];
    if (!row) return;
    const localStudent = students.find((item) => item.id === row.id);
    const displayImage = leaderboardPetImg(row, localStudent);
    const image = slot.querySelector(".podium-avatar");
    const name = slot.querySelector(".podium-name");
    const petName = slot.querySelector(".podium-pet-name");
    const lv = slot.querySelector(".podium-stat-lv");
    const xp = slot.querySelector(".podium-stat-xp");
    const rankRing = slot.querySelector(".podium-rank-ring");
    const metric = resolveLeaderboardMetric(row);
    if (image) {
      image.src = displayImage;
      image.alt = row.petName || row.name;
      image.onerror = function onImgError() {
        this.src = "images/logo.svg";
      };
    }
    if (name) name.textContent = row.name;
    if (petName) petName.textContent = row.petName || "待孕育星种";
    if (lv) lv.textContent = `Lv.${row.currentPetLevel || 1}`;
    if (xp) {
      xp.textContent = `${metric.value} ${metric.unit}`;
    }
    if (rankRing) rankRing.textContent = String(row.rank);
  });
}

function renderLeaderboardList() {
  const wrap = document.getElementById("lbList");
  if (!wrap) return;
  wrap.innerHTML = runtimeState.leaderboardRows
    .slice(3, 10)
    .map((s) => {
      const localStudent = students.find((item) => item.id === s.id);
      const displayImage = leaderboardPetImg(s, localStudent);
      const metric = resolveLeaderboardMetric(s);
      return `
    <div class="lb-row">
      <span class="lb-row-num">${s.rank}</span>
      <img class="lb-row-pet" src="${displayImage}" alt="${escapeHtml(s.petNickname || s.petName || s.name)}" onerror="this.src='images/logo.svg'">
      <div class="lb-row-info">
        <div class="lb-row-name">${escapeHtml(s.name)}</div>
        <div class="lb-row-petname">${escapeHtml(s.petNickname || s.petName || "待孕育星种")}</div>
      </div>
      <div class="lb-row-right">
        <span class="lb-row-lv">Lv.${s.currentPetLevel || 1}</span>
        <span class="lb-row-xp">${metric.value} ${metric.unit}</span>
      </div>
    </div>`;
    })
    .join("");
  renderLeaderboardTop3();
}

function academicNumber(value, digits = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return digits > 0 ? numeric.toFixed(digits) : String(Math.round(numeric));
}

/**
 * 未来感增强：数字跳动动画
 * 在非低性能设备上，关键数字从0/旧值跳动到目标值。
 * 对于无法解析为纯数字的文本（如 "较上次 +3.2"），直接赋值。
 */
function animateAcademicNumber(el, targetValue, duration) {
  if (!el) return;
  /* 流畅模式直接赋值，避免数字跳动动画 */
  if (isLowSpecMode()) {
    el.textContent = targetValue;
    return;
  }
  /* 如果文本不是纯数字（如 "较上次 +3.2" 或 "28人"），直接赋值 */
  const stripped = String(targetValue).replace(/[,，]/g, "");
  const numTarget = parseFloat(stripped);
  if (!Number.isFinite(numTarget) || stripped !== String(numTarget)) {
    el.textContent = targetValue;
    return;
  }
  /* 如果已有取消句柄，先清除 */
  if (el._academicCountRAF) {
    cancelAnimationFrame(el._academicCountRAF);
    el._academicCountRAF = null;
  }
  const start = performance.now();
  const isInt = Number.isInteger(numTarget);
  const dur = duration || 800;
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / dur, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = numTarget * eased;
    el.textContent = isInt ? Math.round(current) : current.toFixed(1);
    if (progress < 1) {
      el._academicCountRAF = requestAnimationFrame(tick);
    } else {
      el._academicCountRAF = null;
      el.textContent = targetValue;
    }
  }
  el._academicCountRAF = requestAnimationFrame(tick);
}

/**
 * 未来感增强：粒子星网 Canvas
 * 在学业成长页背景绘制缓慢移动的粒子点阵 + 连线网络（类 particles.js），
 * 模拟神经网络/星座图效果。仅在高性能设备上运行。
 */
let _academicParticlesRAF = null;
function initAcademicParticles() {
  cleanupAcademicParticles();
  const canvas = document.getElementById("academicParticles");
  if (!canvas || isLowSpecMode()) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w, h;
  function resize() {
    const rect = canvas.parentElement?.getBoundingClientRect();
    w = canvas.width = rect?.width || canvas.offsetWidth || 1920;
    h = canvas.height = rect?.height || canvas.offsetHeight || 1080;
  }
  resize();

  const budget = getDisplayEffectBudget();
  const PARTICLE_COUNT = budget.academicParticles || 55;
  const CONNECTION_DIST = budget.academicConnectionDist || 140;
  const particles = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.8,
      /* 70%青色、20%金色、10%橙红 */
      hue: Math.random() < 0.7 ? 175 : Math.random() < 0.85 ? 42 : 15,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    /* 更新粒子位置 */
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }

    /* 绘制连线 */
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.22;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(44, 238, 226, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    /* 绘制粒子 */
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, 0.7)`;
      ctx.fill();
      /* 发光光晕 */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, 0.08)`;
      ctx.fill();
    }

    _academicParticlesRAF = requestAnimationFrame(draw);
  }

  _academicParticlesRAF = requestAnimationFrame(draw);

  /* 窗口 resize 时更新 canvas 尺寸 */
  canvas._resizeHandler = () => resize();
  window.addEventListener("resize", canvas._resizeHandler);
}

function cleanupAcademicParticles() {
  if (_academicParticlesRAF) {
    cancelAnimationFrame(_academicParticlesRAF);
    _academicParticlesRAF = null;
  }
  const canvas = document.getElementById("academicParticles");
  if (canvas?._resizeHandler) {
    window.removeEventListener("resize", canvas._resizeHandler);
    canvas._resizeHandler = null;
  }
}

/**
 * 未来感增强：黑客帝国数字雨 (Matrix Rain)
 * 在过场动画中用数字/符号瀑布流覆盖全屏，2.5秒后淡出，
 * 自然过渡到数据面板——像是数据正在"解码加载"。
 * 复用 _academicParticlesRAF 和 cleanupAcademicParticles 进行生命周期管理。
 */
function initAcademicMatrixRain() {
  cleanupAcademicParticles();
  const canvas = document.getElementById("academicParticles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.parentElement?.getBoundingClientRect();
  const w = (canvas.width = rect?.width || 1920);
  const h = (canvas.height = rect?.height || 1080);

  /* 性能分级：低内存设备用更大字体（更少列数） */
  const fontSize = isStandardDisplay() ? 20 : 15;
  const columns = Math.floor(w / fontSize);

  /* 字符池：数字 + 十六进制 + 数学符号 + 希腊字母 + 百分号 */
  const chars = "0123456789ABCDEFabcdef+-=∑∫√∞%ΔσμπλΩ<>{}[]#";

  /* 每列的下落位置和速度 */
  const drops = [];
  const speeds = [];
  for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * -40; /* 初始在屏幕上方随机高度 */
    speeds[i] = 0.32 + Math.random() * 0.45;
  }

  function draw() {
    /* 半透明深色遮罩 → 经典拖尾效果 */
    ctx.fillStyle = "rgba(7, 21, 34, 0.065)";
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < columns; i++) {
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      if (y > -fontSize && y < h + fontSize) {
        const char = chars[Math.floor(Math.random() * chars.length)];

        /* 8% 概率出现金色字符，增加视觉层次 */
        const isGold = Math.random() > 0.92;
        if (isGold) {
          ctx.fillStyle = "rgba(240, 180, 41, 0.85)";
          ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        } else {
          /* 首字符（最前端）更亮 */
          ctx.fillStyle = `rgba(44, 238, 226, ${0.78 + Math.random() * 0.22})`;
          ctx.font = `${fontSize}px "Courier New", monospace`;
        }
        ctx.fillText(char, x, y);

        /* 首字符发光效果 */
        ctx.shadowColor = isGold
          ? "rgba(240, 180, 41, 0.6)"
          : "rgba(44, 238, 226, 0.5)";
        ctx.shadowBlur = 8;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;
      }

      /* 越过底部后重置到顶部 */
      if (drops[i] * fontSize > h + 40) {
        drops[i] = Math.random() * -18;
        speeds[i] = 0.32 + Math.random() * 0.45;
      }

      drops[i] += speeds[i];
    }

    _academicParticlesRAF = requestAnimationFrame(draw);
  }

  _academicParticlesRAF = requestAnimationFrame(draw);
}

/**
 * 未来感增强：过场动画编排
 * 进入学业成长页时的完整过场流程：
 * 1. 隐藏数据面板
 * 2. 启动粒子星网Canvas + 全屏展示标题
 * 3. 2.5秒后淡出过场
 * 4. 数据面板阶梯入场
 */
let _academicSplashTimer1 = null;
let _academicSplashTimer2 = null;

function startAcademicSplash(pageEl) {
  /* 清理可能残留的上一次过场 */
  cleanupAcademicSplash();

  const canvas = document.getElementById("academicParticles");
  const splash = document.getElementById("academicSplash");
  const panels = pageEl.querySelectorAll(".academic-panel");

  /* 1. 先隐藏面板（透明度0，不影响布局） */
  panels.forEach((p) => {
    p.style.opacity = "0";
    p.classList.remove("academic-panel-enter");
  });

  /* 2. 启动数字雨效果（黑客帝国风格） */
  initAcademicMatrixRain();

  /* 3. 激活过场模式 — Canvas全屏 + 标题覆盖 */
  if (canvas) {
    canvas.classList.remove("splash-fade");
    canvas.classList.add("splash-active");
  }
  if (splash) {
    splash.classList.remove("fade");
    /* 重置子元素动画 */
    splash.querySelectorAll("[class^='academic-splash-']").forEach((el) => {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
    });
    splash.classList.add("active");
  }

  /* 4. 2.5秒后开始淡出过场 */
  _academicSplashTimer1 = setTimeout(() => {
    if (canvas) {
      canvas.classList.remove("splash-active");
      canvas.classList.add("splash-fade");
    }
    if (splash) {
      splash.classList.remove("active");
      splash.classList.add("fade");
    }

    /* 5. 淡出过渡结束后，面板阶梯入场 */
    _academicSplashTimer2 = setTimeout(() => {
      panels.forEach((p, i) => {
        p.style.opacity = "";
        p.style.animationDelay = `${i * 0.12}s`;
        p.classList.add("academic-panel-enter");
      });

      /* 粒子Canvas完全结束后停止RAF（节省性能） */
      setTimeout(() => cleanupAcademicParticles(), 1500);

      _academicSplashTimer1 = null;
      _academicSplashTimer2 = null;
    }, 500);
  }, 2500);
}

function cleanupAcademicSplash() {
  if (_academicSplashTimer1) {
    clearTimeout(_academicSplashTimer1);
    _academicSplashTimer1 = null;
  }
  if (_academicSplashTimer2) {
    clearTimeout(_academicSplashTimer2);
    _academicSplashTimer2 = null;
  }
  const canvas = document.getElementById("academicParticles");
  const splash = document.getElementById("academicSplash");
  if (canvas) {
    canvas.classList.remove("splash-active", "splash-fade");
  }
  if (splash) {
    splash.classList.remove("active", "fade");
  }
  /* 恢复面板可见性 */
  document.querySelectorAll(".academic-panel").forEach((p) => {
    p.style.opacity = "";
  });
}

function academicDeltaText(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric === 0) return "0";
  return numeric > 0
    ? `+${Math.round(numeric * 10) / 10}`
    : `${Math.round(numeric * 10) / 10}`;
}

function academicRankDeltaValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function academicRankDeltaText(value) {
  const numeric = academicRankDeltaValue(value);
  if (numeric === null) return "-";
  if (numeric === 0) return "0";
  return numeric > 0
    ? `+${Math.round(numeric * 10) / 10}`
    : `${Math.round(numeric * 10) / 10}`;
}

function academicStudentKey(value) {
  return String(value ?? "");
}

/** 统一取事件相关 DOM 元素（点击姓名等时 target 可能为文本节点） */
function academicEventTargetElement(event) {
  const t = event.target;
  if (t instanceof Element) return t;
  if (t && t.nodeType === Node.TEXT_NODE && t.parentElement) {
    return t.parentElement;
  }
  return null;
}

/**
 * 取指针下实际命中的元素。成绩矩阵在 pointerdown 时对容器 setPointerCapture 后，
 * pointerup/click 的 event.target 常为外层 div，用坐标命中才能判断是否在「姓名」格。
 */
function academicPointerHitElement(event) {
  if (Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
    const under = document.elementFromPoint(event.clientX, event.clientY);
    if (under instanceof Element) return under;
  }
  return academicEventTargetElement(event);
}

function getSelectedAcademicStudent(data = getAcademicGrowthData()) {
  const rows = data.studentRows || [];
  if (!rows.length) return null;
  const selectedKey = academicStudentKey(
    runtimeState.selectedAcademicStudentId,
  );
  return (
    rows.find((row) => academicStudentKey(row.studentId) === selectedKey) ||
    rows[0]
  );
}

function selectAcademicStudent(studentId) {
  runtimeState.selectedAcademicStudentId = studentId;
  renderAcademicStudentDetail(getAcademicGrowthData());
  document.querySelectorAll(".academic-table tbody tr").forEach((row) => {
    row.classList.toggle(
      "selected",
      row.dataset.studentId === academicStudentKey(studentId),
    );
  });
}

function handleAcademicStudentPick(studentId, options = {}) {
  if (!studentId) return;
  selectAcademicStudent(studentId);
  if (options.openAi === false) return;
  const now = Date.now();
  const key = academicStudentKey(studentId);
  if (
    runtimeState.lastAcademicAiOpenKey === key &&
    now - runtimeState.lastAcademicAiOpenAt < 450
  ) {
    return;
  }
  runtimeState.lastAcademicAiOpenKey = key;
  runtimeState.lastAcademicAiOpenAt = now;
  openAcademicAiModal(studentId);
}

/** 成绩矩阵：仅点在「姓名」格打开 AI；其它单元格只切换选中。信号名单保持点按打开 AI。 */
function handleAcademicListPickFromEvent(studentId, event, listId) {
  if (!studentId) return;
  if (listId === "academicScoreTable") {
    const hit = academicPointerHitElement(event);
    const row = hit?.closest("tr[data-student-id]");
    const resolvedId = row?.getAttribute("data-student-id") || studentId;
    if (!resolvedId) return;
    const nameTd = row?.querySelector("td.name");
    if (nameTd && hit && nameTd.contains(hit)) {
      handleAcademicStudentPick(resolvedId);
    } else {
      handleAcademicStudentPick(resolvedId, { openAi: false });
    }
    return;
  }
  handleAcademicStudentPick(studentId);
}

function getAcademicGrowthData() {
  return (
    runtimeState.academicGrowth || {
      classId: runtimeState.classId || 0,
      gradeName: runtimeState.home?.gradeName || "当前年级",
      className: runtimeState.home?.className || "当前班级",
      hasData: false,
      latestExam: null,
      previousExam: null,
      examOptions: [],
      metrics: {},
      subjects: [],
      subjectColumns: [],
      classSummaries: [],
      studentRows: [],
      trend: [],
      progressLeaders: [],
      riskStudents: [],
      insight: "暂无当前班级学业成长数据。请在后台导入该班级成绩后查看。",
    }
  );
}

async function fetchAcademicGrowthData(options = {}) {
  if (!runtimeState.classId) return null;
  const examId = options.examId ?? runtimeState.selectedAcademicExamId;
  const query = examId ? `?examId=${encodeURIComponent(examId)}` : "";
  const academicGrowth = await apiFetch(
    `/display/classes/${runtimeState.classId}/academic-growth${query}`,
  ).catch((error) => ({
    hasData: false,
    classId: runtimeState.classId,
    gradeName: runtimeState.home?.gradeName || "",
    className: runtimeState.home?.className || "",
    latestExam: null,
    previousExam: null,
    examOptions: [],
    metrics: {},
    subjects: [],
    subjectColumns: [],
    classSummaries: [],
    studentRows: [],
    trend: [],
    progressLeaders: [],
    riskStudents: [],
    insight: error?.message || "当前班级学业数据暂不可用。",
  }));
  runtimeState.academicGrowth = academicGrowth;
  runtimeState.selectedAcademicExamId = academicGrowth?.latestExam?.id || null;
  runtimeState.academicRenderKey = "";
  return academicGrowth;
}

async function handleAcademicExamChange(value) {
  const examId = Number(value);
  runtimeState.selectedAcademicExamId =
    Number.isInteger(examId) && examId > 0 ? examId : null;
  await fetchAcademicGrowthData({
    examId: runtimeState.selectedAcademicExamId,
  });
  renderAcademicGrowth();
}

function renderAcademicGrowth() {
  const page = document.getElementById("page-academic");
  if (!page) return;
  const data = getAcademicGrowthData();
  const limits = getAcademicRenderLimits();
  const renderKey = academicGrowthRenderSignature(data, limits);
  if (runtimeState.academicRenderKey === renderKey) {
    return;
  }
  const metrics = data.metrics || {};
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) {
      /* 未来感增强：对纯数字值应用跳动动画 */
      animateAcademicNumber(el, value);
    }
  };
  renderAcademicHeadline(data);
  const examSelect = document.getElementById("academicExamSelect");
  if (examSelect) {
    const options = Array.isArray(data.examOptions) ? data.examOptions : [];
    examSelect.innerHTML = options.length
      ? options
          .map(
            (item) =>
              `<option value="${escapeHtml(item.id)}"${item.id === data.latestExam?.id ? " selected" : ""}>${escapeHtml([item.periodLabel, item.name || "考试", item.examDate ? String(item.examDate).slice(0, 10) : ""].filter(Boolean).join(" · "))}</option>`,
          )
          .join("")
      : '<option value="">等待成绩导入</option>';
    examSelect.value = data.latestExam?.id ? String(data.latestExam.id) : "";
  }
  setText("academicGrowthIndex", academicNumber(metrics.academicIndex, 1));
  setText(
    "academicCoverage",
    `较上次 ${academicDeltaText(metrics.indexDelta)}`,
  );
  setText("academicAverage", academicNumber(metrics.averageScore, 1));
  setText(
    "academicParticipants",
    `${academicNumber(metrics.participantCount)}人`,
  );
  setText("academicProgress", academicNumber(metrics.progressCount));
  setText(
    "academicRisk",
    academicNumber(metrics.riskCount ?? metrics.declineCount),
  );
  setText(
    "academicGradeIndex",
    academicNumber(
      metrics.gradeBaselineIndex ?? metrics.currentClassAcademicIndex,
      1,
    ),
  );
  setText(
    "academicGradeAverage",
    academicNumber(metrics.gradeAverage ?? metrics.currentClassAverage, 1),
  );
  renderAcademicTrajectory(data, limits);
  renderAcademicScoreTable(data, limits);
  renderAcademicRadar(data.subjects || [], limits);
  renderAcademicClassList(data.classSummaries || [], limits);
  renderAcademicSignals(
    "academicProgressList",
    data.progressLeaders || [],
    "up",
    limits,
  );
  renderAcademicSignals(
    "academicRiskList",
    data.riskStudents || [],
    "down",
    limits,
  );
  if (
    !runtimeState.selectedAcademicStudentId ||
    !(data.studentRows || []).some(
      (row) =>
        academicStudentKey(row.studentId) ===
        academicStudentKey(runtimeState.selectedAcademicStudentId),
    )
  ) {
    runtimeState.selectedAcademicStudentId =
      data.studentRows?.[0]?.studentId ?? null;
  }
  renderAcademicStudentDetail(data);
  enableAcademicSelectionEvents();
  enableAcademicDragScroll();
  runtimeState.academicRenderKey = renderKey;
}

function renderAcademicHeadline(data) {
  const el = document.getElementById("academicHeadline");
  if (!el) return;
  const metrics = data.metrics || {};
  const text = [
    data.insight || "当前班级学业成长数据已同步",
    `班级学业指数 ${academicNumber(metrics.academicIndex, 1)}`,
    `进步 ${academicNumber(metrics.progressCount)} 人`,
    `预警 ${academicNumber(metrics.riskCount ?? metrics.declineCount)} 人`,
  ].join("　·　");
  el.innerHTML = `<span>${escapeHtml(text)}</span><span>${escapeHtml(text)}</span>`;
}

function renderAcademicTrajectory(data, limits = getAcademicRenderLimits()) {
  const wrap = document.getElementById("academicTrajectory");
  if (!wrap) return;
  const trend = data.trend || [];
  if (!trend.length) {
    wrap.innerHTML = '<div class="academic-empty">等待考试趋势与分层数据</div>';
    return;
  }
  const visibleTrend = trend.slice(-limits.trendPoints);
  const values = visibleTrend.map((item) => Number(item.relativeIndex || 0));
  const max = Math.max(1, ...values);
  const latest = visibleTrend[visibleTrend.length - 1] || null;
  const previous = visibleTrend[visibleTrend.length - 2] || null;
  const avgDelta =
    latest && previous
      ? Number(latest.relativeIndex || 0) - Number(previous.relativeIndex || 0)
      : 0;
  const rows = data.studentRows || [];
  const sortedRows = [...rows].sort(
    (left, right) =>
      Number(right.totalScore || 0) - Number(left.totalScore || 0),
  );
  const total = sortedRows.length || 1;
  const highEnd = Math.max(1, Math.ceil(total * 0.25));
  const stableEnd = Math.max(highEnd, Math.ceil(total * 0.6));
  const borderEnd = Math.max(stableEnd, Math.ceil(total * 0.85));
  const levels = [
    { key: "high", label: "高分层", rows: sortedRows.slice(0, highEnd) },
    {
      key: "stable",
      label: "稳定层",
      rows: sortedRows.slice(highEnd, stableEnd),
    },
    {
      key: "border",
      label: "临界层",
      rows: sortedRows.slice(stableEnd, borderEnd),
    },
    { key: "support", label: "帮扶层", rows: sortedRows.slice(borderEnd) },
  ];
  const migration = {
    up: rows.filter((row) => (academicRankDeltaValue(row.rankDelta) ?? 0) > 0)
      .length,
    flat: rows.filter(
      (row) => (academicRankDeltaValue(row.rankDelta) ?? 0) === 0,
    ).length,
    down: rows.filter((row) => (academicRankDeltaValue(row.rankDelta) ?? 0) < 0)
      .length,
  };
  const bars = visibleTrend
    .map((item) => {
      const height = Math.max(
        14,
        Math.round((Number(item.relativeIndex || 0) / max) * 86),
      );
      return `<div class="academic-trend-bar" style="--h:${height}px"><span>${academicNumber(item.relativeIndex, 1)}</span><em>${escapeHtml(item.examName || "考试")}</em></div>`;
    })
    .join("");
  const levelHtml = levels
    .map((item) => {
      const count = item.rows.length;
      const width = Math.max(4, Math.round((count / total) * 100));
      const positive = item.rows.filter(
        (row) => (academicRankDeltaValue(row.rankDelta) ?? 0) > 0,
      ).length;
      const negative = item.rows.filter(
        (row) => (academicRankDeltaValue(row.rankDelta) ?? 0) < 0,
      ).length;
      const delta = positive - negative;
      return `<div class="academic-layer-row ${item.key}">
        <span>${item.label}</span>
        <i><b style="--w:${width}%"></b></i>
        <strong>${count}人</strong>
        <em class="${delta >= 0 ? "up" : "down"}">${academicDeltaText(delta)}</em>
      </div>`;
    })
    .join("");
  wrap.innerHTML = `
    <div class="academic-trajectory-head">
      <div>
        <span>班级学业趋势</span>
        <strong>${latest ? academicNumber(latest.relativeIndex, 1) : "--"}</strong>
      </div>
      <b class="${avgDelta >= 0 ? "up" : "down"}">${academicDeltaText(avgDelta)}</b>
    </div>
    <div class="academic-trend">${bars}</div>
    <div class="academic-layer-list">${levelHtml}</div>
    <div class="academic-migration">
      <div><span>上升</span><strong>${migration.up}</strong></div>
      <div><span>持平</span><strong>${migration.flat}</strong></div>
      <div><span>下滑</span><strong>${migration.down}</strong></div>
    </div>
  `;
}

function renderAcademicScoreTable(data, limits = getAcademicRenderLimits()) {
  const wrap = document.getElementById("academicScoreTable");
  const meta = document.getElementById("academicMatrixMeta");
  if (!wrap) return;
  const columns = (data.subjectColumns || []).slice(0, limits.subjectCount);
  const sourceRows = data.studentRows || [];
  const rows = sourceRows;
  if (meta)
    meta.textContent = `${rows.length}/${sourceRows.length} ROWS · ${columns.length} SUBJECTS`;
  if (!rows.length) {
    wrap.innerHTML = '<div class="academic-empty">暂无学生成绩矩阵</div>';
    return;
  }
  const head = [
    '<th class="rank">名次</th>',
    '<th class="name-col">姓名</th>',
    '<th class="group-col">小组</th>',
    ...columns.map((item) => `<th>${escapeHtml(item.subjectName)}</th>`),
    "<th>总分</th>",
    "<th>变化</th>",
  ].join("");
  const body = rows
    .map((row) => {
      const rankDelta = academicRankDeltaValue(row.rankDelta);
      const deltaClass =
        rankDelta === null ? "" : rankDelta >= 0 ? "up" : "down";
      const selectedClass =
        academicStudentKey(row.studentId) ===
        academicStudentKey(runtimeState.selectedAcademicStudentId)
          ? " selected"
          : "";
      const cells = columns
        .map(
          (_, columnIndex) =>
            `<td>${row.subjectScores?.[columnIndex] ?? "--"}</td>`,
        )
        .join("");
      return `<tr class="academic-student-row${selectedClass}" data-student-id="${escapeHtml(row.studentId)}">
        <td class="rank">${row.classRank ?? "--"}</td>
        <td class="name">${escapeHtml(row.studentName)}</td>
        <td class="group-col">${escapeHtml(row.groupName || "-")}</td>
        ${cells}
        <td class="total">${academicNumber(row.totalScore, 1)}</td>
        <td class="${deltaClass}">${academicRankDeltaText(row.rankDelta)}</td>
      </tr>`;
    })
    .join("");
  wrap.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderAcademicRadar(subjects, limits = getAcademicRenderLimits()) {
  const radar = document.getElementById("academicRadar");
  const bars = document.getElementById("academicSubjectBars");
  if (!radar || !bars) return;
  const rows = subjects.slice(0, limits.subjectCount);
  if (!rows.length) {
    radar.innerHTML = "";
    bars.innerHTML = '<div class="academic-empty">等待科目数据</div>';
    return;
  }
  const maxScore = Math.max(
    1,
    ...rows.map((item) => Number(item.averageScore || 0)),
  );
  radar.innerHTML = rows
    .map((item, index) => {
      const angle = (Math.PI * 2 * index) / rows.length - Math.PI / 2;
      const radius = 30 + (Number(item.averageScore || 0) / maxScore) * 48;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      return `<i class="academic-radar-dot" style="--x:${x}%;--y:${y}%"><span>${escapeHtml(item.subjectName)}</span></i>`;
    })
    .join("");
  bars.innerHTML = rows
    .map((item) => {
      const width = Math.max(
        8,
        Math.min(
          100,
          Math.round((Number(item.averageScore || 0) / maxScore) * 100),
        ),
      );
      return `<div class="academic-subject-row"><span>${escapeHtml(item.subjectName)}</span><i><b style="--w:${width}%"></b></i><strong>${academicNumber(item.averageScore, 1)}</strong></div>`;
    })
    .join("");
}

function renderAcademicClassList(
  classSummaries,
  limits = getAcademicRenderLimits(),
) {
  const wrap = document.getElementById("academicClassList");
  if (!wrap) return;
  if (!classSummaries.length) {
    wrap.innerHTML = '<div class="academic-empty">等待班级热力数据</div>';
    return;
  }
  wrap.innerHTML = classSummaries
    .slice(0, limits.classRows)
    .map((item) => {
      const width = Math.max(6, Math.min(100, Number(item.academicIndex || 0)));
      const current = item.isCurrentClass ? " current" : "";
      return `<div class="academic-class-row ${item.riskLevel || "low"}${current}">
        <span>${escapeHtml(item.className)}</span>
        <div class="academic-class-track"><i style="--w:${width}%"></i></div>
        <b>${academicNumber(item.academicIndex, 1)}</b>
      </div>`;
    })
    .join("");
}

function renderAcademicSignals(
  id,
  rows,
  tone,
  limits = getAcademicRenderLimits(),
) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  if (!rows.length) {
    wrap.innerHTML = '<div class="academic-empty">暂无信号</div>';
    return;
  }
  wrap.innerHTML = rows
    .slice(0, limits.signalRows)
    .map((item) => {
      const delta = academicRankDeltaValue(item.rankDelta);
      const deltaClass = delta === null ? "" : delta >= 0 ? "up" : "down";
      return `<div class="academic-signal-item" data-student-id="${escapeHtml(item.studentId)}">
        <div><strong>${escapeHtml(item.studentName)}</strong><span>${escapeHtml(item.className || "")} · ${academicNumber(item.totalScore, 1)}分</span></div>
        <b class="academic-signal-delta ${deltaClass}">${academicRankDeltaText(item.rankDelta)}</b>
      </div>`;
    })
    .join("");
}

function renderAcademicStudentDetail(data) {
  const wrap = document.getElementById("academicStudentDetail");
  if (!wrap) return;
  const student = getSelectedAcademicStudent(data);
  const columns = data.subjectColumns || [];
  if (!student) {
    wrap.innerHTML =
      '<div class="academic-student-empty">选择成绩矩阵中的学生，查看个人学业画像。</div>';
    return;
  }
  const delta = academicRankDeltaValue(student.rankDelta);
  const deltaClass = delta === null ? "" : delta >= 0 ? "up" : "down";
  const subjectRows = columns
    .map((subject, index) => {
      const value = student.subjectScores?.[index];
      const width =
        value === null || value === undefined
          ? 0
          : Math.max(6, Math.min(100, Math.round(Number(value))));
      return `<div class="academic-student-subject">
        <span>${escapeHtml(subject.subjectName)}</span>
        <i><b style="--w:${width}%"></b></i>
        <strong>${value ?? "--"}</strong>
      </div>`;
    })
    .join("");
  wrap.innerHTML = `
    <div class="academic-student-top">
      <div>
        <span>当前选中学生</span>
        <strong>${escapeHtml(student.studentName)}</strong>
        <em>${escapeHtml(student.groupName || student.className || "")}</em>
      </div>
      <b class="${deltaClass}">${academicRankDeltaText(student.rankDelta)}</b>
    </div>
    <div class="academic-student-kpis">
      <div><span>总分</span><strong>${academicNumber(student.totalScore, 1)}</strong></div>
      <div><span>班排</span><strong>${student.classRank ?? "--"}</strong></div>
      <div><span>校排</span><strong>${student.schoolRank ?? "--"}</strong></div>
      <div><span>行为积分</span><strong>${academicNumber(student.behaviorScore)}</strong></div>
    </div>
    <div class="academic-student-subjects">${subjectRows || '<div class="academic-student-empty">暂无科目明细</div>'}</div>
  `;
}

function closeAcademicAiModal() {
  document.getElementById("academicAiModal")?.classList.remove("active");
}

function splitAcademicAiLines(text) {
  return String(text || "")
    .split(/\n|。|；|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAcademicDimensions(dimensions) {
  return Array.isArray(dimensions)
    ? dimensions
        .map((item) => ({
          dimension: item?.dimension || "未分类",
          count: Number(item?.count || 0),
          positiveCount: Number(item?.positiveCount || 0),
          negativeCount: Number(item?.negativeCount || 0),
        }))
        .sort((left, right) => right.count - left.count)
    : [];
}

function buildAcademicAiView(summary) {
  if (!summary) return null;
  const positiveCount = Number(summary.positiveSummary?.count || 0);
  const positiveDelta = Number(summary.positiveSummary?.scoreDelta || 0);
  const negativeCount = Number(summary.negativeSummary?.count || 0);
  const negativeDelta = Number(summary.negativeSummary?.scoreDelta || 0);
  const trend = summary.trendSummary || {};
  const dimensions = normalizeAcademicDimensions(summary.dimensionSummary);
  const topPositive = [...dimensions]
    .sort((a, b) => b.positiveCount - a.positiveCount)
    .find((item) => item.positiveCount > 0);
  const topNegative = [...dimensions]
    .sort((a, b) => b.negativeCount - a.negativeCount)
    .find((item) => item.negativeCount > 0);
  const periodLabel = summary.periodType === "monthly" ? "本月" : "本周";
  const positiveRatio = Math.round(Number(trend.positiveRatio || 0) * 100);
  const suggestions = splitAcademicAiLines(summary.aiSuggestion);
  const highlights = [];
  const risks = [];
  const actions = [];
  if (positiveCount > 0)
    highlights.push(
      `${periodLabel}正向 ${positiveCount} 次，积分 ${positiveDelta >= 0 ? "+" : ""}${positiveDelta}`,
    );
  if (topPositive)
    highlights.push(
      `优势维度：${topPositive.dimension}（${topPositive.positiveCount} 次）`,
    );
  if (trend.recentTrend === "up") highlights.push("近期状态向上，节奏正在改善");
  if (negativeCount > 0)
    risks.push(
      `${periodLabel}负向 ${negativeCount} 次，影响 ${negativeDelta >= 0 ? "+" : ""}${negativeDelta}`,
    );
  if (topNegative)
    risks.push(
      `重点关注：${topNegative.dimension}（${topNegative.negativeCount} 次）`,
    );
  if (trend.recentTrend === "down") risks.push("近期趋势回落，需要及时纠偏");
  suggestions.slice(0, 2).forEach((item) => actions.push(item));
  if (!actions.length) {
    actions.push(
      negativeCount > positiveCount
        ? "建议优先跟进课堂执行与作业完成，设置短周期目标。"
        : "建议保持优势维度，每周沉淀一个可量化进步目标。",
    );
  }
  return {
    summary: summary.aiSummary || "暂无阶段总结",
    suggestion: summary.aiSuggestion || "暂无教师建议",
    trendLine: `${periodLabel}净积分 ${Number(trend.totalScoreDelta || 0)} · 活跃天数 ${Number(trend.activeDays || 0)} · 正向占比 ${positiveRatio}%`,
    highlights: highlights.slice(0, 3),
    risks: risks.slice(0, 3),
    actions: actions.slice(0, 3),
    metrics: {
      positiveCount,
      negativeCount,
      totalScoreDelta: Number(trend.totalScoreDelta || 0),
      activeDays: Number(trend.activeDays || 0),
    },
    dimensions: dimensions.slice(0, 4),
    evidence: Array.isArray(trend.evidence) ? trend.evidence.slice(0, 4) : [],
  };
}

function renderAcademicAiModalState(state, payload = {}) {
  const body = document.getElementById("academicAiBody");
  const nameEl = document.getElementById("academicAiStudentName");
  const metaEl = document.getElementById("academicAiStudentMeta");
  const student = payload.student || getSelectedAcademicStudent();
  if (nameEl)
    nameEl.textContent = student?.studentName
      ? `${student.studentName} · AI 学情分析`
      : "AI 学情分析";
  if (metaEl) metaEl.textContent = payload.meta || "本周 · 学生画像";
  if (!body) return;
  if (state === "loading") {
    body.innerHTML =
      '<div class="academic-ai-placeholder"><i></i>正在读取 AI 学情摘要...</div>';
    return;
  }
  if (state === "error") {
    body.innerHTML = `<div class="academic-ai-error">
      <strong>AI 学情暂不可用</strong>
      <p>${escapeHtml(payload.message || "请稍后重试。")}</p>
    </div>`;
    return;
  }
  const view = buildAcademicAiView(payload.summary);
  if (!view) {
    body.innerHTML =
      '<div class="academic-ai-placeholder">暂无 AI 学情摘要。</div>';
    return;
  }
  const listHtml = (items, emptyText) =>
    items.length
      ? items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")
      : `<span>${escapeHtml(emptyText)}</span>`;
  const dimensionHtml = view.dimensions.length
    ? view.dimensions
        .map(
          (item) =>
            `<div><span>${escapeHtml(item.dimension)}</span><strong>${item.count}</strong><em>正${item.positiveCount} / 负${item.negativeCount}</em></div>`,
        )
        .join("")
    : "<div><span>暂无维度</span><strong>0</strong><em>待积累</em></div>";
  const evidenceHtml = view.evidence.length
    ? view.evidence
        .map(
          (item) => `<div class="academic-ai-evidence-item">
          <strong>${escapeHtml(item.ruleName || item.signal || "学情事件")}</strong>
          <span>${escapeHtml([item.date, item.subject, item.scene].filter(Boolean).join(" · "))}</span>
          <b class="${Number(item.scoreDelta || 0) >= 0 ? "up" : "down"}">${academicDeltaText(item.scoreDelta)}</b>
        </div>`,
        )
        .join("")
    : '<div class="academic-ai-evidence-item"><strong>暂无关键证据</strong><span>后续会展示课堂、作业和学科事件</span><b>--</b></div>';
  body.innerHTML = `
    <div class="academic-ai-summary-grid">
      <div class="academic-ai-copy"><span>阶段总结</span><p>${escapeHtml(view.summary)}</p></div>
      <div class="academic-ai-copy soft"><span>教师建议</span><p>${escapeHtml(view.suggestion)}</p></div>
    </div>
    <div class="academic-ai-trend">${escapeHtml(view.trendLine)}</div>
    <div class="academic-ai-metrics">
      <div><span>正向次数</span><strong>${view.metrics.positiveCount}</strong></div>
      <div><span>负向次数</span><strong>${view.metrics.negativeCount}</strong></div>
      <div><span>积分净变</span><strong>${view.metrics.totalScoreDelta}</strong></div>
      <div><span>活跃天数</span><strong>${view.metrics.activeDays}</strong></div>
    </div>
    <div class="academic-ai-cards">
      <div><strong>本期亮点</strong>${listHtml(view.highlights, "暂无明显亮点，建议继续积累正向表现。")}</div>
      <div><strong>风险提醒</strong>${listHtml(view.risks, "暂无高风险信号，当前状态整体平稳。")}</div>
      <div><strong>下阶段建议</strong>${listHtml(view.actions, "暂无建议，可重新生成分析。")}</div>
    </div>
    <div class="academic-ai-lower">
      <div class="academic-ai-dimensions">${dimensionHtml}</div>
      <div class="academic-ai-evidence">${evidenceHtml}</div>
    </div>
  `;
}

async function loadAcademicAiSummary(studentId, options = {}) {
  const periodType = "weekly";
  const cacheKey = `${studentId}:${periodType}`;
  if (!options.regenerate && runtimeState.academicAiCache.has(cacheKey)) {
    return runtimeState.academicAiCache.get(cacheKey);
  }
  if (!options.regenerate && runtimeState.academicAiRequests.has(cacheKey)) {
    return runtimeState.academicAiRequests.get(cacheKey);
  }
  // 始终走 display 公开接口，不校验登录账号、角色或锁定状态
  const request = (async () => {
    if (!options.regenerate) {
      const cached = await apiFetch(
        `/display/classes/${runtimeState.classId}/academic-ai/${studentId}/summary?periodType=${periodType}`,
      );
      if (cached) {
        runtimeState.academicAiCache.set(cacheKey, cached);
        return cached;
      }
    }
    const generated = await apiFetch(
      `/display/classes/${runtimeState.classId}/academic-ai/${studentId}/generate`,
      {
        method: "POST",
        body: JSON.stringify({ periodType }),
      },
    );
    runtimeState.academicAiCache.set(cacheKey, generated);
    return generated;
  })();
  runtimeState.academicAiRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    runtimeState.academicAiRequests.delete(cacheKey);
  }
}

async function openAcademicAiModal(studentId) {
  const student =
    (getAcademicGrowthData().studentRows || []).find(
      (row) =>
        academicStudentKey(row.studentId) === academicStudentKey(studentId),
    ) || getSelectedAcademicStudent();
  runtimeState.selectedAcademicAiStudentId = studentId;
  document.getElementById("academicAiModal")?.classList.add("active");
  renderAcademicAiModalState("loading", {
    student,
    meta: "本周 · 正在生成画像",
  });
  try {
    const summary = await loadAcademicAiSummary(studentId);
    if (
      academicStudentKey(runtimeState.selectedAcademicAiStudentId) !==
      academicStudentKey(studentId)
    )
      return;
    renderAcademicAiModalState("ready", {
      student,
      summary,
      meta: `${summary.periodType === "monthly" ? "本月" : "本周"} · ${summary.snapshotDate ? String(summary.snapshotDate).slice(0, 10) : "最新生成"}`,
    });
  } catch (error) {
    if (
      academicStudentKey(runtimeState.selectedAcademicAiStudentId) !==
      academicStudentKey(studentId)
    )
      return;
    renderAcademicAiModalState("error", {
      student,
      message: error instanceof Error ? error.message : "AI 学情摘要加载失败",
    });
  }
}

async function regenerateAcademicAiSummary() {
  const studentId =
    runtimeState.selectedAcademicAiStudentId ||
    runtimeState.selectedAcademicStudentId;
  if (!studentId) return;
  const student =
    (getAcademicGrowthData().studentRows || []).find(
      (row) =>
        academicStudentKey(row.studentId) === academicStudentKey(studentId),
    ) || getSelectedAcademicStudent();
  renderAcademicAiModalState("loading", {
    student,
    meta: "本周 · 正在重新生成",
  });
  try {
    const summary = await loadAcademicAiSummary(studentId, {
      regenerate: true,
    });
    renderAcademicAiModalState("ready", {
      student,
      summary,
      meta: `${summary.periodType === "monthly" ? "本月" : "本周"} · ${summary.snapshotDate ? String(summary.snapshotDate).slice(0, 10) : "最新生成"}`,
    });
  } catch (error) {
    renderAcademicAiModalState("error", {
      student,
      message: error instanceof Error ? error.message : "AI 学情生成失败",
    });
  }
}

function enableAcademicSelectionEvents() {
  ["academicScoreTable", "academicProgressList", "academicRiskList"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.academicSelectReady === "1") return;
      el.dataset.academicSelectReady = "1";
      el.addEventListener(
        "pointerdown",
        (event) => {
          const hit = academicEventTargetElement(event);
          const target = hit?.closest("[data-student-id]") ?? null;
          const studentId = target?.getAttribute("data-student-id");
          if (!studentId) {
            delete el.dataset.pendingAcademicStudentId;
            return;
          }
          el.dataset.pendingAcademicStudentId = studentId;
          el.dataset.pendingAcademicX = String(event.clientX);
          el.dataset.pendingAcademicY = String(event.clientY);
        },
        true,
      );
      el.addEventListener(
        "pointerup",
        (event) => {
          const studentId = el.dataset.pendingAcademicStudentId;
          if (!studentId) return;
          const startX = Number(el.dataset.pendingAcademicX || event.clientX);
          const startY = Number(el.dataset.pendingAcademicY || event.clientY);
          const moved =
            Math.abs(event.clientX - startX) > 8 ||
            Math.abs(event.clientY - startY) > 8;
          delete el.dataset.pendingAcademicStudentId;
          delete el.dataset.pendingAcademicX;
          delete el.dataset.pendingAcademicY;
          const tableIgnoreMicroDrag = id === "academicScoreTable";
          if (
            !moved &&
            (el.dataset.dragMoved !== "1" || tableIgnoreMicroDrag)
          ) {
            handleAcademicListPickFromEvent(studentId, event, id);
          }
        },
        true,
      );
      el.addEventListener(
        "pointercancel",
        () => {
          delete el.dataset.pendingAcademicStudentId;
          delete el.dataset.pendingAcademicX;
          delete el.dataset.pendingAcademicY;
        },
        true,
      );
      el.addEventListener("click", (event) => {
        if (el.dataset.dragMoved === "1" && id !== "academicScoreTable") return;
        const hit = academicEventTargetElement(event);
        const target = hit?.closest("[data-student-id]") ?? null;
        const studentId = target?.getAttribute("data-student-id");
        if (!studentId) return;
        handleAcademicListPickFromEvent(studentId, event, id);
      });
    },
  );
}

function enableClassroomGridDragScroll() {
  const wrap = getClassroomGridWrap();
  if (!wrap || wrap.dataset.dragScrollReady === "1") return;
  wrap.dataset.dragScrollReady = "1";

  const profile = getTouchInteractionProfile();
  const state = {
    dragging: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    scrollTop: 0,
    velocityY: 0,
    inertiaFrame: 0,
  };

  const stopInertia = () => {
    if (!state.inertiaFrame) return;
    cancelAnimationFrame(state.inertiaFrame);
    state.inertiaFrame = 0;
  };

  const detachDocumentListeners = () => {
    document.removeEventListener("pointermove", onDocumentMove);
    document.removeEventListener("pointerup", endDrag);
    document.removeEventListener("pointercancel", endDrag);
  };

  const startInertia = () => {
    if (!state.moved) return;
    let vy = state.velocityY;
    if (Math.abs(vy) < 0.02) return;
    let previousTime = performance.now();
    const step = (now) => {
      const elapsed = Math.min(32, now - previousTime);
      previousTime = now;
      const beforeTop = wrap.scrollTop;
      wrap.scrollTop += vy * elapsed;
      if (wrap.scrollTop === beforeTop) vy = 0;
      vy *= 0.92;
      if (Math.abs(vy) < 0.02) {
        state.inertiaFrame = 0;
        return;
      }
      state.inertiaFrame = requestAnimationFrame(step);
    };
    state.inertiaFrame = requestAnimationFrame(step);
  };

  const onDocumentMove = (event) => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (!state.moved) {
      if (!isGridScrollable(wrap)) return;
      if (!isVerticalScrollIntent(dx, dy, profile)) return;
      state.moved = true;
      wrap.dataset.dragMoved = "1";
      wrap.dataset.dragSuppressClick = "1";
      wrap.classList.add("dragging");
      try {
        wrap.setPointerCapture?.(event.pointerId);
      } catch {
        // 部分嵌入式浏览器不支持在滚动容器上 capture
      }
    }
    if (state.moved) {
      event.preventDefault();
      event.stopPropagation();
      wrap.scrollTop = state.scrollTop - dy;
    }

    const now = performance.now();
    const elapsed = Math.max(8, now - state.lastTime);
    state.velocityY = (state.lastY - event.clientY) / elapsed;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.lastTime = now;
  };

  const endDrag = (event) => {
    if (
      !state.dragging ||
      (event?.pointerId !== undefined && event.pointerId !== state.pointerId)
    ) {
      return;
    }
    if (state.moved) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
    }
    state.dragging = false;
    wrap.classList.remove("dragging");
    if (event?.pointerId !== undefined) {
      try {
        if (
          !wrap.hasPointerCapture ||
          wrap.hasPointerCapture(event.pointerId)
        ) {
          wrap.releasePointerCapture?.(event.pointerId);
        }
      } catch {
        // capture 可能已被浏览器释放
      }
    }
    state.pointerId = null;
    detachDocumentListeners();
    startInertia();
    window.setTimeout(() => {
      wrap.dataset.dragMoved = "0";
      wrap.dataset.dragSuppressClick = "0";
    }, profile.scrollClickSuppressMs);
  };

  wrap.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest("button,a,input,select,textarea")) return;
      if (!isGridScrollable(wrap)) return;
      stopInertia();
      state.dragging = true;
      state.moved = false;
      state.pointerId = event.pointerId;
      wrap.dataset.dragMoved = "0";
      wrap.dataset.dragSuppressClick = "0";
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastTime = performance.now();
      state.scrollTop = wrap.scrollTop;
      state.velocityY = 0;
      document.addEventListener("pointermove", onDocumentMove, {
        passive: false,
      });
      document.addEventListener("pointerup", endDrag);
      document.addEventListener("pointercancel", endDrag);
    },
    true,
  );

  wrap.addEventListener(
    "click",
    (event) => {
      if (wrap.dataset.dragSuppressClick !== "1") return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );
}

function enableAcademicDragScroll() {
  document
    .querySelectorAll(
      ".academic-table, .academic-side-column, .academic-class-list, .academic-student-subjects",
    )
    .forEach((el) => {
      if (el.dataset.dragScrollReady === "1") return;
      el.dataset.dragScrollReady = "1";
      const state = {
        dragging: false,
        moved: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        lastTime: 0,
        scrollLeft: 0,
        scrollTop: 0,
        velocityX: 0,
        velocityY: 0,
        inertiaFrame: 0,
      };

      const stopInertia = () => {
        if (!state.inertiaFrame) return;
        cancelAnimationFrame(state.inertiaFrame);
        state.inertiaFrame = 0;
      };

      const startInertia = () => {
        if (!state.moved) return;
        let vx = state.velocityX;
        let vy = state.velocityY;
        if (Math.abs(vx) < 0.02 && Math.abs(vy) < 0.02) return;
        let previousTime = performance.now();
        const step = (now) => {
          const elapsed = Math.min(32, now - previousTime);
          previousTime = now;
          const beforeLeft = el.scrollLeft;
          const beforeTop = el.scrollTop;
          el.scrollLeft += vx * elapsed;
          el.scrollTop += vy * elapsed;
          if (el.scrollLeft === beforeLeft) vx = 0;
          if (el.scrollTop === beforeTop) vy = 0;
          vx *= 0.92;
          vy *= 0.92;
          if (Math.abs(vx) < 0.02 && Math.abs(vy) < 0.02) {
            state.inertiaFrame = 0;
            return;
          }
          state.inertiaFrame = requestAnimationFrame(step);
        };
        state.inertiaFrame = requestAnimationFrame(step);
      };

      el.addEventListener("pointerdown", (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        if (event.target.closest("button,a,input,select,textarea")) return;
        if (el.classList.contains("academic-side-column")) {
          if (
            event.target.closest(
              "[data-student-id], .academic-student-subjects, .academic-class-list",
            )
          )
            return;
        }
        stopInertia();
        state.dragging = true;
        state.moved = false;
        state.pointerId = event.pointerId;
        el.dataset.dragMoved = "0";
        el.dataset.dragSuppressClick = "0";
        el.classList.add("dragging");
        state.startX = event.clientX;
        state.startY = event.clientY;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        state.lastTime = performance.now();
        state.scrollLeft = el.scrollLeft;
        state.scrollTop = el.scrollTop;
        state.velocityX = 0;
        state.velocityY = 0;
        try {
          el.setPointerCapture?.(event.pointerId);
        } catch {
          // Some embedded browser shells reject capture on nested table targets.
        }
      });
      el.addEventListener("pointermove", (event) => {
        if (!state.dragging || event.pointerId !== state.pointerId) return;
        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;
        if (!state.moved && Math.hypot(dx, dy) > 4) {
          state.moved = true;
          el.dataset.dragMoved = "1";
          el.dataset.dragSuppressClick = "1";
        }
        if (state.moved) {
          event.preventDefault();
          event.stopPropagation();
          el.scrollLeft = state.scrollLeft - dx;
          el.scrollTop = state.scrollTop - dy;
        }

        const now = performance.now();
        const elapsed = Math.max(8, now - state.lastTime);
        state.velocityX = (state.lastX - event.clientX) / elapsed;
        state.velocityY = (state.lastY - event.clientY) / elapsed;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        state.lastTime = now;
      });
      const endDrag = (event) => {
        if (
          !state.dragging ||
          (event?.pointerId !== undefined &&
            event.pointerId !== state.pointerId)
        )
          return;
        if (state.moved) {
          event?.preventDefault?.();
          event?.stopPropagation?.();
        }
        state.dragging = false;
        el.classList.remove("dragging");
        if (event?.pointerId !== undefined) {
          try {
            if (
              !el.hasPointerCapture ||
              el.hasPointerCapture(event.pointerId)
            ) {
              el.releasePointerCapture?.(event.pointerId);
            }
          } catch {
            // Capture may already be released after pointerup/cancel.
          }
        }
        state.pointerId = null;
        startInertia();
        window.setTimeout(() => {
          el.dataset.dragMoved = "0";
          el.dataset.dragSuppressClick = "0";
        }, 120);
      };
      el.addEventListener("pointerup", endDrag);
      el.addEventListener("pointercancel", endDrag);
      el.addEventListener(
        "click",
        (event) => {
          if (el.dataset.dragSuppressClick !== "1") return;
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        true,
      );
    });
}

function renderRewardCenter() {
  const grid = document.querySelector("#page-exchange .ex-grid");
  if (!grid || runtimeState.rewards.length === 0) return;
  const fallbackImages = [
    "images/gifts/480/育英台历.jpg",
    "images/gifts/480/育英小卡.jpg",
    "images/gifts/480/育英布袋.jpg",
    "images/gifts/480/育英抱枕.jpg",
  ];
  const renderRewardCard = (reward, index) => {
    const fallbackImage = fallbackImages[index % fallbackImages.length];
    const imageUrl =
      reward.scopeType === "global"
        ? resolveDisplayImageUrl(giftImageVariant(reward.imageUrl, 480)) ||
          fallbackImage
        : "";
    const stockLabel = reward.isInfiniteStock
      ? "库存不限"
      : `剩余 ${Math.max(0, reward.stockQty || 0)} 份`;
    const sourceLabel = escapeHtml(
      reward.sourceLabel ||
        (reward.scopeType === "class" ? "班级奖励" : "学校奖励"),
    );
    const stockEmpty =
      !reward.isInfiniteStock && Number(reward.stockQty || 0) <= 0;
    return `
          <div class="ex-item-card">
            <div class="ex-item-img-wrap">
              ${
                reward.scopeType === "global"
                  ? `<img src="${imageUrl}" class="ex-item-img" alt="${escapeHtml(reward.name)}" loading="lazy" decoding="async" onerror="this.src='${fallbackImage}'" />`
                  : `<div class="ex-item-img" style="display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:var(--brand-red);background:linear-gradient(135deg,#fff6ef,#ffe5d6);">${escapeHtml(reward.name.slice(0, 2))}</div>`
              }
            </div>
            <div class="ex-item-body">
              <div class="ex-item-name">${escapeHtml(reward.name)}</div>
              <div class="ex-item-cost">${reward.scoreCost} 积分</div>
              <div class="ex-item-meta">${sourceLabel} · ${stockLabel}</div>
              <button class="ex-btn" ${stockEmpty ? "disabled" : ""} onclick="initiateExchange(${reward.id}, '${escapeHtml(reward.name)}', ${reward.scoreCost})">
                ${stockEmpty ? "已兑完" : "立即兑换"}
              </button>
            </div>
          </div>`;
  };

  const schoolRewards = runtimeState.rewards.filter(
    (reward) => reward.scopeType !== "class",
  );
  const classRewards = runtimeState.rewards.filter(
    (reward) => reward.scopeType === "class",
  );
  const sections = [];

  if (schoolRewards.length > 0) {
    sections.push(`
      <section class="ex-reward-section">
        <div class="ex-reward-section-head">
          <div class="ex-reward-section-title">学校奖励</div>
          <div class="ex-reward-section-sub">面向全校统一兑换</div>
        </div>
        <div class="ex-reward-row">
          ${schoolRewards.map((reward, index) => renderRewardCard(reward, index)).join("")}
        </div>
      </section>
    `);
  }

  if (classRewards.length > 0) {
    sections.push(`
      <section class="ex-reward-section ex-reward-section-class">
        <div class="ex-reward-section-head">
          <div class="ex-reward-section-title">班级奖励</div>
          <div class="ex-reward-section-sub">当前班级专属兑换</div>
        </div>
        <div class="ex-reward-row">
          ${classRewards.map((reward, index) => renderRewardCard(reward, schoolRewards.length + index)).join("")}
        </div>
      </section>
    `);
  }

  grid.innerHTML = sections.join("");
}

function configureRuleButtons() {
  const addGrid = document.getElementById("pmAddGrid");
  const subGrid = document.getElementById("pmSubGrid");
  if (!addGrid || !subGrid) return;
  const sortRules = (rules) =>
    [...rules].sort((a, b) => {
      if (a.highFrequencyRank !== undefined && b.highFrequencyRank !== undefined) {
        if (a.highFrequencyRank !== b.highFrequencyRank) {
          return a.highFrequencyRank - b.highFrequencyRank;
        }
      } else if (a.highFrequencyRank !== undefined) {
        return -1;
      } else if (b.highFrequencyRank !== undefined) {
        return 1;
      }
      const absA = Math.abs(a.scoreValue || 0);
      const absB = Math.abs(b.scoreValue || 0);
      if (absA !== absB) return absB - absA;
      return String(a.name || "").localeCompare(String(b.name || ""), "zh-CN");
    });
  const positiveRules = sortRules(
    runtimeState.scoreRules.filter((rule) => rule.scoreType === "add" && rule.isHighFrequency),
  ).slice(0, 9);
  const negativeRules = sortRules(
    runtimeState.scoreRules.filter((rule) => rule.scoreType === "deduct" && rule.isHighFrequency),
  ).slice(0, 9);

  const renderRuleButton = (rule, type) => `
          <div class="pm-btn ${type}" onclick="applyQuickRule(${rule.id})">
            <span>${escapeHtml(rule.name)}</span>
            <span>${rule.scoreType === "add" ? "+" : "-"}${Math.abs(rule.scoreValue || 0)}</span>
          </div>`;

  addGrid.innerHTML =
    positiveRules.length > 0
      ? positiveRules.map((rule) => renderRuleButton(rule, "add")).join("")
      : '<div style="font-size:12px;color:#8b95a5;padding:8px 0;">暂无展示端加分规则</div>';
  subGrid.innerHTML =
    negativeRules.length > 0
      ? negativeRules.map((rule) => renderRuleButton(rule, "sub")).join("")
      : '<div style="font-size:12px;color:#8b95a5;padding:8px 0;">暂无展示端扣分规则</div>';
  renderMoreRulePanel();
}

function getFilteredRulesForMorePanel() {
  const keyword = displayRulePanelState.searchKeyword.trim().toLowerCase();
  return runtimeState.scoreRules.filter((rule) => {
    const matchesType = rule.scoreType === displayRulePanelState.activeType;
    const matchesScene =
      displayRulePanelState.sceneCode === "all" ||
      rule.sceneCode === displayRulePanelState.sceneCode;
    const searchSource =
      `${rule.name || ""} ${rule.dimension || ""} ${rule.tag || ""}`.toLowerCase();
    const matchesKeyword = !keyword || searchSource.includes(keyword);
    return matchesType && matchesScene && matchesKeyword;
  });
}

function renderMoreRulePanel() {
  const panel = document.getElementById("pmMorePanel");
  const grid = document.getElementById("pmMoreGrid");
  const quickPanels = document.getElementById("pmQuickPanels");
  const sceneFilters = document.getElementById("pmSceneFilters");
  const quickTab = document.getElementById("pmMoreTabQuick");
  const addTab = document.getElementById("pmMoreTabAdd");
  const deductTab = document.getElementById("pmMoreTabDeduct");
  const searchInput = document.getElementById("pmRuleSearch");
  
  if (
    !panel ||
    !grid ||
    !quickPanels ||
    !sceneFilters ||
    !quickTab ||
    !addTab ||
    !deductTab ||
    !searchInput
  )
    return;

  quickTab.classList.toggle("active", displayRulePanelState.activeType === "quick");
  addTab.classList.toggle("active", displayRulePanelState.activeType === "add");
  deductTab.classList.toggle(
    "active",
    displayRulePanelState.activeType === "deduct",
  );

  if (displayRulePanelState.activeType === "quick") {
    quickPanels.classList.remove("hidden");
    grid.classList.add("hidden");
    sceneFilters.classList.add("hidden");
    searchInput.classList.add("hidden");
    return;
  }

  quickPanels.classList.add("hidden");
  grid.classList.remove("hidden");
  sceneFilters.classList.remove("hidden");
  searchInput.classList.remove("hidden");
  searchInput.value = displayRulePanelState.searchKeyword;

  const sceneCodeSet = Array.from(
    new Set(
      runtimeState.scoreRules
        .filter((rule) => rule.scoreType === displayRulePanelState.activeType)
        .map((rule) => rule.sceneCode)
        .filter(Boolean),
    ),
  ).sort((a, b) => {
    const idxA = DISPLAY_SCENE_ORDER.indexOf(a);
    const idxB = DISPLAY_SCENE_ORDER.indexOf(b);
    const orderA = idxA === -1 ? 999 : idxA;
    const orderB = idxB === -1 ? 999 : idxB;
    return orderA - orderB;
  });

  sceneFilters.innerHTML = [
    `<button type="button" class="pm-scene-chip${displayRulePanelState.sceneCode === "all" ? " active" : ""}" onclick="setMoreRuleScene('all')">全部场景</button>`,
    ...sceneCodeSet.map(
      (sceneCode) =>
        `<button type="button" class="pm-scene-chip${displayRulePanelState.sceneCode === sceneCode ? " active" : ""}" onclick="setMoreRuleScene('${sceneCode}')">${escapeHtml(DISPLAY_SCENE_LABELS[sceneCode] || sceneCode)}</button>`,
    ),
  ].join("");

  const filteredRules = getFilteredRulesForMorePanel();
  grid.innerHTML =
    filteredRules.length > 0
      ? filteredRules
          .map(
            (rule) => `
            <button type="button" class="pm-btn ${rule.scoreType === "add" ? "add" : "sub"}" onclick="applyQuickRule(${rule.id})">
              <span>${escapeHtml(rule.name)}</span>
              <span>${rule.scoreType === "add" ? "+" : "-"}${Math.abs(rule.scoreValue || 0)}</span>
            </button>`,
          )
          .join("")
      : '<div class="pm-empty">当前筛选下没有可用规则</div>';
}

function openMoreRulePanel(type = "quick") {
  displayRulePanelState.activeType = type;
  displayRulePanelState.searchKeyword = "";
  displayRulePanelState.sceneCode = "all";
  renderMoreRulePanel();
}

function closeMoreRulePanel() {
  // Logic removed because the panels are merged.
}

function switchMoreRuleType(type) {
  displayRulePanelState.activeType = type;
  displayRulePanelState.sceneCode = "all";
  renderMoreRulePanel();
}

function setMoreRuleScene(sceneCode) {
  displayRulePanelState.sceneCode = sceneCode;
  renderMoreRulePanel();
}

async function loadScoreHistory(studentId) {
  const rows = await apiFetch(
    `/score-records?classId=${runtimeState.classId}&studentId=${studentId}`,
  ).catch(() => []);
  return rows.map((item) => {
    const rule = runtimeState.scoreRules.find((row) => row.id === item.ruleId);
    const time = new Date(item.createdAt);
    const fullTime = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, "0")}-${String(
      time.getDate(),
    ).padStart(2, "0")} ${String(time.getHours()).padStart(2, "0")}:${String(
      time.getMinutes(),
    ).padStart(2, "0")}`;
    return {
      reason: rule?.name || item.remark || "积分调整",
      diff: Number(item.scoreDelta || 0),
      fullTime,
      time: `${String(time.getHours()).padStart(2, "0")}:${String(
        time.getMinutes(),
      ).padStart(2, "0")}`,
    };
  });
}

function setAllHistoryButtonState({
  visible = false,
  enabled = false,
  text = "全部记录",
} = {}) {
  const btn = document.getElementById("pmHistoryAllBtn");
  if (!btn) return;
  btn.style.display = visible ? "inline-flex" : "none";
  btn.disabled = !enabled;
  btn.textContent = text;
}

function renderAllHistoryModal(studentName, records) {
  const title = document.getElementById("pmAllHistoryTitle");
  const list = document.getElementById("pmAllHistoryList");
  if (!title || !list) return;
  title.textContent = `${studentName} · 积分动态（全部记录）`;
  if (!Array.isArray(records) || records.length === 0) {
    list.innerHTML = '<div class="pm-empty">暂无积分记录</div>';
    return;
  }
  list.innerHTML = records
    .map(
      (item) => `
        <div class="pm-all-history-item">
          <div class="pm-all-history-main">
            <span class="pm-all-history-reason">${escapeHtml(item.reason || "积分调整")}</span>
            <span class="pm-all-history-time">${escapeHtml(item.fullTime || item.time || "--:--")}</span>
          </div>
          <span class="pm-all-history-diff ${Number(item.diff || 0) >= 0 ? "pos" : "neg"}">${Number(item.diff || 0) >= 0 ? `+${Number(item.diff || 0)}` : Number(item.diff || 0)}</span>
        </div>`,
    )
    .join("");
}

function openAllHistoryModal() {
  if (!currentFocusStudent || currentFocusStudent.type !== "single") return;
  const overlay = document.getElementById("pmAllHistoryModal");
  if (!overlay) return;
  const student = students[currentFocusStudent.idx];
  if (!student) return;
  renderAllHistoryModal(student.name, currentAllHistoryRecords);
  overlay.classList.add("active");
}

function closeAllHistoryModal() {
  document.getElementById("pmAllHistoryModal")?.classList.remove("active");
  if (document.body.classList.contains("low-spec")) {
    const list = document.getElementById("pmAllHistoryList");
    if (list) list.innerHTML = "";
  }
}

async function loadStudentHonorRecords(studentId) {
  const rows = await apiFetch(
    `/display/classes/${runtimeState.classId}/honor-records?studentId=${studentId}&targetType=student`,
  ).catch(() => []);
  return (rows || []).map(normalizeHonorRecord).filter(Boolean);
}

async function loadPetProfileRecords(studentId) {
  const rows = await apiFetch(
    `/score-records?classId=${runtimeState.classId}&studentId=${studentId}`,
  ).catch(() => []);
  return rows.map((item) => {
    const rule = runtimeState.scoreRules.find((row) => row.id === item.ruleId);
    const time = new Date(item.createdAt);
    const teacherName =
      item.operatorName ||
      item.teacher?.name ||
      item.createdByUser?.name ||
      "教师";
    return {
      title: rule?.name || item.remark || "积分调整",
      diff: Number(item.scoreDelta || 0),
      time: `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, "0")}-${String(
        time.getDate(),
      ).padStart(2, "0")} ${String(time.getHours()).padStart(2, "0")}:${String(
        time.getMinutes(),
      ).padStart(2, "0")}`,
      actor: teacherName,
      remark: item.remark || "",
    };
  });
}

function renderModalHistory(s) {
  const wrapper = document.getElementById("pmHistory");
  if (!wrapper) return;
  const histHtml = (s.history || [])
    .slice(0, 5)
    .map(
      (h) => `
    <div class="pm-history-item fade-in">
      <div style="display:flex; flex-direction:column; gap:2px;">
        <span class="pm-history-reason">${escapeHtml(h.reason)}</span>
        <span class="pm-history-time">${escapeHtml(h.time)}</span>
      </div>
      <span class="pm-history-diff ${h.diff > 0 ? "pos" : "neg"}">${h.diff > 0 ? "+" + h.diff : h.diff}</span>
    </div>
  `,
    )
    .join("");
  wrapper.innerHTML =
    histHtml ||
    '<div style="text-align:center;color:#999;font-size:12px;padding:10px;">暂无记录</div>';
}

async function openPointModalSingle(idx, cardEl) {
  currentFocusStudent = { type: "single", idx, el: cardEl };
  const s = students[idx];
  document.getElementById("pmAvatar").src = petImg(s);
  document.getElementById("pmName").textContent = s.name;
  document.getElementById("pmPts").textContent = s.pts;
  closeAllHistoryModal();
  setAllHistoryButtonState({
    visible: true,
    enabled: false,
    text: "加载中...",
  });
  currentAllHistoryRecords = Array.isArray(s.history) ? s.history : [];
  renderModalHistory(s);
  openMoreRulePanel("quick");
  document.getElementById("pointModal").classList.add("active");
  if (s.id) {
    s.history = await loadScoreHistory(s.id).catch(() => s.history || []);
    currentAllHistoryRecords = Array.isArray(s.history) ? s.history : [];
    renderModalHistory(s);
    setAllHistoryButtonState({
      visible: true,
      enabled: currentAllHistoryRecords.length > 0,
      text: "全部记录",
    });
  } else {
    setAllHistoryButtonState({
      visible: true,
      enabled: false,
      text: "全部记录",
    });
  }
}

function openPointModalBatch(names) {
  currentFocusStudent = { type: "batch", names };
  document.getElementById("pmAvatar").src = "images/logo.svg";
  document.getElementById("pmName").textContent =
    "已选 " + names.length + " 人";
  document.getElementById("pmPts").textContent = "—";
  document.getElementById("pmHistory").innerHTML =
    '<div style="text-align:center;color:#999;font-size:12px;padding:10px;">批量操作将写入每位选中学生</div>';
  closeAllHistoryModal();
  setAllHistoryButtonState({ visible: false });
  currentAllHistoryRecords = [];
  openMoreRulePanel("quick");
  document.getElementById("pointModal").classList.add("active");
}

function openPointModalGroup(groupNum) {
  const list = students.filter((s) => s.group === groupNum);
  const groupLabel = getGroupLabel(groupNum);
  currentFocusStudent = { type: "group", group: groupNum };
  document.getElementById("pmAvatar").src = "images/logo.svg";
  document.getElementById("pmName").textContent =
    groupLabel + "（" + list.length + " 人）";
  document.getElementById("pmPts").textContent = "—";
  document.getElementById("pmHistory").innerHTML =
    '<div style="text-align:center;color:#999;font-size:12px;padding:10px;">对本组全部学生同步加减分</div>';
  closeAllHistoryModal();
  setAllHistoryButtonState({ visible: false });
  currentAllHistoryRecords = [];
  openMoreRulePanel("quick");
  document.getElementById("pointModal").classList.add("active");
}

async function applyQuickRule(ruleId) {
  if (scoreActionInFlight) return;
  if (!currentFocusStudent) return;
  const rule = runtimeState.scoreRules.find((item) => item.id === ruleId);
  if (!rule) {
    showDisplayToast("当前规则不可用");
    return;
  }
  if (!runtimeState.token) {
    showDisplayToast("请先登录教师账号");
    return;
  }

  scoreActionInFlight = true;
  const payloadBase = {
    classId: runtimeState.classId,
    ruleId,
    sourceTerminal: "display",
    remark: rule.name,
  };
  let targetText = "";
  if (currentFocusStudent.type === "single") {
    const student = students[currentFocusStudent.idx];
    targetText = student ? student.name : "当前学生";
  } else if (currentFocusStudent.type === "batch") {
    targetText = `已选 ${currentFocusStudent.names.length} 名学生`;
  } else if (currentFocusStudent.type === "group") {
    targetText = `第 ${currentFocusStudent.group} 组`;
  }
  const deltaPrefix = rule.scoreType === "add" ? "+" : "-";
  try {
    const confirmed = await showConfirmModal({
      tone: rule.scoreType === "add" ? "success" : "warn",
      badge: rule.scoreType === "add" ? "加分确认" : "扣分确认",
      icon: rule.scoreType === "add" ? "fa-plus" : "fa-minus",
      title: `确认${rule.scoreType === "add" ? "加分" : "扣分"}吗？`,
      description: `${targetText}\n规则：${rule.name}\n分值：${deltaPrefix}${Math.abs(rule.scoreValue || 0)}`,
      confirmText: rule.scoreType === "add" ? "确认加分" : "确认扣分",
    });
    if (!confirmed) return;

    if (currentFocusStudent.type === "single") {
      const student = students[currentFocusStudent.idx];
      await apiFetch("/score-records", {
        method: "POST",
        body: JSON.stringify({
          ...payloadBase,
          studentId: student.id,
        }),
      });
    } else if (currentFocusStudent.type === "batch") {
      const ids = students
        .filter((item) => currentFocusStudent.names.includes(item.name))
        .map((item) => item.id);
      await apiFetch("/score-records/batch", {
        method: "POST",
        body: JSON.stringify({
          ...payloadBase,
          studentIds: ids,
        }),
      });
    } else if (currentFocusStudent.type === "group") {
      const group = runtimeState.groups.find(
        (item) => item.groupNo === currentFocusStudent.group,
      );
      if (!group) {
        throw new Error("当前小组不存在");
      }
      await apiFetch("/score-records/group", {
        method: "POST",
        body: JSON.stringify({
          ...payloadBase,
          classGroupId: group.id,
        }),
      });
    }

    closePointModal();
    await refreshDisplayDataAfterMutation({
      actionLabel: "加减分",
      failureMessage: "加减分已提交，但界面刷新失败，请检查网络连接后重试。",
    });
  } catch (error) {
    showDisplayToast(error.message || "加减分失败");
  } finally {
    window.setTimeout(() => {
      scoreActionInFlight = false;
    }, 450);
    closeConfirmModal(false);
  }
}

let currentExchangeRewardId = null;
let exchangeConfirmInFlight = false;

function resetCurrentExchangeState() {
  currentExchangeRewardId = null;
  currentExchangeItem = null;
  currentExchangeCost = 0;
  exchangeConfirmInFlight = false;
}

function initiateExchange(rewardId, itemName, cost) {
  if (exchangeConfirmInFlight) return;
  currentExchangeRewardId = rewardId;
  currentExchangeItem = itemName;
  currentExchangeCost = parseInt(cost, 10);
  document.getElementById("exTargetItem").innerText = itemName;
  document.getElementById("exTargetCost").innerText = cost + " 积分";

  const grid = document.getElementById("exStudentGrid");
  grid.innerHTML = getRankedStudentsByScore()
    .map((s) => {
      const hasEnough = s.pts >= currentExchangeCost;
      const q = s.name.replace(/'/g, "\\'");
      return `
      <div class="student-select-item ${hasEnough ? "" : "disabled"}" onclick="confirmExchange('${q}')">
        <img src="${petImg(s)}" class="student-select-avatar" alt="">
        <div class="student-select-name">${escapeHtml(s.name)}</div>
        <div class="student-select-pts ${hasEnough ? "" : "insufficient"}">现有: ${s.pts}</div>
      </div>
    `;
    })
    .join("");

  document.getElementById("exStudentModal").classList.add("active");
}

async function confirmExchange(studentName) {
  if (exchangeConfirmInFlight) return;
  const s = students.find((x) => x.name === studentName);
  if (!s || s.pts < currentExchangeCost) return;
  if (!runtimeState.token) {
    showDisplayToast("请先登录教师账号");
    return;
  }
  exchangeConfirmInFlight = true;
  const exchangeItem = currentExchangeItem;
  const exchangeCost = currentExchangeCost;
  const exchangeRewardId = currentExchangeRewardId;
  const confirmed = await showConfirmModal({
    tone: "warn",
    badge: "兑换确认",
    icon: "fa-gift",
    title: "确认兑换该礼品吗？",
    description: `${studentName} 将兑换「${exchangeItem}」。\n本次将扣除 ${exchangeCost} 积分。`,
    confirmText: "确认兑换",
  });
  if (!confirmed) {
    resetCurrentExchangeState();
    return;
  }

  try {
    await apiFetch("/reward-orders", {
      method: "POST",
      body: JSON.stringify({
        classId: runtimeState.classId,
        studentId: s.id,
        rewardId: exchangeRewardId,
        sourceTerminal: "display",
      }),
    });
    s.pts = Math.max(0, Number(s.pts || 0) - Number(exchangeCost || 0));
    reorderStudents();
    syncClassroomMeta();
    renderStudentGrid({ force: true });
    renderTodayRank();
    renderLeaderboardList();
    closeSelectStudentModal();
    showExchangeSuccess(exchangeItem, s.name, exchangeCost);
    await refreshDisplayDataAfterMutation({
      actionLabel: "兑换",
      failureMessage: "兑换已提交，但界面刷新失败，请检查网络连接后重试。",
    });
  } catch (error) {
    showDisplayToast(error.message || "兑换失败");
  } finally {
    exchangeConfirmInFlight = false;
  }
}

async function fetchLeaderboard(type = "score") {
  runtimeState.leaderboardType = type;
  runtimeState.leaderboardRows = await apiFetch(
    `/display/classes/${runtimeState.classId}/leaderboard?type=${type}`,
  ).then((data) => data.rows || []);
  renderLeaderboardList();
}

async function refreshUnlockStatus(options = {}) {
  const enforceRelogin = options.enforceRelogin !== false;
  if (!runtimeState.classId || !runtimeState.user) {
    runtimeState.lockStatus = "locked";
    runtimeState.unlockSessionId = null;
    runtimeState.unlockedUntil = null;
    applyLockOverlay();
    return;
  }
  const statusData = await apiFetch(
    `/display/unlock-status?classId=${runtimeState.classId}&displayTerminalCode=${encodeURIComponent(runtimeState.terminalCode)}`,
  );
  if (statusData.status !== "active") {
    if (enforceRelogin) {
      requireUnlockRelogin({
        preserveClassId: true,
        lockedAt: statusData.expiredAt || new Date().toISOString(),
        forceOverlay: false,
      });
    } else {
      runtimeState.lockStatus = "locked";
      runtimeState.unlockSessionId = statusData.unlockSessionId || null;
      runtimeState.unlockedUntil = statusData.expiredAt || null;
      runtimeState.lastUnlockRenewAt = 0;
      runtimeState.lastLockedAt =
        statusData.expiredAt || new Date().toISOString();
    }
    applyLockOverlay();
    return;
  }
  runtimeState.lockStatus = "active";
  runtimeState.unlockSessionId = statusData.unlockSessionId || null;
  runtimeState.unlockedUntil = statusData.expiredAt || null;
  runtimeState.lastUnlockRenewAt = Date.now();
  runtimeState.lastLockedAt = null;
  applyLockOverlay();
}

async function unlockDisplay() {
  if (!runtimeState.user) {
    dismissProfileOverlaysForAuthFlow();
    runtimeState.lockOverlayForced = true;
    navigateTo("login");
    applyLockOverlay();
    return;
  }
  const unlocked = await apiFetch("/display/unlock", {
    method: "POST",
    body: JSON.stringify({
      classId: runtimeState.classId,
      displayTerminalCode: runtimeState.terminalCode,
    }),
  });
  runtimeState.lockStatus = "active";
  runtimeState.unlockSessionId = unlocked.unlockSessionId || null;
  runtimeState.unlockedUntil = unlocked.expiredAt || null;
  runtimeState.lastUnlockRenewAt = Date.now();
  runtimeState.lastLockedAt = null;
  runtimeState.lockOverlayForced = false;
  applyLockOverlay();
}

async function lockDisplay() {
  if (!runtimeState.user || !runtimeState.classId) {
    runtimeState.lockOverlayForced = true;
    applyLockOverlay();
    return;
  }
  try {
    await apiFetch("/display/lock", {
      method: "POST",
      body: JSON.stringify({
        classId: runtimeState.classId,
        displayTerminalCode: runtimeState.terminalCode,
      }),
    });
  } catch (error) {
    console.error(error);
  }
  requireUnlockRelogin({
    preserveClassId: true,
    lockedAt: new Date().toISOString(),
    forceOverlay: false,
  });
  closePointModal();
  applyLockOverlay();
}

function handleLockPrimaryAction() {
  if (runtimeState.lockStatus === "active") {
    runtimeState.lockOverlayForced = false;
    applyLockOverlay();
    return;
  }
  dismissProfileOverlaysForAuthFlow();
  requireUnlockRelogin({
    preserveClassId: true,
    lockedAt: runtimeState.lastLockedAt || runtimeState.unlockedUntil,
    forceOverlay: true,
  });
  navigateTo("login");
}

function handleLockSecondaryAction() {
  if (runtimeState.user && runtimeState.lockStatus === "active") {
    showConfirmModal({
      tone: "danger",
      badge: "锁定确认",
      icon: "fa-lock",
      title: "确认立即锁定当前展示端吗？",
      description:
        "锁定后展示内容仍会保留，但如需继续操作，必须重新登录并解锁。",
      confirmText: "确认锁定",
    }).then((confirmed) => {
      if (confirmed) {
        lockDisplay();
      }
    });
    return;
  }
  if (runtimeState.lockOverlayForced) {
    runtimeState.lockOverlayForced = false;
    applyLockOverlay();
    return;
  }
  navigateTo("entry");
}

function handleTopAction() {
  if (runtimeState.user && runtimeState.lockStatus === "active") {
    showConfirmModal({
      tone: "danger",
      badge: "锁定确认",
      icon: "fa-lock",
      title: "确认立即锁定当前展示端吗？",
      description:
        "锁定后展示内容仍会保留，但如需继续操作，必须重新登录并解锁。",
      confirmText: "确认锁定",
    }).then((confirmed) => {
      if (confirmed) {
        lockDisplay();
      }
    });
    return;
  }
  handleLockPrimaryAction();
}

async function handleExitAction() {
  const confirmed = await showConfirmModal({
    tone: "danger",
    badge: "退出确认",
    icon: "fa-right-from-bracket",
    title: "确认退出当前账号吗？",
    description: "退出后将返回首页，后续如需教师操作，需要重新登录。",
    confirmText: "确认退出",
  });
  if (!confirmed) {
    return;
  }
  // 退出教师账号时只清登录/解锁态，不应抹掉终端已绑定的班级。
  // 否则多班教师下次登录会被误判为“未绑定终端”，进而弹出选班流程。
  clearAuthState({ preserveClassId: true });
  applyLockOverlay();
  navigateTo("entry");
}

function handleDesktopBubbleCommand(event) {
  const action = String(event?.detail?.action || "").trim();
  if (!action) return;

  if (action === "lock") {
    handleTopAction();
    return;
  }

  if (action === "logout") {
    handleExitAction();
  }
}

async function loadAvailableClasses() {
  const rows = await apiFetch("/classes");
  runtimeState.availableClasses = rows || [];
  return runtimeState.availableClasses;
}

function renderClassSelection(classes) {
  const grid = document.getElementById("classSelectGrid");
  if (!grid) return;
  grid.innerHTML = classes
    .map(
      (row) => `
          <div class="class-select-item" onclick="selectDisplayClass(${row.id})">
            <div class="class-select-name">${escapeHtml(row.gradeName || "")} ${escapeHtml(row.name)}</div>
            <div class="class-select-sub">班主任：${escapeHtml(row.homeroomTeacher?.name || "未设置")} ｜ 口号：${escapeHtml(row.slogan || "未设置")}</div>
          </div>`,
    )
    .join("");
  document.getElementById("classSelectModal")?.classList.add("active");
}

function cancelClassSelection() {
  document.getElementById("classSelectModal")?.classList.remove("active");
  clearAuthState({ preserveClassId: false });
  navigateTo("entry");
}

async function finalizeTeacherSession() {
  subscribeRealtimeRooms();
  setLoginMessage("登录成功，正在进入班级...", "success");
  await Promise.all([
    bootstrapDisplayData({
      authenticated: true,
      deferNonCritical: true,
      renderInitialViews: false,
    }),
    unlockDisplay(),
  ]);
  const card = document.querySelector(".login-card");
  card.style.transition =
    "transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease";
  card.style.transform = "scale(0.92) translateY(-10px)";
  card.style.opacity = "0";
  setTimeout(() => {
    card.style.transition = "none";
    card.style.transform = "";
    card.style.opacity = "";
    navigateTo("transition");
    setTimeout(() => startTransitionAnimation(), 80);
  }, 500);
}

async function selectDisplayClass(classId) {
  runtimeState.classId = Number(classId);
  window.DisplayRuntime.setDisplayClassId(runtimeState.classId);
  document.getElementById("classSelectModal")?.classList.remove("active");
  await finalizeTeacherSession();
}

function syncStudentCollection(studentRows, groups) {
  const groupMap = new Map();
  groups.forEach((group) => {
    (group.students || []).forEach((student) => {
      groupMap.set(student.id, {
        id: group.id,
        groupNo: group.groupNo,
        name: group.name,
      });
    });
  });
  runtimeState.groupMap = groupMap;

  const mapped = studentRows.map((row, index) => {
    const groupInfo = groupMap.get(row.id);
    return {
      id: row.id,
      name: row.name,
      petId: row.pet?.id ? String(row.pet.id).padStart(3, "0") : null,
      studentPetId: row.pet?.studentPetId || row.pet?.petId || null,
      petName: row.pet?.name || null,
      petNickname: row.pet?.nickname || null,
      lastRenameAt: row.pet?.lastRenameAt || null,
      equippedDecorations: row.pet?.equippedDecorations || [],
      ext:
        row.pet?.currentImageUrl?.split(".").pop() ||
        row.pet?.coverUrl?.split(".").pop() ||
        "jpg",
      lv: row.currentPetLevel || row.pet?.currentLevel || 1,
      pts: row.currentScore || 0,
      totalScore: row.totalScore || 0,
      medals: Number(row.honorsCount || row.profile?.honorsCount || 0),
      hasPet: !(!row.pet || !(row.pet.currentImageUrl || row.pet.coverUrl)),
      petImageUrl: row.pet?.currentImageUrl || row.pet?.coverUrl || null,
      petStageName: row.pet?.currentStageName || null,
      petTotalScore: row.pet?.totalScore || 0,
      avatarUrl: row.avatarUrl || null,
      group: groupInfo?.groupNo || null,
      groupName: groupInfo?.name || null,
      history: [],
    };
  });

  students.splice(0, students.length, ...mapped);
  reorderStudents();
  warmStudentPetImages(students);
}

function renderClassroomEntryViews(options = {}) {
  syncClassroomMeta();
  renderClassCountdown();
  if (!students.length) return;
  syncTodayStar();
  if (!isScoreVisualsPending()) {
    renderStudentGrid({ force: Boolean(options.force) });
    playPendingPetUpgradeAnimations();
    renderTodayRank();
    renderHonorFeed();
  }
  schedulePanoramaLayout();
}

async function loadDeferredDisplayData(authenticated) {
  if (!runtimeState.classId) return;
  if (runtimeState.deferredDisplayDataPromise) {
    return runtimeState.deferredDisplayDataPromise;
  }
  runtimeState.deferredDisplayDataPromise = (async () => {
    const [rewards] = await Promise.all([
      apiFetch(`/display/classes/${runtimeState.classId}/reward-center`).catch(
        () => ({ rewards: runtimeState.rewards || [] }),
      ),
      fetchAcademicGrowthData().catch(() => null),
      refreshMarquee().catch(() => {}),
      checkActiveCall().catch(console.warn),
    ]);

    runtimeState.rewards = rewards?.rewards || runtimeState.rewards || [];

    if (authenticated || runtimeState.petCatalog.length > 0) {
      const petCatalog = await apiFetch("/display/pet-catalog").catch(
        () => adoptPetCatalog,
      );
      runtimeState.petCatalog = normalizePetCatalog(petCatalog || []);
    }

    if (getActiveDisplayPage() === "page-exchange") {
      renderRewardCenter();
    } else {
      markPageStale("exchange");
    }

    if (getActiveDisplayPage() === "page-academic") {
      renderAcademicGrowth();
    }

    markPageStale("leaderboard");
  })().finally(() => {
    runtimeState.deferredDisplayDataPromise = null;
  });
  return runtimeState.deferredDisplayDataPromise;
}

function scheduleDeferredDisplayData(authenticated) {
  if (runtimeState.deferredDisplayDataTimer) {
    clearTimeout(runtimeState.deferredDisplayDataTimer);
  }
  runtimeState.deferredDisplayDataTimer = setTimeout(() => {
    runtimeState.deferredDisplayDataTimer = null;
    loadDeferredDisplayData(authenticated).catch((error) => {
      console.warn("延后加载展示数据失败", error);
    });
  }, 1200);
}

async function bootstrapDisplayData(options = {}) {
  const authenticated =
    options.authenticated ?? Boolean(runtimeState.token && runtimeState.user);
  const silent = options.silent ?? false;
  const deferNonCritical = Boolean(options.deferNonCritical);
  const renderInitialViews = options.renderInitialViews !== false;

  cancelPendingScoreGridReorder();

  try {
    if (!runtimeState.classId) {
      updateLockMeta([
        `当前终端：${escapeHtml(runtimeState.terminalCode)}`,
        "当前班级：未绑定",
      ]);
      return;
    }
    const home = await apiFetch(
      `/display/classes/${runtimeState.classId}/home`,
    );
    runtimeState.home = home;
    if (Array.isArray(home?.recentHonors)) {
      mergeRecentHonors(home.recentHonors);
      renderHonorFeed();
    }
    if (Array.isArray(home?.classHonors)) {
      mergeClassHonors(home.classHonors);
    }
    if (!deferNonCritical) {
      const rewards = await apiFetch(
        `/display/classes/${runtimeState.classId}/reward-center`,
      );
      runtimeState.rewards = rewards.rewards || [];
      await fetchAcademicGrowthData();
      if (authenticated || runtimeState.petCatalog.length > 0) {
        const petCatalog = await apiFetch("/display/pet-catalog").catch(
          () => adoptPetCatalog,
        );
        runtimeState.petCatalog = normalizePetCatalog(petCatalog || []);
      }
    }

    if (authenticated) {
      const [studentsData, groups, scoreRules] = await Promise.all([
        apiFetch(`/students?classId=${runtimeState.classId}`),
        apiFetch(`/classes/${runtimeState.classId}/groups`),
        apiFetch(
          `/score-rules?displayEnabled=true&scoreTarget=student&classId=${runtimeState.classId}`,
        ),
      ]);
      runtimeState.groups = groups || [];
      runtimeState.scoreRules = (scoreRules || []).filter(
        (rule) => rule && rule.scoreTarget !== "class",
      );
      syncStudentCollection(studentsData || [], runtimeState.groups);
      updateGroupToolbar();
      configureRuleButtons();
      await refreshUnlockStatus({
        enforceRelogin: false,
      }).catch(() => {
        runtimeState.lockStatus = "locked";
        applyLockOverlay();
      });
    } else {
      runtimeState.lockStatus = "locked";
      await refreshStudentRoster().catch(() => {});
    }

    if (!deferNonCritical) {
      await refreshMarquee().catch(() => {});
      await refreshClassHonors().catch(() => []);
    }

    syncClassroomMeta();
    syncDisplayHolidayState();
    renderClassCountdown();
    if (renderInitialViews) {
      syncTodayStar();
      if (!isScoreVisualsPending()) {
        renderStudentGrid();
        playPendingPetUpgradeAnimations();
        renderTodayRank();
        renderHonorFeed();
      }
    }
    if (!deferNonCritical) {
      renderRewardCenter();
      renderAcademicGrowth();
      await fetchLeaderboard(runtimeState.leaderboardType || "score");
      await checkActiveCall().catch(console.warn);
    } else {
      scheduleDeferredDisplayData(authenticated);
    }
    applyLockOverlay();
  } catch (error) {
    if (!silent) {
      console.error(error);
    }
    if (options.rethrow) {
      throw error;
    }
  }
}

async function handleLogin() {
  requestDisplayFullscreen();
  const username = document.getElementById("loginUsername")?.value?.trim();
  const password = document.getElementById("loginPassword")?.value || "";
  const loginBtn = document.querySelector(".login-btn");

  if (!username || !password) {
    setLoginMessage("请输入用户名和密码");
    return;
  }

  clearAuthState({ preserveClassId: true });
  setLoginMessage("");
  if (loginBtn) loginBtn.textContent = "登录中...";

  try {
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        terminalType: "display",
      }),
    });
    setPersistentToken(result.token);
    runtimeState.user = result.user;
    runtimeState.scopes = result.scopes || [];
    runtimeState.classAssignments = result.classAssignments || [];
    syncBottomUserName();
    const shouldStoreLoginCredentials = result.user?.roleCode !== "super_admin";

    if (runtimeState.classId) {
      if (!canCurrentUserAccessClass(runtimeState.classId)) {
        throw new Error("当前账号无权进入这块大屏绑定的班级");
      }
      if (shouldStoreLoginCredentials) {
        setStoredLoginCredentials(username, result.user?.name);
      }
      await finalizeTeacherSession();
    } else {
      const classScopeIds = getClassScopeIds();
      if (classScopeIds.length === 0) {
        throw new Error("当前账号未分配任何班级权限");
      }
      if (shouldStoreLoginCredentials) {
        setStoredLoginCredentials(username, result.user?.name);
      }
      if (classScopeIds.length === 1) {
        runtimeState.classId = classScopeIds[0];
        window.DisplayRuntime.setDisplayClassId(runtimeState.classId);
        await finalizeTeacherSession();
      } else {
        await loadAvailableClasses();
        const available = runtimeState.availableClasses.filter((item) =>
          classScopeIds.includes(Number(item.id)),
        );
        if (available.length === 1) {
          runtimeState.classId = Number(available[0].id);
          window.DisplayRuntime.setDisplayClassId(runtimeState.classId);
          await finalizeTeacherSession();
        } else {
          runtimeState.pendingLoginResult = result;
          renderClassSelection(available);
          setLoginMessage("请选择要进入的班级", "success");
        }
      }
    }
  } catch (error) {
    clearAuthState({ preserveClassId: true });
    setLoginMessage(error.message || "登录失败");
  } finally {
    clearDisplayPasswordInputs();
    if (loginBtn) loginBtn.textContent = "登 录";
  }
}

// ==================== 教室工具箱：课堂氛围仪式导演 ====================
const TOOLBOX_CONFIG = {
  home: {
    bg: "toolbox-bg-home",
    title: "教室工具箱",
    kicker: "CLASSROOM RITUAL DIRECTOR",
  },
  energy: {
    bg: "toolbox-bg-energy",
    title: "点燃课堂",
    kicker: "VOICE ENERGY RITUAL",
    primary: "开始点亮",
    running: "正在点亮",
  },
  garden: {
    bg: "toolbox-bg-garden",
    title: "安静下来",
    kicker: "QUIET GARDEN RITUAL",
    primary: "开始守护",
    running: "守护中",
  },
  lucky: {
    bg: "toolbox-bg-lucky",
    title: "随机抽取",
    kicker: "RANDOM SELECT RITUAL",
    primary: "开始抽取",
    running: "停止抽取",
  },
  timer: {
    bg: "toolbox-bg-timer",
    title: "倒计时",
    kicker: "COUNTDOWN RITUAL",
    primary: "开始倒计时",
    running: "倒计时中",
  },
};

const TOOLBOX_MODE_ASSETS = {
  home: {
    backgrounds: ["images/toolbox/toolbox-energy-bg.webp"],
    decos: [
      ".toolbox-deco-orb",
      ".toolbox-deco-sparkles",
      ".toolbox-deco-flower",
      ".toolbox-deco-butterfly",
      ".toolbox-deco-ticket",
      ".toolbox-deco-ribbon",
      ".toolbox-deco-hourglass",
      ".toolbox-deco-timer-stars",
    ],
  },
  energy: {
    backgrounds: ["images/toolbox/toolbox-energy-bg.webp"],
    decos: [".toolbox-deco-orb", ".toolbox-deco-sparkles"],
  },
  garden: {
    backgrounds: ["images/toolbox/toolbox-garden-bg.webp"],
    decos: [".toolbox-deco-flower", ".toolbox-deco-butterfly"],
  },
  lucky: {
    backgrounds: ["images/toolbox/toolbox-lucky-bg.webp"],
    decos: [".toolbox-deco-ticket", ".toolbox-deco-ribbon"],
  },
  timer: {
    backgrounds: ["images/toolbox/toolbox-timer-bg.webp"],
    decos: [".toolbox-deco-hourglass", ".toolbox-deco-timer-stars"],
  },
};

const preloadedToolboxAssets = new Set();

function preloadToolboxModeAssets(mode) {
  const assets = TOOLBOX_MODE_ASSETS[mode] || TOOLBOX_MODE_ASSETS.home;
  assets.backgrounds.forEach((src) => {
    if (!src || preloadedToolboxAssets.has(src)) return;
    preloadedToolboxAssets.add(src);
    const image = new Image();
    image.decoding = "async";
    image.src = src;
  });
  assets.decos.forEach((selector) => {
    document.querySelectorAll(selector).forEach((img) => {
      if (!(img instanceof HTMLImageElement)) return;
      const src = img.dataset.src;
      if (src && !img.src) {
        img.src = src;
      }
    });
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value == null ? "" : String(value);
}

function toolboxState() {
  return runtimeState.toolbox;
}

function initToolboxPage() {
  syncToolboxGroupOptions();
  syncToolboxSettingsInputs();
  openToolboxHome({ silent: true });
  renderEnergyToolbox();
  initGardenFlora();
  renderGardenToolbox(false);
  renderLuckyToolbox();
  renderToolboxTimer();
}

function stopEnergyTool(options = {}) {
  const state = toolboxState();
  if (!state.energyRunning && !state.paused && options.silent) return;

  const score = state.energyMode === "cheer" ? Math.min(100, state.energyPeak) : state.energyScore;
  const level = resolveEnergyLevel(score);

  state.energyRunning = false;
  state.paused = false;
  cancelToolboxAudioLoop();
  if (!options.silent) {
    setToolboxResult("toolboxEnergyResult", buildEnergyResultText());
    stopToolboxAudio();

    let scoreToShow = score;
    let customFeedback = "";
    if (state.energyMode === "pk") {
      const left = state.energyPkScoreLeft || 0;
      const right = state.energyPkScoreRight || 0;
      scoreToShow = Math.max(left, right);
      if (left > right) {
        customFeedback = `【${level}】PK 战况：第 1 组以 ${left} 分险胜第 2 组的 ${right} 分！第 1 组表现太精彩了！`;
      } else if (right > left) {
        customFeedback = `【${level}】PK 战况：第 2 组以 ${right} 分险胜第 1 组 of ${left} 分！第 2 组表现太精彩了！`;
      } else {
        customFeedback = `【${level}】PK 战况：双方声浪不相上下，以 ${left} 分握手言和！真是棋逢对手！`;
      }
    }

    showEnergyResultOverlay(scoreToShow, level, customFeedback);
  }
  syncToolboxPrimaryButton();
}

function showEnergyResultOverlay(score, level, customFeedback) {
  const scoreEl = document.getElementById("energyResultScore");
  const feedbackEl = document.getElementById("energyResultFeedback");
  const overlay = document.getElementById("toolboxEnergyResultOverlay");
  
  if (scoreEl) scoreEl.textContent = String(score);
  if (feedbackEl) {
    if (customFeedback) {
      feedbackEl.textContent = customFeedback;
    } else {
      let feedback = "";
      if (score >= 95) {
        feedback = `【${level}】全班星光爆发！本轮声浪活力斩获了不可思议的 ${score} 分！这一下，课堂真的被彻底点燃了！`;
      } else if (score >= 85) {
        feedback = `【${level}】全班默契共振！本轮声浪活力获得了极高评价的 ${score} 分，凝聚力十分强大！`;
      } else if (score >= 70) {
        feedback = `【${level}】星光能量升起！本轮声浪获得了优秀的 ${score} 分，继续加油，向更高的星光发起挑战！`;
      } else {
        feedback = `【${level}】本轮声浪积攒了 ${score} 分，期待下一次更响亮的点亮仪式，让我们一起照亮课堂！`;
      }
      feedbackEl.textContent = feedback;
    }
  }
  
  if (overlay) {
    overlay.style.display = "flex";
  }
}

function setToolboxBackground(mode) {
  const page = document.getElementById("page-toolbox");
  const bg = document.getElementById("toolboxBg");
  const config = TOOLBOX_CONFIG[mode] || TOOLBOX_CONFIG.home;
  preloadToolboxModeAssets(mode);
  if (page) {
    page.dataset.toolboxMode = mode;
    page.dataset.toolboxView = mode === "home" ? "home" : "immersive";
  }
  if (bg) {
    bg.className = `toolbox-bg ${config.bg}`;
  }
}

function isToolboxAudioTool(tool = toolboxState().activeTool) {
  return tool === "energy" || tool === "garden";
}

function isToolboxAudioRunning() {
  const state = toolboxState();
  return isToolboxAudioTool(state.activeTool) && (state.energyRunning || state.gardenRunning || state.paused);
}

function syncToolboxRunningChrome() {
  const page = document.getElementById("page-toolbox");
  if (!page) return;
  const state = toolboxState();
  const audioRunning = isToolboxAudioRunning();
  page.classList.toggle("toolbox-audio-running", audioRunning);
  page.classList.toggle("toolbox-paused", Boolean(state.paused || state.timerPaused));
  page.classList.toggle("toolbox-energy-running", state.activeTool === "energy" && audioRunning);
  page.classList.toggle("toolbox-garden-running", state.activeTool === "garden" && audioRunning);
  syncDesktopFloatingBallStatus();
}

function openToolboxHome(options = {}) {
  cleanupToolboxRuntime({ keepTimer: false });
  const state = toolboxState();
  state.activeMode = "home";
  state.activeTool = null;
  state.isImmersive = false;
  state.paused = false;
  
  Object.assign(state.settings, {
    energyMode: "reading",
    energyTarget: 90,
    energyDuration: 0,
    gardenTarget: 0,
    gardenThreshold: 34,
    luckyScope: "class",
    luckyGroupNo: "",
    luckyRepeat: false,
    luckyExcludedIds: [],
    timerDuration: 300,
  });
  state.luckyScope = "class";
  state.luckyExcludedIds.clear();
  syncToolboxSettingsInputs();

  setToolboxBackground("home");
  document.getElementById("toolboxHome")?.classList.add("active");
  document.getElementById("toolboxImmersive")?.classList.remove("active");
  document.querySelectorAll(".toolbox-scene").forEach((scene) => {
    scene.classList.remove("active");
  });
  syncToolboxRunningChrome();
  if (!options.silent) {
    showDisplayToast("已回到教室工具箱", { duration: 1200 });
  }
}

function enterToolboxTool(tool, options = {}) {
  const nextTool = TOOLBOX_CONFIG[tool] ? tool : "energy";
  const state = toolboxState();
  cleanupToolboxRuntime({ keepTimer: false });
  state.activeMode = nextTool;
  state.activeTool = nextTool;
  state.isImmersive = true;
  state.paused = false;
  setToolboxBackground(nextTool);
  document.getElementById("toolboxHome")?.classList.remove("active");
  document.getElementById("toolboxImmersive")?.classList.add("active");
  document.querySelectorAll(".toolbox-scene").forEach((scene) => {
    scene.classList.toggle("active", scene.dataset.toolboxScene === nextTool);
  });
  setText("toolboxLiveKicker", TOOLBOX_CONFIG[nextTool].kicker);
  setText("toolboxLiveTitle", TOOLBOX_CONFIG[nextTool].title);
  syncToolboxPrimaryButton();
  if (nextTool === "lucky") {
    renderLuckyToolbox();
  } else if (nextTool === "timer") {
    resetToolboxTimer({ silent: true });
    initTimerPickers();
  }
  syncToolboxRunningChrome();
}

function exitToolboxImmersive() {
  openToolboxHome();
}

function switchToolboxMode(mode, options = {}) {
  if (mode === "home") {
    openToolboxHome(options);
    return;
  }
  enterToolboxTool(mode, options);
}

function syncToolboxPrimaryButton() {
  const state = toolboxState();
  const config = TOOLBOX_CONFIG[state.activeTool] || TOOLBOX_CONFIG.energy;
  const primary = document.getElementById("toolboxPrimaryBtn");
  const reset = document.getElementById("toolboxResetBtn");
  const pause = document.getElementById("toolboxPauseBtn");
  const audioToolActive = isToolboxAudioTool(state.activeTool);
  const audioRunning = isToolboxAudioRunning();

  const modeTip = document.getElementById("toolboxEnergyModeTip");
  if (modeTip) {
    if (state.activeTool === "energy") {
      const modeText = state.energyMode === "pk" ? "小组 PK" : "自由朗读";
      const modeTextEl = document.getElementById("toolboxEnergyModeTipText");
      if (modeTextEl) modeTextEl.textContent = `当前模式：${modeText}`;
      modeTip.style.display = "inline-flex";
    } else {
      modeTip.style.display = "none";
    }
  }

  if (primary) {
    primary.classList.remove("timer-icon-btn");
    const running =
      state.energyRunning || state.gardenRunning || state.luckyRolling || state.timerRunning;
    if (state.activeTool === "timer") {
      if (state.timerFinishedAlerting) {
        primary.classList.add("timer-icon-btn");
        primary.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
      } else if (state.timerRunning) {
        primary.textContent = "暂停";
      } else if (state.timerPaused) {
        primary.textContent = "继续";
      } else {
        primary.textContent = config.primary;
      }
    } else if (audioToolActive && audioRunning) {
      primary.textContent = state.paused ? "继续" : "暂停";
    } else {
      primary.textContent = running ? config.running : config.primary;
    }
    primary.disabled = (state.activeTool === "lucky") ? false : state.luckyRolling;
  }
  const luckyResetBtn = document.getElementById("toolboxLuckyResetBtn");
  if (luckyResetBtn) {
    luckyResetBtn.style.display = state.activeTool === "lucky" ? "" : "none";
  }

  if (reset) {
    reset.classList.remove("timer-icon-btn");
    if (state.activeTool === "lucky") {
      reset.style.display = "none";
    } else if (state.activeTool === "timer") {
      if (state.timerFinishedAlerting) {
        reset.style.display = "";
        reset.classList.add("timer-icon-btn");
        reset.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      } else {
        const isTimerActive = state.timerRunning || state.timerPaused;
        reset.style.display = isTimerActive ? "" : "none";
        reset.textContent = "取消";
      }
    } else {
      reset.style.display = "";
      if (audioToolActive && audioRunning) {
        reset.textContent = "结束";
      } else if (audioToolActive) {
        reset.textContent = "结束";
      } else {
        reset.textContent = "重置";
      }
    }
  }
  if (pause) {
    pause.style.display = "none";
  }
  syncToolboxRunningChrome();

  const pkBtn = document.getElementById("toolboxEnergyPkBtn");
  if (pkBtn) {
    const isEnergyReady = state.activeTool === "energy" && !state.energyRunning && !state.paused;
    pkBtn.style.display = isEnergyReady ? "" : "none";
  }

  // 控制右下角返回/设置栏在点击开始运行后自动隐藏
  const running =
    state.energyRunning || state.gardenRunning || state.luckyRolling || state.timerRunning;
  const isTimerActive = state.timerRunning || state.timerPaused || state.timerFinishedAlerting;
  const shouldHideActions = running || audioRunning || isTimerActive;
  const actionsEl = document.getElementById("toolboxImmersiveActions");
  if (actionsEl) {
    actionsEl.style.display = shouldHideActions ? "none" : "flex";
  }
}

async function startEnergyPkAction() {
  setEnergyMode("pk");
  await startEnergyTool();
}

function runToolboxPrimaryAction() {
  const state = toolboxState();
  const tool = state.activeTool;
  if (tool === "energy") {
    if (state.energyRunning || state.paused) {
      toggleToolboxPause();
      return;
    }
    setEnergyMode("reading");
    startEnergyTool();
  } else if (tool === "garden") {
    if (state.gardenRunning || state.paused) {
      toggleToolboxPause();
      return;
    }
    startGardenTool();
  } else if (tool === "lucky") {
    if (state.luckyRolling) {
      stopLuckyDrawWithWinner();
    } else {
      drawLuckyStudent();
    }
  } else if (tool === "timer") {
    if (state.timerFinishedAlerting) {
      stopTimerAlertLoop();
      state.timerFinishedAlerting = false;
      document.getElementById("toolboxTimerDisplay")?.classList.remove("finished");
      startToolboxTimer();
    } else if (state.timerRunning) {
      pauseToolboxTimer();
    } else {
      startToolboxTimer();
    }
  }
}

function toggleToolboxPause() {
  const state = toolboxState();
  if (state.activeTool === "timer") {
    if (state.timerRunning) {
      pauseToolboxTimer();
    } else if (state.timerPaused) {
      startToolboxTimer();
    }
    return;
  }
  if (state.activeTool === "energy") {
    state.paused = !state.paused;
    state.energyRunning = !state.paused;
    setToolboxResult(
      "toolboxEnergyResult",
      state.paused ? "声浪仪式已暂停，点击继续重新点亮。" : "继续点亮星光。",
    );
  } else if (state.activeTool === "garden") {
    state.paused = !state.paused;
    state.gardenRunning = !state.paused;
    state.gardenLastTick = performance.now();
    setToolboxResult(
      "toolboxGardenResult",
      state.paused ? "花园守护已暂停。" : "继续守护安静花园。",
    );
  }
  syncToolboxPrimaryButton();
}

function resetActiveToolboxTool() {
  const state = toolboxState();
  const tool = state.activeTool;
  if (tool === "energy") {
    if (state.energyRunning || state.paused) {
      endAudioToolboxTool();
      return;
    }
    exitToolboxImmersive();
  } else if (tool === "garden") {
    if (state.gardenRunning || state.paused) {
      endAudioToolboxTool();
      return;
    }
    exitToolboxImmersive();
  } else if (tool === "lucky") {
    resetLuckyTool();
  } else if (tool === "timer") {
    if (state.timerFinishedAlerting) {
      stopTimerAlertLoop();
      state.timerFinishedAlerting = false;
      document.getElementById("toolboxTimerDisplay")?.classList.remove("finished");
      resetToolboxTimer();
    } else {
      resetToolboxTimer();
    }
  }
}

function endAudioToolboxTool() {
  const state = toolboxState();
  if (state.activeTool === "energy") {
    stopEnergyTool();
  } else if (state.activeTool === "garden") {
    stopGardenTool();
  }
  syncToolboxPrimaryButton();
}

function cleanupToolboxRuntime(options = {}) {
  const resultOverlay = document.getElementById("toolboxEnergyResultOverlay");
  if (resultOverlay) {
    resultOverlay.style.display = "none";
  }
  const gardenResultOverlay = document.getElementById("toolboxGardenResultOverlay");
  if (gardenResultOverlay) {
    gardenResultOverlay.style.display = "none";
  }

  stopEnergyTool({ silent: true });
  stopGardenTool({ silent: true });
  stopToolboxAudio();
  stopLuckyRoll();
  if (!options.keepTimer) {
    stopToolboxTimerRAF();
    const state = toolboxState();
    state.timerRunning = false;
    state.timerPaused = false;
    stopTimerAlertLoop();
    state.timerFinishedAlerting = false;
  }
  syncToolboxPrimaryButton();
}

function syncToolboxGroupOptions() {
  const groupOptions = getToolboxGroupOptions();
  const select = document.getElementById("toolboxLuckyGroupSelect");
  if (!select) return;
  const current = select.value || toolboxState().settings.luckyGroupNo;
  select.innerHTML =
    groupOptions
      .map(
        (group) =>
          `<option value="${escapeHtml(String(group.groupNo))}">${escapeHtml(group.name)}</option>`,
      )
      .join("") || '<option value="">暂无小组</option>';
  if (current && [...select.options].some((option) => option.value === String(current))) {
    select.value = String(current);
  }
}

function syncToolboxSettingsInputs() {
  const state = toolboxState();
  const settings = state.settings;
  const mappings = [
    ["toolboxEnergyModeSelect", settings.energyMode],
    ["toolboxEnergyTarget", settings.energyTarget],
    ["toolboxEnergyDuration", settings.energyDuration ? settings.energyDuration / 60 : 0],
    ["toolboxGardenTarget", settings.gardenTarget !== undefined && settings.gardenTarget !== null ? settings.gardenTarget / 60 : 0],
    ["toolboxGardenThreshold", settings.gardenThreshold],
    ["toolboxLuckyScopeSelect", settings.luckyScope],
    ["toolboxLuckyGroupSelect", settings.luckyGroupNo],
    ["toolboxTimerCustom", ""],
  ];
  mappings.forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input && value !== "") input.value = value;
  });
  const repeat = document.getElementById("toolboxLuckyRepeat");
  if (repeat) repeat.checked = Boolean(settings.luckyRepeat);
  renderLuckyExcludeList();
  const groupSelectContainer = document.getElementById("toolboxLuckyGroupSelectContainer");
  if (groupSelectContainer) {
    if (settings.luckyScope === "group") {
      groupSelectContainer.style.setProperty("display", "grid", "important");
    } else {
      groupSelectContainer.style.setProperty("display", "none", "important");
    }
  }

  const thresholdLabel = getGardenThresholdLabel(settings.gardenThreshold || 34);
  setText("toolboxGardenDifficulty", thresholdLabel);
}

function readToolboxSettings() {
  const state = toolboxState();
  const settings = state.settings;
  settings.energyMode = document.getElementById("toolboxEnergyModeSelect")?.value || settings.energyMode;
  settings.energyTarget = Number(document.getElementById("toolboxEnergyTarget")?.value || settings.energyTarget);
  settings.energyDuration = Math.max(0, Number(document.getElementById("toolboxEnergyDuration")?.value || 0)) * 60;
  settings.gardenTarget = Number(document.getElementById("toolboxGardenTarget")?.value ?? 0) * 60;
  settings.gardenThreshold = Number(document.getElementById("toolboxGardenThreshold")?.value || settings.gardenThreshold);
  settings.luckyScope = document.getElementById("toolboxLuckyScopeSelect")?.value || settings.luckyScope;
  settings.luckyGroupNo = document.getElementById("toolboxLuckyGroupSelect")?.value || settings.luckyGroupNo;
  settings.luckyRepeat = Boolean(document.getElementById("toolboxLuckyRepeat")?.checked);
  settings.luckyExcludedIds = [...state.luckyExcludedIds];
  state.energyMode = settings.energyMode;
  state.luckyScope = settings.luckyScope;

  const thresholdLabel = getGardenThresholdLabel(settings.gardenThreshold || 34);
  setText("toolboxGardenDifficulty", thresholdLabel);

  return settings;
}

function openToolboxSettings() {
  const state = toolboxState();
  const tool = state.activeTool || "energy";
  const overlay = document.getElementById("toolboxSettingsOverlay");
  syncToolboxGroupOptions();
  syncToolboxSettingsInputs();
  if (overlay) {
    overlay.dataset.tool = tool;
    overlay.classList.add("active");
  }
  const titles = {
    energy: "点燃课堂设置：只调整声浪目标和可选限时",
    garden: "安静下来设置：只调整守护时间",
    lucky: "随机抽取设置：只调整抽取范围",
    timer: "倒计时设置：只调整自定义时长",
  };
  setText("toolboxSettingsTitle", titles[tool] || "默认一键可用，这里只给需要微调的老师。");
  if (tool === "lucky") {
    renderLuckyExcludeList();
  }
}

function closeToolboxSettings(event) {
  if (event?.target && event.target !== document.getElementById("toolboxSettingsOverlay")) {
    return;
  }
  readToolboxSettings();
  document.getElementById("toolboxSettingsOverlay")?.classList.remove("active");
}

function getToolboxGroupOptions() {
  const byNo = new Map();
  (runtimeState.groups || []).forEach((group) => {
    const groupNo = Number(group.groupNo ?? group.id);
    if (!Number.isFinite(groupNo) || groupNo <= 0) return;
    byNo.set(groupNo, {
      groupNo,
      name: group.name || `第${groupNo}组`,
    });
  });
  students.forEach((student) => {
    const groupNo = Number(student.group);
    if (!Number.isFinite(groupNo) || groupNo <= 0) return;
    if (!byNo.has(groupNo)) {
      byNo.set(groupNo, {
        groupNo,
        name: student.groupName || `第${groupNo}组`,
      });
    }
  });
  return [...byNo.values()].sort((a, b) => a.groupNo - b.groupNo);
}

function getToolboxStudentsByScope(scope, groupNo) {
  if (scope === "group") {
    const target = Number(groupNo);
    return students.filter((student) => Number(student.group) === target);
  }
  return students.slice();
}

function luckyStudentKey(student) {
  if (!student) return "";
  const raw = student.id !== undefined && student.id !== null ? student.id : student.name;
  return String(raw || "");
}

function luckyStudentKeyForInlineHandler(student) {
  return encodeURIComponent(luckyStudentKey(student));
}

function isLuckyStudentExcluded(student) {
  const key = luckyStudentKey(student);
  return Boolean(key && toolboxState().luckyExcludedIds.has(key));
}

function getLuckyScopedStudentsForSettings() {
  const state = toolboxState();
  const groupNo =
    state.settings.luckyGroupNo ||
    document.getElementById("toolboxLuckyGroupSelect")?.value;
  return getToolboxStudentsByScope(state.settings.luckyScope, groupNo);
}

function getLuckyExcludedCountInScope(scope, groupNo) {
  return getToolboxStudentsByScope(scope, groupNo).filter(isLuckyStudentExcluded)
    .length;
}

function renderLuckyExcludeList() {
  const list = document.getElementById("toolboxLuckyExcludeList");
  if (!list) return;
  const scopedStudents = getLuckyScopedStudentsForSettings();
  if (!scopedStudents.length) {
    list.innerHTML =
      '<div class="toolbox-lucky-exclude-empty">当前抽选范围暂无学生</div>';
    return;
  }
  const excludedCount = scopedStudents.filter(isLuckyStudentExcluded).length;
  const summary = `<div class="toolbox-lucky-exclude-summary">当前范围 ${scopedStudents.length} 人，已排除 ${excludedCount} 人</div>`;
  const rows = scopedStudents
    .map((student) => {
      const key = luckyStudentKey(student);
      const checked = isLuckyStudentExcluded(student) ? " checked" : "";
      return `
        <label class="toolbox-lucky-exclude-item">
          <span>
            ${buildLuckyAvatarMarkup(student, "toolbox-lucky-exclude-avatar")}
            <b>${escapeHtml(student.name)}</b>
            <em>${escapeHtml(student.groupName || (student.group ? `第${student.group}组` : "未分组"))}</em>
          </span>
          <input
            type="checkbox"
            value="${escapeHtml(key)}"
            ${checked}
            onchange="toggleLuckyExcludedStudent(this.value, this.checked)"
          />
        </label>`;
    })
    .join("");
  list.innerHTML = summary + rows;
}

function toggleLuckyExcludedStudent(key, excluded) {
  const state = toolboxState();
  const safeKey = String(key || "");
  if (!safeKey) return;
  if (excluded) {
    state.luckyExcludedIds.add(safeKey);
  } else {
    state.luckyExcludedIds.delete(safeKey);
  }
  state.settings.luckyExcludedIds = [...state.luckyExcludedIds];
  state.luckyDrawnIds.delete(safeKey);
  if (state.luckySelected && luckyStudentKey(state.luckySelected) === safeKey) {
    state.luckySelected = null;
  }
  state.luckyHistory = state.luckyHistory.filter(
    (student) => luckyStudentKey(student) !== safeKey,
  );
  renderLuckyExcludeList();
  renderLuckyToolbox();
}

function clearLuckyExcludedStudents() {
  const state = toolboxState();
  state.luckyExcludedIds.clear();
  state.settings.luckyExcludedIds = [];
  renderLuckyExcludeList();
  renderLuckyToolbox();
}

function syncDesktopFloatingBallStatus() {
  if (
    window.displayDesktop?.isDesktop !== true ||
    typeof window.displayDesktop.setFloatingBallStatus !== "function"
  ) {
    return;
  }

  const state = toolboxState();
  let payload = null;

  if (
    (state.activeTool === "energy" && (state.energyRunning || state.paused)) ||
    (state.activeTool === "garden" && (state.gardenRunning || state.paused))
  ) {
    const db = state.activeTool === "energy" ? state.energyDb : state.gardenDb;
    payload = {
      value: db == null ? "--" : String(Math.max(0, Math.round(db))),
      unit: "dB",
      label: state.activeTool === "energy" ? "点燃" : "安静",
    };
  } else if (
    state.activeTool === "timer" &&
    (state.timerRunning || state.timerPaused || state.timerFinishedAlerting)
  ) {
    payload = {
      value: formatTimerMs(
        Math.max(0, state.timerRemainingMs ?? state.timerDurationMs ?? 0),
      ),
      unit: "",
      label: "计时",
    };
  }

  window.displayDesktop.setFloatingBallStatus(payload).catch(() => {});
}

function describeToolboxAudioError(error) {
  const name = String(error?.name || "");
  const message = String(error?.message || "");
  const text = `${name} ${message}`.toLowerCase();

  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    text.includes("requested device not found") ||
    text.includes("device not found") ||
    text.includes("no audio input")
  ) {
    return "没有检测到麦克风输入设备。请检查大屏电脑是否已插入或启用麦克风，并在 Windows 声音设置中确认输入设备可用。";
  }

  if (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    name === "SecurityError" ||
    text.includes("permission") ||
    text.includes("denied")
  ) {
    return "麦克风权限被系统或浏览器拦截。请在 Windows“设置 > 隐私和安全性 > 麦克风”中允许桌面应用访问麦克风，然后重新打开本工具。";
  }

  if (
    name === "NotReadableError" ||
    name === "TrackStartError" ||
    text.includes("could not start") ||
    text.includes("in use") ||
    text.includes("busy")
  ) {
    return "麦克风暂时无法启动，可能正被其他程序占用。请关闭会议软件、录音软件或浏览器页面后重试。";
  }

  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
    return "当前麦克风不支持所需采样配置。请更换输入设备，或重启应用后再试。";
  }

  if (name === "AbortError") {
    return "麦克风启动被系统中断，请稍后重试。";
  }

  return message || "无法启动麦克风，请检查设备连接和系统权限。";
}

async function ensureToolboxAudio() {
  const state = toolboxState();
  if (state.audioStream && state.analyser && state.audioData) {
    return state;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("当前浏览器不支持麦克风能力");
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
  } catch (error) {
    if (error?.name === "OverconstrainedError" || error?.name === "ConstraintNotSatisfiedError") {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (fallbackError) {
        throw new Error(describeToolboxAudioError(fallbackError));
      }
    } else {
      throw new Error(describeToolboxAudioError(error));
    }
  }
  if (!stream.getAudioTracks().length) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error("没有检测到麦克风输入设备。请检查大屏电脑是否已插入或启用麦克风。");
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error("当前浏览器不支持 AudioContext");
  }
  const context = new AudioCtx();
  if (context.state === "suspended") {
    await context.resume().catch(() => {});
  }
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.78;
  source.connect(analyser);
  state.audioStream = stream;
  state.audioContext = context;
  state.analyser = analyser;
  state.audioData = new Uint8Array(analyser.fftSize);
  return state;
}

function startToolboxAudioLoop(onSample) {
  const state = toolboxState();
  cancelToolboxAudioLoop();
  state.audioRenderLastAt = 0;
  const tick = () => {
    if (!state.analyser || !state.audioData) return;
    const now = performance.now();
    state.analyser.getByteTimeDomainData(state.audioData);
    let sum = 0;
    for (let i = 0; i < state.audioData.length; i += 1) {
      const centered = (state.audioData[i] - 128) / 128;
      sum += centered * centered;
    }
    const rms = Math.sqrt(sum / state.audioData.length);
    const level = Math.max(0, Math.min(100, Math.round(rms * 260)));
    state.audioLevel = Math.round(state.audioLevel * 0.68 + level * 0.32);
    onSample(state.audioLevel, now);
    state.audioRAF = requestAnimationFrame(tick);
  };
  state.audioRAF = requestAnimationFrame(tick);
}

function shouldRenderToolboxAudioFrame(state, now) {
  const minInterval = isStandardDisplay() ? 96 : 72;
  if (!state.audioRenderLastAt || now - state.audioRenderLastAt >= minInterval) {
    state.audioRenderLastAt = now;
    return true;
  }
  return false;
}

function cancelToolboxAudioLoop() {
  const state = toolboxState();
  if (state.audioRAF) {
    cancelAnimationFrame(state.audioRAF);
    state.audioRAF = null;
  }
}

function stopToolboxAudio() {
  const state = toolboxState();
  cancelToolboxAudioLoop();
  if (state.audioStream) {
    state.audioStream.getTracks().forEach((track) => track.stop());
    state.audioStream = null;
  }
  if (state.audioContext) {
    const closePromise = state.audioContext.close?.();
    closePromise?.catch?.(() => {});
    state.audioContext = null;
  }
  state.analyser = null;
  state.audioData = null;
  state.audioLevel = 0;
  state.audioRenderLastAt = 0;
}

function setEnergyMode(mode) {
  const state = toolboxState();
  const next = ["reading", "pk", "cheer"].includes(mode) ? mode : "reading";
  state.energyMode = next;
  state.settings.energyMode = next;
  const select = document.getElementById("toolboxEnergyModeSelect");
  if (select) select.value = next;
  resetEnergyTool();
}

async function startEnergyTool() {
  const state = toolboxState();
  readToolboxSettings();
  if (state.activeTool !== "energy") {
    enterToolboxTool("energy", { silent: true });
  }
  try {
    await ensureToolboxAudio();
    state.paused = false;
    state.energyRunning = true;
    state.energySamples = [];
    state.energyDb = null;
    state.energyStartedAt = performance.now();
    state.energyLastTick = performance.now();
    state.statsHighestDb = null;
    state.statsLowestDb = null;
    state.statsTimeAbove = 0;
    state.statsTimeBelow = 0;
    document.getElementById("toolboxLiveStage")?.classList.add("energy-awake");
    setToolboxResult("toolboxEnergyResult", "星光正在听见全班的声音。系统只计算能量，不录音、不上传。");
    startToolboxAudioLoop((level) => updateEnergySample(level));
  } catch (error) {
    state.energyRunning = false;
    setToolboxResult("toolboxEnergyResult", error.message || "无法启动麦克风", true);
  }
  syncToolboxPrimaryButton();
}

function updateEnergySample(level, now = performance.now()) {
  const state = toolboxState();
  if (!state.energyRunning || state.paused) return;
  const delta = Math.max(0, (now - (state.energyLastTick || now)) / 1000);
  state.energyLastTick = now;
  state.energyDb = Math.round(38 + Math.max(0, Math.min(100, level)) * 0.55);
  
  if (state.statsHighestDb === null || state.energyDb > state.statsHighestDb) state.statsHighestDb = state.energyDb;
  if (state.statsLowestDb === null || state.energyDb < state.statsLowestDb) state.statsLowestDb = state.energyDb;
  const targetDb = Number(state.settings.energyTarget || 90);
  if (state.energyDb >= targetDb) {
    state.statsTimeAbove += delta;
  } else {
    state.statsTimeBelow += delta;
  }

  state.energySamples.push(level);
  if (state.energySamples.length > 600) state.energySamples.shift();
  const avg =
    state.energySamples.reduce((sum, item) => sum + item, 0) /
    Math.max(1, state.energySamples.length);
  const score =
    state.energyMode === "cheer"
      ? Math.max(state.energyPeak, level)
      : Math.max(0, Math.min(100, Math.round(avg * 1.28)));
  state.energyScore = Math.max(0, Math.min(100, Math.round(score)));
  state.energyPeak = Math.max(state.energyPeak, level);

  if (state.energyMode === "pk") {
    const biasLeft = (Math.random() - 0.48) * 8;
    const biasRight = (Math.random() - 0.48) * 8;
    state.energyPkScoreLeft = Math.max(0, Math.min(100, Math.round(state.energyScore + biasLeft)));
    state.energyPkScoreRight = Math.max(0, Math.min(100, Math.round(state.energyScore + biasRight)));
  }

  const durationSeconds = Number(state.settings.energyDuration || 0);
  const timedOut =
    durationSeconds > 0 && now - state.energyStartedAt >= durationSeconds * 1000;
  if (shouldRenderToolboxAudioFrame(state, now) || timedOut) {
    renderEnergyToolbox();
  }
  if (timedOut) {
    stopEnergyTool();
    setToolboxResult("toolboxEnergyResult", "限时声浪挑战结束。");
  }
}

function stopEnergyTool(options = {}) {
  const state = toolboxState();
  if (!state.energyRunning && !state.paused && options.silent) return;

  const score = state.energyMode === "cheer" ? Math.min(100, state.energyPeak) : state.energyScore;
  const level = resolveEnergyLevel(score);

  state.energyRunning = false;
  state.paused = false;
  cancelToolboxAudioLoop();
  if (!options.silent) {
    setToolboxResult("toolboxEnergyResult", buildEnergyResultText());
    stopToolboxAudio();

    let scoreToShow = score;
    let customFeedback = "";
    if (state.energyMode === "pk") {
      const left = state.energyPkScoreLeft || 0;
      const right = state.energyPkScoreRight || 0;
      scoreToShow = Math.max(left, right);
      if (left > right) {
        customFeedback = `【${level}】PK 战况：第 1 组以 ${left} 分险胜第 2 组的 ${right} 分！第 1 组表现太精彩了！`;
      } else if (right > left) {
        customFeedback = `【${level}】PK 战况：第 2 组以 ${right} 分险胜第 1 组 of ${left} 分！第 2 组表现太精彩了！`;
      } else {
        customFeedback = `【${level}】PK 战况：双方声浪不相上下，以 ${left} 分握手言和！真是棋逢对手！`;
      }
    }

    showEnergyResultOverlay(scoreToShow, level, customFeedback);
  }
  syncToolboxPrimaryButton();
}

function formatToolboxStatsTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}秒`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}分${s}秒`;
}

function showEnergyResultOverlay(score, level, customFeedback) {
  const scoreEl = document.getElementById("energyResultScore");
  const feedbackEl = document.getElementById("energyResultFeedback");
  const overlay = document.getElementById("toolboxEnergyResultOverlay");
  const state = toolboxState();
  
  const highDbEl = document.getElementById("energyResultHighDb");
  const lowDbEl = document.getElementById("energyResultLowDb");
  const timeAboveEl = document.getElementById("energyResultTimeAbove");
  const timeBelowEl = document.getElementById("energyResultTimeBelow");
  if (highDbEl) highDbEl.textContent = state.statsHighestDb != null ? `${state.statsHighestDb} dB` : '-- dB';
  if (lowDbEl) lowDbEl.textContent = state.statsLowestDb != null ? `${state.statsLowestDb} dB` : '-- dB';
  if (timeAboveEl) timeAboveEl.textContent = formatToolboxStatsTime(state.statsTimeAbove || 0);
  if (timeBelowEl) timeBelowEl.textContent = formatToolboxStatsTime(state.statsTimeBelow || 0);
  
  if (scoreEl) scoreEl.textContent = String(score);
  if (feedbackEl) {
    if (customFeedback) {
      feedbackEl.textContent = customFeedback;
    } else {
      let feedback = "";
      if (score >= 95) {
        feedback = `【${level}】全班星光爆发！本轮声浪活力斩获了不可思议的 ${score} 分！这一下，课堂真的被彻底点燃了！`;
      } else if (score >= 85) {
        feedback = `【${level}】全班默契共振！本轮声浪活力获得了极高评价的 ${score} 分，凝聚力十分强大！`;
      } else if (score >= 70) {
        feedback = `【${level}】星光能量升起！本轮声浪获得了优秀的 ${score} 分，继续加油，向更高的星光发起挑战！`;
      } else {
        feedback = `【${level}】本轮声浪积攒了 ${score} 分，期待下一次更响亮的点亮仪式，让我们一起照亮课堂！`;
      }
      feedbackEl.textContent = feedback;
    }
  }
  
  if (overlay) {
    overlay.style.display = "flex";
  }
}

function closeEnergyResultOverlay(event) {
  if (event?.target && event.target !== document.getElementById("toolboxEnergyResultOverlay") && event.target.tagName !== "BUTTON") {
    return;
  }
  const overlay = document.getElementById("toolboxEnergyResultOverlay");
  if (overlay) {
    overlay.style.display = "none";
  }
  resetEnergyTool();
}

function confirmAndStartToolboxSettings() {
  const state = toolboxState();
  const tool = state.activeTool;
  
  readToolboxSettings();
  document.getElementById("toolboxSettingsOverlay")?.classList.remove("active");
  
  // 仅保存并更新设置，不直接开始运行，复位并显示最新的参数面板
  if (tool === "energy") {
    resetEnergyTool();
  } else if (tool === "garden") {
    resetGardenTool();
  } else if (tool === "lucky") {
    resetLuckyTool();
  } else if (tool === "timer") {
    resetToolboxTimer();
  }
}

function resetEnergyTool() {
  const state = toolboxState();
  state.energyRunning = false;
  state.paused = false;
  state.energyScore = 0;
  state.energyPeak = 0;
  state.energyDb = null;
  state.energyStartedAt = 0;
  state.energySamples = [];
  state.energyPkScores.clear();
  cancelToolboxAudioLoop();
  renderEnergyToolbox();
  setToolboxResult("toolboxEnergyResult", "点击开始，让全班一起点亮星光。");
  syncToolboxPrimaryButton();
}

function renderEnergyToolbox() {
  const state = toolboxState();
  const score = state.energyMode === "cheer" ? Math.min(100, state.energyPeak) : state.energyScore;
  const target = Math.max(1, Number(state.settings.energyTarget || 90));
  const completion = Math.max(0, Math.min(100, Math.round((score / target) * 100)));
  const level = resolveEnergyLevel(score);

  // 1. 动态渲染挑战难度
  let diffLabel = "高";
  if (target <= 60) diffLabel = "低";
  else if (target <= 75) diffLabel = "中";
  else if (target <= 90) diffLabel = "高";
  else diffLabel = "极高";
  setText("toolboxEnergyDifficulty", `挑战：${diffLabel} (${target}dB)`);

  setText("toolboxEnergyScore", `${completion}%`);
  setText("toolboxEnergyLevel", level);
  setText("toolboxEnergyDb", state.energyDb == null ? "-- dB" : `${state.energyDb} dB`);
  setText("toolboxEnergyTime", resolveEnergyTimeLabel());
  const meter = document.getElementById("toolboxEnergyMeter");
  if (meter) meter.style.width = `${completion}%`;

  // 2. 动态渲染小组 PK 视图
  const isPk = state.energyMode === "pk";
  const pkArea = document.getElementById("toolboxEnergyPkArea");
  if (pkArea) {
    pkArea.style.display = isPk && (state.energyRunning || state.paused) ? "flex" : "none";
    if (isPk) {
      const leftScore = state.energyPkScoreLeft || 0;
      const rightScore = state.energyPkScoreRight || 0;
      setText("toolboxEnergyPkScoreLeft", `${leftScore} 分`);
      setText("toolboxEnergyPkScoreRight", `${rightScore} 分`);
      const barLeft = document.getElementById("toolboxEnergyPkBarLeft");
      const barRight = document.getElementById("toolboxEnergyPkBarRight");
      if (barLeft) barLeft.style.height = `${leftScore}%`;
      if (barRight) barRight.style.height = `${rightScore}%`;
    }
  }

  const orb = document.getElementById("toolboxEnergyOrb");
  if (orb) {
    orb.style.setProperty("--energy", String(Math.max(12, score)));
    orb.style.setProperty("--is-pk", isPk ? "1" : "0");
    orb.classList.toggle("celebrate", completion >= 100);
  }
  if (completion >= 100 && state.energyRunning) {
    setToolboxResult("toolboxEnergyResult", `全班点亮成功：${level}。这一下，课堂真的醒了。`);
  }
  syncDesktopFloatingBallStatus();
}

function resolveEnergyTimeLabel() {
  const state = toolboxState();
  const durationSeconds = Number(state.settings.energyDuration || 0);
  if (durationSeconds <= 0) return "不限时";
  if (!state.energyRunning && !state.paused) return `${durationSeconds} 秒挑战`;
  const elapsed = Math.max(0, performance.now() - (state.energyStartedAt || performance.now()));
  const remaining = Math.max(0, Math.ceil(durationSeconds - elapsed / 1000));
  return `剩余 ${remaining} 秒`;
}

function resolveEnergyLevel(score) {
  if (score >= 95) return "星光爆发";
  if (score >= 85) return "全班共振";
  if (score >= 70) return "能量升起";
  return score > 0 ? "正在聚光" : "等待点亮";
}

function buildEnergyResultText() {
  const state = toolboxState();
  if (state.energyMode === "cheer") {
    return `本轮欢呼峰值：${Math.min(100, state.energyPeak)} 分。`;
  }
  return `本轮声浪活力：${state.energyScore} 分，${resolveEnergyLevel(state.energyScore)}。`;
}

async function startGardenTool() {
  const state = toolboxState();
  readToolboxSettings();
  if (state.activeTool !== "garden") {
    enterToolboxTool("garden", { silent: true });
  }
  try {
    await ensureToolboxAudio();
    if (!state.paused) {
      state.gardenQuietSeconds = 0;
      state.statsHighestDb = null;
      state.statsLowestDb = null;
      state.statsTimeAbove = 0;
      state.statsTimeBelow = 0;
    }
    state.paused = false;
    state.gardenRunning = true;
    state.gardenLastTick = performance.now();
    setToolboxResult("toolboxGardenResult", "安静会让花园一点点醒来。系统只计算声音能量。");
    startToolboxAudioLoop((level) => updateGardenSample(level));
  } catch (error) {
    state.gardenRunning = false;
    setToolboxResult("toolboxGardenResult", error.message || "无法启动麦克风", true);
  }
  syncToolboxPrimaryButton();
}

function updateGardenSample(level, now = performance.now()) {
  const state = toolboxState();
  if (!state.gardenRunning || state.paused) return;
  const delta = Math.max(0, (now - (state.gardenLastTick || now)) / 1000);
  state.gardenLastTick = now;
  state.gardenDb = Math.round(14 + Math.max(0, Math.min(100, level)) * 0.8);
  const threshold = Number(state.settings.gardenThreshold || 34);
  
  if (state.statsHighestDb === null || state.gardenDb > state.statsHighestDb) state.statsHighestDb = state.gardenDb;
  if (state.statsLowestDb === null || state.gardenDb < state.statsLowestDb) state.statsLowestDb = state.gardenDb;
  if (state.gardenDb > threshold) {
    state.statsTimeAbove += delta;
  } else {
    state.statsTimeBelow += delta;
  }

  if (state.gardenDb <= threshold) {
    state.gardenQuietSeconds += delta;
  }
  const target = Number(state.settings.gardenTarget ?? 120);
  const refTarget = target > 0 ? target : 120;
  const progress = Math.max(
    0,
    Math.min(100, (state.gardenQuietSeconds / refTarget) * 100),
  );
  if (shouldRenderToolboxAudioFrame(state, now) || (target > 0 && progress >= 100)) {
    renderGardenToolbox(state.gardenDb > threshold);
  }
}

function stopGardenTool(options = {}) {
  const state = toolboxState();
  if (!state.gardenRunning && !state.paused && options.silent) return;

  const target = Number(state.settings.gardenTarget ?? 120);
  const refTarget = target > 0 ? target : 60; // 不限时模式下，满1分钟即得满分，或按已守护时间计算
  const score = Math.max(0, Math.min(100, Math.round((state.gardenQuietSeconds / refTarget) * 100)));
  const level = resolveGardenLevel(score);

  state.gardenRunning = false;
  state.paused = false;
  cancelToolboxAudioLoop();

  if (!options.silent) {
    setToolboxResult("toolboxGardenResult", `本次守护得分：${score} 分，${level}。`);
    stopToolboxAudio();
    showGardenResultOverlay(score, level);
  }
  syncToolboxPrimaryButton();
}

function resetGardenTool() {
  const state = toolboxState();
  state.gardenRunning = false;
  state.paused = false;
  state.gardenQuietSeconds = 0;
  state.gardenLastTick = 0;
  state.gardenDb = null;
  cancelToolboxAudioLoop();
  initGardenFlora();
  renderGardenToolbox(false);
  setToolboxResult("toolboxGardenResult", "点击开始，全班一起守护安静花园。");
  syncToolboxPrimaryButton();
}

function initGardenFlora() {
  const container = document.getElementById("toolboxGardenFlora");
  if (!container) return;
  container.innerHTML = "";
  const count = 10;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "flora-item";
    
    const left = 5 + Math.random() * 80;
    const bottom = -5 + Math.random() * 20;
    const scale = 0.5 + Math.random() * 0.5;
    const rot = -20 + Math.random() * 40;
    const hue = Math.floor(Math.random() * 360);
    const delay = -(Math.random() * 5);
    const bri = 0.9 + Math.random() * 0.3;
    
    el.style.left = `${left}%`;
    el.style.bottom = `${bottom}%`;
    el.style.setProperty("--flora-scale", String(scale));
    el.style.setProperty("--flora-rot", `${rot}deg`);
    el.style.setProperty("--flora-hue", `${hue}deg`);
    el.style.setProperty("--flora-bri", String(bri));
    el.style.setProperty("--flora-delay", `${delay}s`);
    
    el.innerHTML = '<img src="images/toolbox/quiet-flower.png" alt="">';
    container.appendChild(el);
  }
}

function renderGardenToolbox(isNoisy = false) {
  const state = toolboxState();
  const target = Number(state.settings.gardenTarget ?? 120);
  
  // 如果不限时，花朵的生长和进度条以 120秒（2分钟）作为达到 100% 的满载参考，但之后维持在 100% 并不自动结束
  const refTarget = target > 0 ? target : 120;
  const progress = Math.max(0, Math.min(100, (state.gardenQuietSeconds / refTarget) * 100));

  setText("toolboxGardenDb", state.gardenDb == null ? "-- dB" : `${state.gardenDb} dB`);
  const dbEl = document.getElementById("toolboxGardenDb");
  const threshold = Number(state.settings.gardenThreshold || 34);
  if (dbEl) {
    if (state.gardenDb == null) {
      dbEl.style.color = "";
    } else if (state.gardenDb > threshold + 8) {
      dbEl.style.color = "#ff4d4f"; // 严重超过：红色
    } else if (state.gardenDb > threshold) {
      dbEl.style.color = "#ffd591"; // 稍微超过：黄色
    } else {
      dbEl.style.color = ""; // 正常范围：白色
    }
  }
  const bar = document.getElementById("toolboxGardenProgress");
  if (bar) bar.style.width = `${progress}%`;
  const scene = document.getElementById("toolboxGardenScene");
  if (scene) {
    scene.style.setProperty("--growth", String(progress));
    scene.classList.toggle("complete", progress >= 100);
    scene.classList.toggle("noisy", isNoisy);
  }
  
  const floraContainer = document.getElementById("toolboxGardenFlora");
  if (floraContainer) {
    const floras = floraContainer.querySelectorAll(".flora-item");
    const count = floras.length;
    // 在 10% ~ 90% 之间按进度依次让子花绽放
    let targetBloomed = 0;
    if (progress > 10) {
      targetBloomed = Math.min(count, Math.floor((progress - 10) / (80 / count)) + 1);
    }
    floras.forEach((flora, idx) => {
      if (idx < targetBloomed) {
        flora.classList.add("flora-bloomed");
      } else {
        flora.classList.remove("flora-bloomed");
      }
    });
  }
  setText(
    "toolboxGardenStatus",
    progress >= 100 && target > 0
      ? "花园完整点亮"
      : isNoisy
        ? "声音有点高，花园先等一等"
        : state.gardenRunning
          ? "安静正在生长"
          : "一起守护安静花园",
  );

  setText("toolboxGardenProgressText", `${Math.round(progress)}%`);

  const countdownEl = document.getElementById("toolboxGardenCountdown");
  if (countdownEl) {
    if (target > 0) {
      const remaining = Math.max(0, target - state.gardenQuietSeconds);
      const min = Math.floor(remaining / 60);
      const sec = Math.floor(remaining % 60);
      if (state.gardenRunning || state.paused) {
        countdownEl.textContent = `剩余 ${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
      } else {
        const targetMin = Math.floor(target / 60);
        const targetSec = Math.floor(target % 60);
        countdownEl.textContent = `限时 ${String(targetMin).padStart(2, "0")}:${String(targetSec).padStart(2, "0")}`;
      }
    } else {
      // 不限时模式下
      if (state.gardenRunning || state.paused) {
        const elapsed = state.gardenQuietSeconds;
        const min = Math.floor(elapsed / 60);
        const sec = Math.floor(elapsed % 60);
        countdownEl.textContent = `已守护 ${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
      } else {
        countdownEl.textContent = "不限时";
      }
    }
  }

  const thresholdLabel = getGardenThresholdLabel(state.settings.gardenThreshold || 34);
  setText("toolboxGardenDifficulty", thresholdLabel);
  syncDesktopFloatingBallStatus();

  // 只有在限时模式且进度达到 100% 时，才自动停止
  if (target > 0 && progress >= 100 && state.gardenRunning) {
    stopGardenTool();
    setToolboxResult("toolboxGardenResult", "全班守护成功，花园已经完整开放。");
  }
}

function getGardenThresholdLabel(threshold) {
  const val = Number(threshold);
  if (val === 45) return "要求：宽松 (45dB)";
  if (val === 34) return "要求：标准 (34dB)";
  if (val === 22) return "要求：严格 (22dB)";
  if (val === 12) return "要求：极严 (12dB)";
  return `要求：${val}dB`;
}

function resolveGardenLevel(score) {
  if (score >= 95) return "完美守护";
  if (score >= 80) return "静心守望";
  if (score >= 60) return "渐入佳境";
  return "等待萌芽";
}

function showGardenResultOverlay(score, level) {
  const scoreEl = document.getElementById("gardenResultScore");
  const feedbackEl = document.getElementById("gardenResultFeedback");
  const overlay = document.getElementById("toolboxGardenResultOverlay");
  const state = toolboxState();
  
  const highDbEl = document.getElementById("gardenResultHighDb");
  const lowDbEl = document.getElementById("gardenResultLowDb");
  const timeAboveEl = document.getElementById("gardenResultTimeAbove");
  const timeBelowEl = document.getElementById("gardenResultTimeBelow");
  if (highDbEl) highDbEl.textContent = state.statsHighestDb != null ? `${state.statsHighestDb} dB` : '-- dB';
  if (lowDbEl) lowDbEl.textContent = state.statsLowestDb != null ? `${state.statsLowestDb} dB` : '-- dB';
  if (timeAboveEl) timeAboveEl.textContent = formatToolboxStatsTime(state.statsTimeAbove || 0);
  if (timeBelowEl) timeBelowEl.textContent = formatToolboxStatsTime(state.statsTimeBelow || 0);

  if (scoreEl) scoreEl.textContent = String(score);
  if (feedbackEl) {
    let feedback = "";
    if (score >= 95) {
      feedback = `【${level}】太棒了！全班同学以超高的自律达成了 ${score} 分！安静的花园里繁花似锦，美轮美奂！`;
    } else if (score >= 80) {
      feedback = `【${level}】真不错！全班同学共同专注，斩获了 ${score} 分，花园里大半的花朵都已绽放！`;
    } else if (score >= 60) {
      feedback = `【${level}】初见成效！本轮安静挑战获得了 ${score} 分，部分绿芽已经破土而出，继续加油！`;
    } else {
      feedback = `【${level}】本次守护获得 ${score} 分。别气馁，下一次我们一起深呼吸，让安静守护更持久！`;
    }
    feedbackEl.textContent = feedback;
  }
  if (overlay) {
    overlay.style.display = "flex";
  }
}

function closeGardenResultOverlay(event) {
  if (event?.target && event.target !== document.getElementById("toolboxGardenResultOverlay") && event.target.tagName !== "BUTTON") {
    return;
  }
  const overlay = document.getElementById("toolboxGardenResultOverlay");
  if (overlay) {
    overlay.style.display = "none";
  }
  resetGardenTool();
}

function setLuckyScope(scope) {
  const state = toolboxState();
  const next = scope === "group" ? "group" : "class";
  state.luckyScope = next;
  state.settings.luckyScope = next;
  const select = document.getElementById("toolboxLuckyScopeSelect");
  if (select) select.value = next;
  const groupSelectContainer = document.getElementById("toolboxLuckyGroupSelectContainer");
  if (groupSelectContainer) {
    if (next === "group") {
      groupSelectContainer.style.setProperty("display", "grid", "important");
    } else {
      groupSelectContainer.style.setProperty("display", "none", "important");
    }
  }
  resetLuckyTool();
  renderLuckyExcludeList();
}

function setLuckyGroupNo(groupNo) {
  const state = toolboxState();
  state.settings.luckyGroupNo = String(groupNo || "");
  resetLuckyTool();
  renderLuckyExcludeList();
}

function getStudentVisualUrl(student) {
  if (!student) return "";
  if (student.avatarUrl) return resolveAssetUrl(student.avatarUrl);
  return petImg(student);
}

function buildLuckyAvatarMarkup(student, className = "lucky-roll-avatar") {
  const name = student?.name || "?";
  const url = student ? petImg(student) : "";
  if (url) {
    return `<img class="${className}" src="${escapeHtml(url)}" alt="${escapeHtml(name)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'${className} lucky-avatar-fallback',textContent:'${escapeHtml(name.charAt(0) || "?")}' }))">`;
  }
  return `<span class="${className} lucky-avatar-fallback">${escapeHtml(name.charAt(0) || "?")}</span>`;
}

function openLuckyStudentScore(key) {
  const state = toolboxState();
  if (state.luckyRolling) return;
  const safeKey = decodeURIComponent(String(key || ""));
  const student = students.find((item) => luckyStudentKey(item) === safeKey);
  if (!student) {
    showDisplayToast("当前学生不在班级名单中");
    return;
  }
  closeLuckyHistoryModal();
  openPointModalByName(student.name, null);
}

function buildLuckyRollCardMarkup(student, isCenter) {
  if (!student) {
    return `<span class="lucky-roll-card">
      <img class="lucky-roll-avatar unknown" src="images/logo.svg" alt="未知">
    </span>`;
  }
  if (isCenter) {
    const avatarUrl = petImg(student);
    return `<span class="lucky-roll-card center">
      <img class="lucky-roll-avatar" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(student.name)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'lucky-roll-avatar lucky-avatar-fallback',textContent:'${escapeHtml(student.name.charAt(0) || "?")}' }))">
      <b>${escapeHtml(student.name)}</b>
    </span>`;
  } else {
    return `<span class="lucky-roll-card">
      <img class="lucky-roll-avatar unknown" src="images/logo.svg" alt="未知">
    </span>`;
  }
}

function ensureLuckyRollTrackPlaceholders(track) {
  if (!track || track.dataset.luckyTrackReady === "1") return;
  track.innerHTML = Array.from({ length: 18 })
    .map(
      () =>
        `<span class="lucky-roll-card"><img class="lucky-roll-avatar unknown" src="images/logo.svg" alt="未知"></span>`,
    )
    .join("");
  track.dataset.luckyTrackReady = "1";
}

function renderLuckyCenterCard(student, clickable = false) {
  const centerCard = document.getElementById("toolboxLuckyCenterCard");
  if (!centerCard) return;
  if (student) {
    const avatarUrl = petImg(student);
    const key = luckyStudentKey(student);
    centerCard.classList.toggle("clickable", clickable);
    centerCard.setAttribute("role", clickable ? "button" : "presentation");
    centerCard.setAttribute("tabindex", clickable ? "0" : "-1");
    centerCard.onclick = clickable ? () => openLuckyStudentScore(key) : null;
    centerCard.onkeydown = clickable
      ? (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openLuckyStudentScore(key);
          }
        }
      : null;
    centerCard.innerHTML = `
      <img class="lucky-roll-avatar" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(student.name)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'lucky-roll-avatar lucky-avatar-fallback',textContent:'${escapeHtml(student.name.charAt(0) || "?")}' }))">
      <b>${escapeHtml(student.name)}</b>
    `;
  } else {
    centerCard.classList.remove("clickable");
    centerCard.setAttribute("role", "presentation");
    centerCard.setAttribute("tabindex", "-1");
    centerCard.onclick = null;
    centerCard.onkeydown = null;
    centerCard.innerHTML = `
      <img class="lucky-roll-avatar unknown" src="images/logo.svg" alt="未知">
      <b>准备抽选</b>
    `;
  }
}

function drawLuckyStudent() {
  const state = toolboxState();
  readToolboxSettings();
  if (state.activeTool !== "lucky") {
    enterToolboxTool("lucky", { silent: true });
  }
  if (state.luckyRolling) return;
  const repeat = Boolean(state.settings.luckyRepeat);
  const groupNo = state.settings.luckyGroupNo || document.getElementById("toolboxLuckyGroupSelect")?.value;
  const scopedPool = getToolboxStudentsByScope(state.settings.luckyScope, groupNo).filter(
    (student) => !isLuckyStudentExcluded(student),
  );
  const pool = scopedPool.filter((student) => {
    return repeat || !state.luckyDrawnIds.has(luckyStudentKey(student));
  });
  if (!pool.length) {
    if (!scopedPool.length) {
      setToolboxResult(
        "toolboxLuckyResult",
        "当前范围没有可抽学生，请在设置中取消排除或更换范围。",
        true,
      );
    } else {
      setToolboxResult("toolboxLuckyResult", "这一轮已经抽完。打开设置允许重复，或点击重置名单。", true);
    }
    return;
  }
  state.luckyRolling = true;
  state.luckySelected = null;
  state.luckyRollPool = pool;
  state.luckyRollStartedAt = performance.now();
  state.luckyRollLastCenterIndex = -1;
  document.getElementById("toolboxLuckyWheel")?.classList.add("rolling");
  setToolboxResult("toolboxLuckyResult", "头像正在翻滚，幸运正在靠近。");
  runLuckyRollFrame();
  syncToolboxPrimaryButton();
}

function runLuckyRollFrame() {
  const state = toolboxState();
  const track = document.getElementById("toolboxLuckyTrack");
  if (!track || !state.luckyRolling) return;
  const elapsed = performance.now() - state.luckyRollStartedAt;
  const progress = (elapsed % 80) / 80;

  ensureLuckyRollTrackPlaceholders(track);
  track.style.setProperty("--roll-progress", String(progress));

  // 中间固定卡片按 100ms 更新，避免每帧重建图片 DOM。
  const pool = state.luckyRollPool.length ? state.luckyRollPool : students;
  if (pool.length) {
    const flashIndex = Math.floor(elapsed / 100) % pool.length;
    if (flashIndex !== state.luckyRollLastCenterIndex) {
      state.luckyRollLastCenterIndex = flashIndex;
      renderLuckyCenterCard(pool[flashIndex]);
    }
  }

  state.luckyRollRAF = requestAnimationFrame(runLuckyRollFrame);
}

function stopLuckyDrawWithWinner() {
  const state = toolboxState();
  if (!state.luckyRolling) return;
  const elapsed = performance.now() - state.luckyRollStartedAt;
  const pool = state.luckyRollPool.length ? state.luckyRollPool : students;
  if (!pool.length) {
    stopLuckyRoll();
    return;
  }
  // 选定点击瞬间在中心闪烁显示的学生
  const flashIndex = Math.floor(elapsed / 100) % pool.length;
  const winner = pool[flashIndex];
  stopLuckyRoll();
  document.getElementById("toolboxLuckyWheel")?.classList.remove("rolling");
  if (winner) {
    state.luckySelected = winner;
    state.luckyDrawnIds.add(luckyStudentKey(winner));
    state.luckyHistory.unshift(winner);
    state.luckyHistory = state.luckyHistory.slice(0, 100);
    renderLuckyToolbox(winner);
    setToolboxResult("toolboxLuckyResult", `幸运同学：${winner.name}。把掌声给到 TA。`);
  } else {
    renderLuckyToolbox();
  }
  syncToolboxPrimaryButton();
}

function stopLuckyRoll() {
  const state = toolboxState();
  if (state.luckyRollRAF) {
    cancelAnimationFrame(state.luckyRollRAF);
    state.luckyRollRAF = null;
  }
  state.luckyRolling = false;
  state.luckyRollLastCenterIndex = -1;
}

function resetLuckyTool() {
  const state = toolboxState();
  stopLuckyRoll();
  state.luckyDrawnIds.clear();
  state.luckyHistory = [];
  state.luckySelected = null;
  renderLuckyToolbox();
  setToolboxResult("toolboxLuckyResult", "默认全班抽取，点击开始进行随机抽取。");
  syncToolboxPrimaryButton();
}

function renderLuckyToolbox(selected) {
  const state = toolboxState();
  const target = selected || state.luckySelected;
  const name = target?.name || "准备抽选";
  const groupNo =
    state.settings.luckyGroupNo ||
    document.getElementById("toolboxLuckyGroupSelect")?.value;
  const excludeCount = getLuckyExcludedCountInScope(
    state.settings.luckyScope,
    groupNo,
  );
  const excludeHint = excludeCount ? ` · 已排除 ${excludeCount} 人` : "";
  const meta = target
    ? `${target.groupName || (target.group ? `第${target.group}组` : "未分组")} · ${target.petName || "星宠伙伴"}`
    : state.settings.luckyScope === "group"
      ? `小组抽选 · 不重复${excludeHint}`
      : `全班抽选 · 不重复${excludeHint}`;
  setText("toolboxLuckyName", name);
  setText("toolboxLuckyMeta", meta);
  const avatar = document.getElementById("toolboxLuckyAvatar");
  if (avatar) {
    avatar.outerHTML = buildLuckyAvatarMarkup(target, "lucky-winner-avatar");
  }
  const history = document.getElementById("toolboxLuckyHistory");
  if (history) {
    const isOverflow = state.luckyHistory.length > 10;
    const displayCount = isOverflow ? 9 : 10;
    const displayItems = state.luckyHistory.slice(0, displayCount);
    let html = displayItems
      .map(
        (student) =>
          `<button type="button" onclick="openLuckyStudentScore('${luckyStudentKeyForInlineHandler(student)}')">${buildLuckyAvatarMarkup(student, "lucky-history-avatar")}<b>${escapeHtml(student.name)}</b></button>`,
      )
      .join("");
    if (isOverflow) {
      html += `<button class="lucky-more-btn" onclick="openLuckyHistoryModal()" type="button"><i class="fa-solid fa-ellipsis"></i> 更多</button>`;
    }
    history.innerHTML = html;
  }

  renderLuckyCenterCard(target, Boolean(target && !state.luckyRolling));

  // 静止或重置状态下，轨道纯平铺 18 个全黑未知占位卡片
  const track = document.getElementById("toolboxLuckyTrack");
  if (track) {
    track.dataset.luckyTrackReady = "0";
    ensureLuckyRollTrackPlaceholders(track);
    track.style.setProperty("--roll-progress", "0");
  }
}

function openLuckyHistoryModal() {
  const overlay = document.getElementById("luckyAllHistoryModal");
  if (overlay) {
    const list = document.getElementById("luckyAllHistoryList");
    if (list) {
      list.innerHTML = toolboxState().luckyHistory
        .map(
          (student) =>
            `<button type="button" onclick="event.stopPropagation();openLuckyStudentScore('${luckyStudentKeyForInlineHandler(student)}')" class="lucky-history-modal-card">
              ${buildLuckyAvatarMarkup(student, "lucky-history-avatar")}
              <b>${escapeHtml(student.name)}</b>
              <em>${escapeHtml(student.groupName || (student.group ? `第${student.group}组` : "未分组"))}</em>
            </button>`,
        )
        .join("");
    }
    overlay.classList.add("active");
  }
}

function closeLuckyHistoryModal() {
  document.getElementById("luckyAllHistoryModal")?.classList.remove("active");
}

function setToolboxTimerPreset(seconds) {
  const state = toolboxState();
  const duration = Math.max(1, Number(seconds) || 300);
  state.settings.timerDuration = duration;
  state.timerDuration = duration;
  state.timerDurationMs = duration * 1000;
  state.timerRemainingMs = state.timerDurationMs;
  document.querySelectorAll(".timer-presets button").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.textContent?.match(/\d+/)?.[0] || 0) * 60 === duration);
  });
  const custom = document.getElementById("toolboxTimerCustom");
  if (custom) custom.value = "";

  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = duration % 60;
  setTimerPickerValues(h, m, s);

  stopToolboxTimerRAF();
  state.timerRunning = false;
  state.timerPaused = false;
  renderToolboxTimer();
}

function resolveToolboxTimerDuration() {
  const h = getTimerPickerValue("timerPickerHours");
  const m = getTimerPickerValue("timerPickerMinutes");
  const s = getTimerPickerValue("timerPickerSeconds");
  const duration = h * 3600 + m * 60 + s;
  if (duration > 0) {
    return duration;
  }
  const custom = Number(document.getElementById("toolboxTimerCustom")?.value || 0);
  if (Number.isFinite(custom) && custom > 0) {
    return Math.min(99 * 60, Math.round(custom * 60));
  }
  return toolboxState().settings.timerDuration || 300;
}

function startToolboxTimer() {
  const state = toolboxState();
  if (state.activeTool !== "timer") {
    enterToolboxTool("timer", { silent: true });
  }
  if (!state.timerPaused) {
    state.timerDuration = resolveToolboxTimerDuration();
    state.settings.timerDuration = state.timerDuration;
    state.timerDurationMs = state.timerDuration * 1000;
    state.timerRemainingMs = state.timerDurationMs;
  }
  state.timerRunning = true;
  state.timerPaused = false;
  state.timerDeadlineAt = performance.now() + state.timerRemainingMs;
  stopToolboxTimerRAF();
  tickToolboxTimer();
  syncToolboxPrimaryButton();
}

function pauseToolboxTimer() {
  const state = toolboxState();
  if (!state.timerRunning) return;
  state.timerRemainingMs = Math.max(0, state.timerDeadlineAt - performance.now());
  state.timerRunning = false;
  state.timerPaused = true;
  stopToolboxTimerRAF();
  renderToolboxTimer();
  syncToolboxPrimaryButton();
}

function startTimerAlertLoop() {
  stopTimerAlertLoop();
  if (typeof playMelodicChime === "function") {
    playMelodicChime();
    const state = toolboxState();
    state.timerAlertInterval = setInterval(playMelodicChime, 3000);
  }
}

function stopTimerAlertLoop() {
  const state = toolboxState();
  if (state && state.timerAlertInterval) {
    clearInterval(state.timerAlertInterval);
    state.timerAlertInterval = null;
  }
}

function resetToolboxTimer(options = {}) {
  const state = toolboxState();
  stopToolboxTimerRAF();
  stopTimerAlertLoop();
  state.timerFinishedAlerting = false;
  state.timerRunning = false;
  state.timerPaused = false;
  state.timerDuration = resolveToolboxTimerDuration();
  state.settings.timerDuration = state.timerDuration;
  state.timerDurationMs = state.timerDuration * 1000;
  state.timerRemainingMs = state.timerDurationMs;
  renderToolboxTimer();
  if (!options.silent) {
    setToolboxResult("toolboxTimerResult", "选择预设后开始，结束时会柔和提醒。");
  }
  syncToolboxPrimaryButton();
}

function stopToolboxTimerRAF() {
  const state = toolboxState();
  if (state.timerRAF) {
    clearTimeout(state.timerRAF);
    state.timerRAF = null;
  }
}

function tickToolboxTimer() {
  const state = toolboxState();
  if (!state.timerRunning) return;
  state.timerRemainingMs = Math.max(0, state.timerDeadlineAt - performance.now());
  renderToolboxTimer();
  if (state.timerRemainingMs <= 0) {
    state.timerRunning = false;
    state.timerPaused = false;
    state.timerFinishedAlerting = true;
    stopToolboxTimerRAF();
    setToolboxResult("toolboxTimerResult", "时间到，请收尾。");
    setText("toolboxTimerStatus", "时间到");
    document.getElementById("toolboxTimerDisplay")?.classList.add("finished");
    startTimerAlertLoop();
    syncToolboxPrimaryButton();
    return;
  }
  state.timerRAF = setTimeout(tickToolboxTimer, 250);
}

function formatTimerMs(ms) {
  // 以秒为单位向上取整，彻底避免点击开始后由于少许毫秒的流逝立即跳秒，产生“被扣掉一秒”的视觉错觉
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderToolboxTimer() {
  const state = toolboxState();
  const remaining = Math.max(0, state.timerRemainingMs ?? state.timerDurationMs ?? 300000);
  const progress = remaining / Math.max(1, state.timerDurationMs || 300000);
  const display = document.getElementById("toolboxTimerDisplay");
  if (display) {
    display.textContent = formatTimerMs(remaining);
    display.classList.toggle("finished", remaining === 0 || state.timerFinishedAlerting);
  }
  const ring = document.getElementById("toolboxTimerRing");
  if (ring) {
    // 进度条缩减设计：从 360deg 顺时针缩短至 0deg (与 iOS 计时器一致)
    ring.style.setProperty("--timer-progress", `${Math.round(progress * 360)}deg`);
  }
  const hourglass = document.getElementById("toolboxTimerHourglass");
  if (hourglass) {
    const sandProgress = Math.max(0, Math.min(1, progress));
    const sandFill = 1 - sandProgress;
    const streamActive = state.timerRunning && remaining > 0;
    hourglass.style.setProperty("--timer-sand-progress", sandProgress.toFixed(4));
    hourglass.style.setProperty("--timer-sand-fill", sandFill.toFixed(4));
    hourglass.style.setProperty("--timer-sand-stream-opacity", streamActive ? "1" : "0");
    hourglass.classList.toggle("is-running", streamActive);
    hourglass.classList.toggle("is-finished", remaining === 0 || state.timerFinishedAlerting);
  }
  setText(
    "toolboxTimerStatus",
    state.timerFinishedAlerting ? "时间到" : state.timerRunning ? "时间正在流动" : state.timerPaused ? "已暂停" : "时间会被全班看见",
  );

  const timerScene = document.querySelector('.toolbox-scene[data-toolbox-scene="timer"]');
  if (timerScene) {
    const isActive = state.timerRunning || state.timerPaused || state.timerFinishedAlerting;
    timerScene.setAttribute('data-timer-active', String(isActive));
  }
  syncDesktopFloatingBallStatus();
}

function setToolboxResult(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("error", Boolean(isError));
}

function bindDisplayOverlayBackdropDismiss() {
  if (typeof window.DisplayUI?.bindOverlayBackdropDismiss !== "function") {
    return;
  }
  window.DisplayUI.bindOverlayBackdropDismiss([
    { id: "pointModal", onClose: () => closePointModal() },
    { id: "adoptPetModal", onClose: () => closeAdoptModal() },
    { id: "adoptPetDetailModal", onClose: () => closeAdoptPetDetailModal() },
    {
      id: "groupManageModal",
      onClose: () => {
        void closeGroupManageModal();
      },
    },
    { id: "groupScoreRecordsModal", onClose: () => closeGroupScoreRecordsModal() },
    { id: "groupScoreAdjustModal", onClose: () => closeGroupScoreAdjustModal() },
    { id: "classSelectModal", onClose: () => cancelClassSelection() },
    { id: "petProfileModal", onClose: () => closePetProfileModal() },
    { id: "petDecoPanel", onClose: () => closeDecorationPanel() },
    { id: "petFullViewOverlay", onClose: () => closePetFullView() },
    {
      id: "petProfileAllHistoryModal",
      onClose: () => closePetProfileAllHistoryModal(),
    },
    { id: "pmAllHistoryModal", onClose: () => closeAllHistoryModal() },
    { id: "luckyAllHistoryModal", onClose: () => closeLuckyHistoryModal() },
    { id: "academicAiModal", onClose: () => closeAcademicAiModal() },
    { id: "exStudentModal", onClose: () => closeSelectStudentModal() },
    { id: "exModal", onClose: () => closeExchangeSuccess() },
    {
      id: "toolboxSettingsOverlay",
      onClose: () => closeToolboxSettings(),
    },
    {
      id: "toolboxEnergyResultOverlay",
      onClose: () => closeEnergyResultOverlay(),
    },
    {
      id: "toolboxGardenResultOverlay",
      onClose: () => closeGardenResultOverlay(),
    },
  ]);
}

window.addEventListener("beforeunload", () => {
  cleanupToolboxRuntime({ keepTimer: false });
});

document.addEventListener("DOMContentLoaded", () => {
  bindDisplayOverlayBackdropDismiss();
  window.addEventListener("display-desktop-command", handleDesktopBubbleCommand);
  resolveRuntimeParams();
  initNoNativeTooltips();
  syncDisplayPerformanceBodyState();
  syncDisplayHolidayState();
  scheduleDisplayHolidayDateSync();
  syncGridDensityState();
  bindGridDensityUi();
  bindLowSpecSettingsUi();
  bindSidebarCollapsedSettingsUi();
  syncDisplayFullscreenButton();
  syncDisplayMinimizeButton();
  document.addEventListener("fullscreenchange", syncDisplayFullscreenButton);
  document.addEventListener(
    "webkitfullscreenchange",
    syncDisplayFullscreenButton,
  );
  document.addEventListener("MSFullscreenChange", syncDisplayFullscreenButton);
  window.addEventListener("resize", syncDisplayFullscreenButton);
  clearAuthState({ preserveClassId: true, preserveToken: true });
  suppressPasswordManagerPrompts();
  hydrateLoginCredentials();
  hydrateSetupUsername();
  syncSetupMode();
  updateGroupToolbar();
  goSetupStep(1);
  document.querySelectorAll(".lb-tab").forEach((tab) => {
    tab.addEventListener("click", async () => {
      document
        .querySelectorAll(".lb-tab")
        .forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      await fetchLeaderboard(tab.dataset.type || "score");
    });
  });
  const ruleSearchInput = document.getElementById("pmRuleSearch");
  if (ruleSearchInput) {
    ruleSearchInput.addEventListener("input", (event) => {
      displayRulePanelState.searchKeyword = event.target.value || "";
      renderMoreRulePanel();
    });
  }
  loadTerminalState()
    .then(async (terminalState) => {
      if (!terminalState.isInitialized || !terminalState.classId) {
        runtimeState.setupMode = "initialize";
        syncSetupMode();
        navigateTo("setup");
        goSetupStep(1);
        return;
      }
      runtimeState.classId = terminalState.classId;
      runtimeState.terminalInitialized = true;
      subscribeRealtimeRooms();
      const sessionRestored = await restoreAuthSession();
      const canEnterClassroom =
        sessionRestored && canCurrentUserAccessClass(runtimeState.classId);
      if (sessionRestored && !canEnterClassroom) {
        clearAuthState({ preserveClassId: true });
      }
      await bootstrapDisplayData({
        authenticated: canEnterClassroom,
        silent: true,
        deferNonCritical: true,
        renderInitialViews: false,
      });
      navigateTo(canEnterClassroom ? "classroom" : "entry");
    })
    .catch(() => {
      runtimeState.setupMode = "initialize";
      syncSetupMode();
      navigateTo("setup");
      goSetupStep(1);
    })
    .finally(() => {
      applyLockOverlay();
    });
  window.setInterval(() => {
    if (runtimeState.user && runtimeState.classId) {
      refreshUnlockStatus().catch(() => {});
    }
  }, 30000);
  connectRealtime();
});

const originalOpenPointModalByName = openPointModalByName;
openPointModalByName = function patchedOpenPointModalByName(name, cardEl) {
  if (!ensureOperationUnlocked()) return;
  if (isDisplayAnimationLocked()) return;
  return originalOpenPointModalByName(name, cardEl);
};

const originalToggleBatchMode = toggleBatchMode;
toggleBatchMode = function patchedToggleBatchMode() {
  if (!ensureOperationUnlocked()) return;
  if (isDisplayAnimationLocked()) return;
  return originalToggleBatchMode();
};

const originalOpenGroupPointForFilter = openGroupPointForFilter;
openGroupPointForFilter = function patchedOpenGroupPointForFilter() {
  if (!ensureOperationUnlocked()) return;
  if (isDisplayAnimationLocked()) return;
  return originalOpenGroupPointForFilter();
};

const originalOpenBatchPointModal = openBatchPointModal;
openBatchPointModal = function patchedOpenBatchPointModal() {
  if (!ensureOperationUnlocked()) return;
  if (isDisplayAnimationLocked()) return;
  return originalOpenBatchPointModal();
};

const originalInitiateExchange = initiateExchange;
initiateExchange = function patchedInitiateExchange(...args) {
  if (!ensureOperationUnlocked()) return;
  if (isDisplayAnimationLocked()) return;
  return originalInitiateExchange(...args);
};

// ==================== 大屏叫号控制逻辑 ====================
let activeCallId = null;
let callAudioInterval = null;
let audioCtx = null;
let audioUnlockAlerted = false;

/**
 * 播放加减分音效 (加分为悦耳的上行和弦，减分为低沉的下行警示音)
 * @param {number} diff 分值变化量
 */
function playScoreSound(diff) {
  if (
    diff === 0 ||
    isLowSpecMode() ||
    document.body.classList.contains("low-spec")
  )
    return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtx) {
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
      if (audioCtx.state === "suspended" && !audioUnlockAlerted) {
        audioUnlockAlerted = true;
        showToast(
          "检测到大屏音效受浏览器安全限制，请点击大屏任意位置以激活音效",
          "info",
        );
      }
    }

    // 如果仍然被浏览器阻止，则不进行播放
    if (audioCtx.state !== "running") return;

    const now = audioCtx.currentTime;

    if (diff > 0) {
      // 悦耳加分音效：C5 -> E5 -> G5 上行三和弦
      const notes = [
        { freq: 523.25, time: 0, duration: 0.15 },
        { freq: 659.25, time: 0.08, duration: 0.15 },
        { freq: 783.99, time: 0.16, duration: 0.3 },
      ];
      notes.forEach((note) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(0, now + note.time);
        gain.gain.linearRampToValueAtTime(0.08, now + note.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + note.time + note.duration,
        );

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + note.time);
        osc.stop(now + note.time + note.duration);
      });
    } else {
      // 柔和减分音效：E4 -> A3 下行滑音
      const notes = [
        { freq: 329.63, time: 0, duration: 0.18 },
        { freq: 220.0, time: 0.1, duration: 0.35 },
      ];
      notes.forEach((note) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        if (note.freq === 220.0) {
          osc.frequency.exponentialRampToValueAtTime(
            147.0,
            now + note.time + note.duration,
          );
        }

        gain.gain.setValueAtTime(0, now + note.time);
        gain.gain.linearRampToValueAtTime(0.06, now + note.time + 0.03);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + note.time + note.duration,
        );

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + note.time);
        osc.stop(now + note.time + note.duration);
      });
    }
  } catch (err) {
    console.warn("播放加减分音效失败", err);
  }
}

// 全局交互监听，解锁大屏浏览器的自动播放策略限制
(function () {
  const unlock = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtx) {
          audioCtx = new AudioCtx();
        }
        if (audioCtx.state === "suspended") {
          audioCtx
            .resume()
            .then(() => {
              if (audioCtx.state === "running") {
                audioUnlockAlerted = true; // 成功解锁后不再提示
              }
            })
            .catch(() => {});
        }
      }
    } catch (e) {}
  };
  ["click", "touchstart", "pointerdown", "keydown"].forEach((evt) => {
    document.addEventListener(evt, unlock, { once: true, passive: true });
  });
})();

function playMelodicChime() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const chimes = [659.25, 830.61, 987.77, 1318.51];
    const now = audioCtx.currentTime;
    chimes.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + index * 0.15);
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, now);
      gain.gain.setValueAtTime(0, now + index * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, now + index * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.15 + 0.8);
      osc.connect(gain);
      gain.connect(filter);
      filter.connect(audioCtx.destination);
      osc.start(now + index * 0.15);
      osc.stop(now + index * 0.15 + 0.8);
    });
  } catch (err) {
    console.warn("播放音效错误", err);
  }
}

function startAlertSound() {
  stopAlertSound();
  playMelodicChime();
  callAudioInterval = setInterval(playMelodicChime, 3000);
}

function stopAlertSound() {
  if (callAudioInterval) {
    clearInterval(callAudioInterval);
    callAudioInterval = null;
  }
}

function formatCallTitle(callerName) {
  const name = String(callerName || "").trim();
  if (!name) return "老师正在叫号";
  return `${name.charAt(0)}老师正在叫号`;
}

function handleCallQueueChanged(call) {
  const overlay = document.getElementById("callOverlay");
  const titleEl = document.getElementById("callTitle");
  const locEl = document.getElementById("callLocation");
  const studEl = document.getElementById("callStudents");
  if (!overlay || !locEl || !studEl) return;

  if (call && call.status === "calling") {
    activeCallId = call.id;
    if (titleEl) titleEl.textContent = formatCallTitle(call.callerName);
    locEl.textContent = call.location || "--";
    studEl.innerHTML = "";
    const students = call.calledStudents || [];
    students.forEach((s) => {
      const tag = document.createElement("div");
      tag.className = "co-student-tag";
      tag.textContent = s.name;
      studEl.appendChild(tag);
    });
    overlay.style.display = "flex";
    syncCallOverlayAction();
    // 启动悠扬警报铃声
    startAlertSound();
  } else {
    activeCallId = null;
    if (titleEl) titleEl.textContent = "老师正在叫号";
    overlay.style.display = "none";
    syncCallOverlayAction();
    stopAlertSound();
  }
}

function canConfirmActiveCall() {
  return Boolean(activeCallId && runtimeState.terminalCode);
}

function syncCallOverlayAction() {
  const btn = document.querySelector(".co-confirm-btn");
  const label = btn?.querySelector("span");
  if (!btn || !label) return;

  if (!activeCallId) {
    btn.disabled = true;
    label.textContent = "等待老师叫号";
    return;
  }

  if (canConfirmActiveCall()) {
    btn.disabled = false;
    label.textContent = "我已收到，确认前往";
    return;
  }

  btn.disabled = true;
  label.textContent = "终端未就绪";
}

async function confirmActiveCall() {
  if (!activeCallId) return;
  if (!canConfirmActiveCall()) {
    showDisplayToast("当前终端未就绪，无法确认叫号");
    syncCallOverlayAction();
    return;
  }
  try {
    const btn = document.querySelector(".co-confirm-btn");
    if (btn) btn.disabled = true;
    await apiFetchWithToken(
      "/call-queue/" +
        activeCallId +
        "/confirm?displayTerminalCode=" +
        encodeURIComponent(runtimeState.terminalCode),
      runtimeState.token,
      { method: "POST" },
    );
    // 不直接调用 handleCallQueueChanged(null)，而是等待
    // 后端 advanceQueue 通过 WebSocket 推送下一条或清空
    // 同时做一次保底轮询，防止 WebSocket 消息丢失
    setTimeout(() => {
      checkActiveCall().catch(console.warn);
    }, 600);
  } catch (err) {
    console.error("确认叫号失败:", err);
  } finally {
    const btn = document.querySelector(".co-confirm-btn");
    if (btn) btn.disabled = false;
  }
}

async function checkActiveCall() {
  if (!runtimeState.classId) return;
  try {
    const data = await apiFetchWithToken(
      "/call-queue/active/" +
        runtimeState.classId +
        (runtimeState.terminalCode
          ? `?displayTerminalCode=${encodeURIComponent(runtimeState.terminalCode)}`
          : ""),
      runtimeState.token,
    );
    if (data && data.status === "calling") {
      handleCallQueueChanged(data);
    } else {
      handleCallQueueChanged(null);
    }
  } catch (err) {
    console.warn("获取活动叫号失败", err);
  }
}

/* ========== 终端设置交互与低配流畅模式逻辑 ========== */
function initNoNativeTooltips() {
  const strip = (root) => {
    if (!root || root.nodeType !== 1) return;
    if (root.hasAttribute("title")) root.removeAttribute("title");
    root
      .querySelectorAll?.("[title]")
      .forEach((el) => el.removeAttribute("title"));
  };
  strip(document.documentElement);
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "title"
      ) {
        mutation.target?.removeAttribute?.("title");
        return;
      }
      mutation.addedNodes.forEach((node) => strip(node));
    });
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["title"],
  });
}

function toggleSettingsMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById("classroomSettingsMenu");
  if (menu) {
    menu.classList.toggle("active");
  }
}

function toggleLowSpecMode(enabled) {
  writeLowSpecModeEnabled(Boolean(enabled));
  window.location.reload();
}

function bindLowSpecSettingsUi() {
  const switchEl = document.getElementById("settingsLowSpecSwitch");
  const row = switchEl?.closest(".settings-menu-item");
  if (!row || row.dataset.lowSpecBound === "1") return;
  row.dataset.lowSpecBound = "1";
  row.addEventListener("click", (event) => {
    if (
      !switchEl ||
      event.target === switchEl ||
      event.target.closest(".settings-switch")
    ) {
      return;
    }
    switchEl.checked = !switchEl.checked;
    toggleLowSpecMode(switchEl.checked);
  });
}

function bindSidebarCollapsedSettingsUi() {
  const switchEl = document.getElementById("settingsSidebarCollapsedSwitch");
  const row = switchEl?.closest(".settings-menu-item");
  if (!row || row.dataset.sidebarCollapsedBound === "1") return;
  row.dataset.sidebarCollapsedBound = "1";
  switchEl?.addEventListener("change", () => {
    toggleSidebarCollapsed(Boolean(switchEl.checked));
  });
  row.addEventListener("click", (event) => {
    if (
      !switchEl ||
      event.target === switchEl ||
      event.target.closest(".settings-switch")
    ) {
      return;
    }
    switchEl.checked = !switchEl.checked;
    toggleSidebarCollapsed(Boolean(switchEl.checked));
  });
}

window.toggleLowSpecMode = toggleLowSpecMode;

const ENTRY_STARFIELD_LAYERS_HTML =
  '<span class="star-layer star-layer-far"></span>' +
  '<span class="star-layer star-layer-mid"></span>' +
  '<span class="star-layer star-layer-near"></span>';

const ENTRY_SHOOTING_STARS_HTML =
  '<span class="shooting-star meteor-1"></span>' +
  '<span class="shooting-star meteor-2"></span>' +
  '<span class="shooting-star meteor-3"></span>';

function ensureEntryStarfield(pageEl) {
  if (!pageEl) return;
  const starfield = pageEl.querySelector(".entry-starfield");
  if (!starfield) return;

  if (!starfield.querySelector(".star-layer-far")) {
    starfield.innerHTML = ENTRY_STARFIELD_LAYERS_HTML;
  }
  starfield.classList.remove("entry-starfield-suspended");

  if (isLowSpecMode()) {
    starfield
      .querySelectorAll(".shooting-star")
      .forEach((star) => star.remove());
    return;
  }

  if (!starfield.querySelector(".shooting-star")) {
    starfield.insertAdjacentHTML("beforeend", ENTRY_SHOOTING_STARS_HTML);
  }
  restartEntryShootingStars(pageEl);
}

function restartEntryShootingStars(pageEl) {
  if (!pageEl || isLowSpecMode()) return;
  const starfield = pageEl.querySelector(".entry-starfield");
  if (!starfield) return;
  starfield.querySelectorAll(".shooting-star").forEach((star) => {
    star.replaceWith(star.cloneNode(true));
  });
}

function unloadEntryAnimations() {
  document.querySelectorAll(".entry-starfield").forEach((el) => {
    el.classList.add("entry-starfield-suspended");
    el.querySelectorAll(".shooting-star").forEach((star) => star.remove());
  });
}

// 监听全局点击，以便在点击其他位置时自动收起设置菜单
document.addEventListener("click", (event) => {
  const menu = document.getElementById("classroomSettingsMenu");
  const btn = document.getElementById("classroomSettingsBtn");
  if (menu && menu.classList.contains("active")) {
    if (!menu.contains(event.target) && !btn.contains(event.target)) {
      menu.classList.remove("active");
    }
  }
});

/** 流畅模式下轻量 CSS 粒子：围绕舞台中心飞散，开销远低于 Canvas **/
function spawnCssParticles(cx, cy, petH) {
  const container = document.getElementById("petUpgradeOverlay");
  if (!container) return;
  const count = 8;
  const baseHue = petH !== null ? petH : 42;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "css-particle";
    const hue = baseHue + (Math.random() - 0.5) * 18;
    const lightness = 58 + Math.random() * 14;
    el.style.backgroundColor = `hsl(${hue}, 88%, ${lightness}%)`;
    el.style.boxShadow = `0 0 8px hsla(${hue}, 88%, ${lightness + 10}%, 0.75)`;
    const size = 7 + Math.random() * 7;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.setProperty("--x", `${cx}px`);
    el.style.setProperty("--y", `${cy}px`);

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
    const distance = 90 + Math.random() * 110;
    el.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    el.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);

    container.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
}

/* ========== D08 自定义时分秒 Picker 滚轮组件初始化与逻辑 ========== */
function initTimerPickers() {
  const hoursWheel = document.querySelector("#timerPickerHours .picker-wheel");
  const minutesWheel = document.querySelector("#timerPickerMinutes .picker-wheel");
  const secondsWheel = document.querySelector("#timerPickerSeconds .picker-wheel");

  if (!hoursWheel || hoursWheel.children.length > 0) return;

  let hoursHtml = '<div class="picker-spacer"></div>';
  for (let i = 0; i < 24; i++) {
    hoursHtml += `<div class="picker-item" data-value="${i}">${String(i).padStart(2, "0")}</div>`;
  }
  hoursHtml += '<div class="picker-spacer"></div>';
  hoursWheel.innerHTML = hoursHtml;

  let minutesHtml = '<div class="picker-spacer"></div>';
  for (let i = 0; i < 60; i++) {
    minutesHtml += `<div class="picker-item" data-value="${i}">${String(i).padStart(2, "0")}</div>`;
  }
  minutesHtml += '<div class="picker-spacer"></div>';
  minutesWheel.innerHTML = minutesHtml;

  let secondsHtml = '<div class="picker-spacer"></div>';
  for (let i = 0; i < 60; i++) {
    secondsHtml += `<div class="picker-item" data-value="${i}">${String(i).padStart(2, "0")}</div>`;
  }
  secondsHtml += '<div class="picker-spacer"></div>';
  secondsWheel.innerHTML = secondsHtml;

  const cols = ["timerPickerHours", "timerPickerMinutes", "timerPickerSeconds"];
  cols.forEach((id) => {
    const colEl = document.getElementById(id);
    if (!colEl) return;
    colEl.addEventListener("scroll", () => {
      updateTimerPickerSelection(colEl);
    }, { passive: true });
  });

  setTimerPickerValues(0, 5, 0);
}

function updateTimerPickerSelection(colEl) {
  const wheel = colEl.querySelector(".picker-wheel");
  if (!wheel) return;
  const items = wheel.querySelectorAll(".picker-item");
  const itemHeight = 36;
  const scrollY = colEl.scrollTop;
  const selectedIndex = Math.round(scrollY / itemHeight);

  items.forEach((item, idx) => {
    item.classList.toggle("selected", idx === selectedIndex);
  });

  const state = toolboxState();
  if (state && !state.timerRunning && !state.timerPaused) {
    const h = getTimerPickerValue("timerPickerHours");
    const m = getTimerPickerValue("timerPickerMinutes");
    const s = getTimerPickerValue("timerPickerSeconds");
    
    const duration = h * 3600 + m * 60 + s;
    if (duration > 0) {
      state.settings.timerDuration = duration;
      state.timerDuration = duration;
      state.timerDurationMs = duration * 1000;
      state.timerRemainingMs = state.timerDurationMs;
      
      const display = document.getElementById("toolboxTimerDisplay");
      if (display) {
        display.textContent = formatTimerMs(state.timerRemainingMs);
      }
      
      document.querySelectorAll(".timer-presets button").forEach((btn) => {
        btn.classList.remove("active");
      });
    }
  }
}

function getTimerPickerValue(colId) {
  const colEl = document.getElementById(colId);
  if (!colEl) return 0;
  const itemHeight = 36;
  const selectedIndex = Math.round(colEl.scrollTop / itemHeight);
  const items = colEl.querySelectorAll(".picker-item");
  const target = items[selectedIndex];
  return target ? Number(target.dataset.value || 0) : 0;
}

function setTimerPickerValues(h, m, s) {
  const itemHeight = 36;
  const hCol = document.getElementById("timerPickerHours");
  const mCol = document.getElementById("timerPickerMinutes");
  const sCol = document.getElementById("timerPickerSeconds");

  if (hCol) hCol.scrollTop = h * itemHeight;
  if (mCol) mCol.scrollTop = m * itemHeight;
  if (sCol) sCol.scrollTop = s * itemHeight;
}
