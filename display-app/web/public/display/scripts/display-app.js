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
  { code: "051", name: "星尘鸮", category: "star", coverUrl: "/assets/pets/400/051_星尘鸮_1.png" },
  { code: "052", name: "星糖喵", category: "star", coverUrl: "/assets/pets/400/052_星糖喵_1.png" },
  { code: "053", name: "晨露鹿", category: "star", coverUrl: "/assets/pets/400/053_晨露鹿_1.png" },
  { code: "054", name: "曜虎机", category: "star", coverUrl: "/assets/pets/400/054_曜虎机_1.png" },
  { code: "055", name: "月纱兔", category: "star", coverUrl: "/assets/pets/400/055_月纱兔_1.png" },
  { code: "056", name: "森歌獭", category: "star", coverUrl: "/assets/pets/400/056_森歌獭_1.png" },
  { code: "057", name: "樱铃猫", category: "star", coverUrl: "/assets/pets/400/057_樱铃猫_1.png" },
  { code: "058", name: "泡泡狐", category: "star", coverUrl: "/assets/pets/400/058_泡泡狐_1.png" },
  { code: "059", name: "潮汐獭", category: "star", coverUrl: "/assets/pets/400/059_潮汐獭_1.png" },
  { code: "060", name: "烈焰牛", category: "star", coverUrl: "/assets/pets/400/060_烈焰牛_1.png" },
  { code: "061", name: "玉麒团", category: "star", coverUrl: "/assets/pets/400/061_玉麒团_1.png" },
  { code: "062", name: "电波狸", category: "star", coverUrl: "/assets/pets/400/062_电波狸_1.png" },
  { code: "063", name: "竹团貘", category: "star", coverUrl: "/assets/pets/400/063_竹团貘_1.png" },
  { code: "064", name: "糖霜鹿", category: "star", coverUrl: "/assets/pets/400/064_糖霜鹿_1.png" },
  { code: "065", name: "绒雪喵", category: "star", coverUrl: "/assets/pets/400/065_绒雪喵_1.png" },
  { code: "066", name: "蜜桃狐", category: "star", coverUrl: "/assets/pets/400/066_蜜桃狐_1.png" },
  { code: "067", name: "钢牙鲨", category: "star", coverUrl: "/assets/pets/400/067_钢牙鲨_1.png" },
  { code: "068", name: "雷翼狼", category: "star", coverUrl: "/assets/pets/400/068_雷翼狼_1.png" },
  { code: "069", name: "霓虹豚", category: "star", coverUrl: "/assets/pets/400/069_霓虹豚_1.png" },
  { code: "070", name: "风暴柴", category: "star", coverUrl: "/assets/pets/400/070_风暴柴_1.png" },
  { code: "071", name: "岩角龙", category: "star", coverUrl: "/assets/pets/400/071_岩角龙_1.png" },
  { code: "072", name: "布丁兔", category: "star", coverUrl: "/assets/pets/400/072_布丁兔_1.png" },
  { code: "073", name: "云团熊", category: "star", coverUrl: "/assets/pets/400/073_云团熊_1.png" },
  { code: "074", name: "子鼠宝", category: "zodiac", coverUrl: "/assets/pets/400/074_子鼠宝_1.png" },
  { code: "075", name: "丑牛宝", category: "zodiac", coverUrl: "/assets/pets/400/075_丑牛宝_1.png" },
  { code: "076", name: "寅虎宝", category: "zodiac", coverUrl: "/assets/pets/400/076_寅虎宝_1.png" },
  { code: "077", name: "卯兔宝", category: "zodiac", coverUrl: "/assets/pets/400/077_卯兔宝_1.png" },
  { code: "078", name: "辰龙宝", category: "zodiac", coverUrl: "/assets/pets/400/078_辰龙宝_1.png" },
  { code: "079", name: "巳蛇宝", category: "zodiac", coverUrl: "/assets/pets/400/079_巳蛇宝_1.png" },
  { code: "080", name: "午马宝", category: "zodiac", coverUrl: "/assets/pets/400/080_午马宝_1.png" },
  { code: "081", name: "未羊宝", category: "zodiac", coverUrl: "/assets/pets/400/081_未羊宝_1.png" },
  { code: "082", name: "申猴宝", category: "zodiac", coverUrl: "/assets/pets/400/082_申猴宝_1.png" },
  { code: "083", name: "酉鸡宝", category: "zodiac", coverUrl: "/assets/pets/400/083_酉鸡宝_1.png" },
  { code: "084", name: "戌狗宝", category: "zodiac", coverUrl: "/assets/pets/400/084_戌狗宝_1.png" },
  { code: "085", name: "亥猪宝", category: "zodiac", coverUrl: "/assets/pets/400/085_亥猪宝_1.png" },
];
const PET_STAGE_COUNT = 10;
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
let currentAllHistoryRecords = [];
let currentPetProfileRecords = [];
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
    name: stage?.name || `Lv.${Number(stage?.levelNo || stage?.stageNo || index + 1)}`,
    imageUrl: stage?.imageUrl || "",
    needScoreTotal: Number(stage?.needScoreTotal || 0),
    animationKey: stage?.animationKey || null,
  };
}

function normalizePetCatalogItem(item, index = 0) {
  const stages = Array.isArray(item?.stages)
    ? item.stages.map((stage, stageIndex) => normalizePetStage(stage, stageIndex))
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
  const source = runtimeState.petCatalog.length > 0 ? runtimeState.petCatalog : adoptPetCatalog;
  return normalizePetCatalog(source);
}

function getFilteredAdoptCatalog() {
  const catalog = getAdoptCatalog();
  return catalog.filter(
    (pet) => adoptModalState.family === "all" || resolvePetFamily(pet.category) === adoptModalState.family,
  );
}

function getVisibleAdoptFamilyOptions() {
  const familiesWithPets = new Set(getAdoptCatalog().map((pet) => resolvePetFamily(pet.category)));
  return PET_FAMILY_OPTIONS.filter((option) => option.key === "all" || familiesWithPets.has(option.key));
}

function normalizeAdoptFamilySelection() {
  const options = getVisibleAdoptFamilyOptions();
  if (!options.some((option) => option.key === adoptModalState.family)) {
    adoptModalState.family = "all";
  }
  return options;
}

function getSelectedAdoptPet() {
  return getAdoptCatalog().find((pet) => pet.code === adoptModalState.selectedPetCode) || null;
}

function setAdoptPetFamily(family) {
  const options = getVisibleAdoptFamilyOptions();
  adoptModalState.family = options.some((option) => option.key === family) ? family : "all";
  const filtered = getFilteredAdoptCatalog();
  if (!filtered.some((pet) => pet.code === adoptModalState.selectedPetCode)) {
    adoptModalState.selectedPetCode = filtered[0]?.code || null;
  }
  adoptModalState.previewStageNo = 1;
  renderAdoptPetModal();
}

function previewAdoptPet(petCode, stageNo = 1) {
  adoptModalState.selectedPetCode = petCode;
  adoptModalState.previewStageNo = stageNo;
  adoptModalState.transitionSeed += 1;
  renderAdoptPetGrid();
  if (document.getElementById("adoptPetDetailModal")?.classList.contains("active")) {
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
    (Array.isArray(pet?.stages) ? pet.stages.find((stage) => stage.stageNo === stageNo)?.imageUrl : null) ||
    pet?.coverUrl ||
    ""
  );
}

function renderAdoptFamilyTabs() {
  const tabs = document.getElementById("adoptPetFamilyTabs");
  if (!tabs) return;
  const options = normalizeAdoptFamilySelection();
  tabs.innerHTML = options.map(
    (option) => `
      <button
        type="button"
        class="adopt-family-chip${adoptModalState.family === option.key ? " active" : ""}"
        onclick="setAdoptPetFamily('${option.key}')"
      >
        ${escapeHtml(option.label)}
      </button>`,
  ).join("");
}

function renderAdoptPetGrid() {
  const grid = document.getElementById("adoptPetGrid");
  if (!grid) return;
  const catalog = getFilteredAdoptCatalog();
  if (catalog.length === 0) {
    grid.innerHTML = '<div class="adopt-pet-empty">当前分类下还没有可领养的萌宠。</div>';
    return;
  }
  grid.innerHTML = catalog
    .map((pet) => {
      const familyLabel = resolvePetFamilyLabel(pet.category);
      const categoryLabel = resolvePetCategoryLabel(pet.category);
      const previewStageNo = adoptModalState.selectedPetCode === pet.code ? adoptModalState.previewStageNo : 1;
      const dots = Array.from({ length: PET_STAGE_COUNT }, (_, index) => {
        const stageNo = index + 1;
        const active = index < Math.min(pet.stageCount || pet.stages.length, PET_STAGE_COUNT);
        return `<button type="button" class="adopt-stage-dot${active ? " active" : ""}${previewStageNo === stageNo ? " current" : ""}" title="Lv.${stageNo}" onclick="event.stopPropagation();previewAdoptPet('${pet.code}', ${stageNo})"></button>`;
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
  const nextStage =
    selectedStage ? stages.find((stage) => stage.stageNo === selectedStage.stageNo + 1) || null : null;
  const previousStage =
    selectedStage ? stages.find((stage) => stage.stageNo === selectedStage.stageNo - 1) || null : null;
  const theme = resolvePetTheme(pet.category);
  const coreX = 50;
  const coreY = 66;
  const selectedAngle = 205 - (Math.max(1, previewStageNo) - 1) * 22.8;
  const selectedRadians = (selectedAngle * Math.PI) / 180;
  const selectedNodeX = 50 + Math.cos(selectedRadians) * 43;
  const selectedNodeY = 60 - Math.sin(selectedRadians) * 42;
  const beamDeltaX = coreX - selectedNodeX;
  const beamDeltaY = coreY - selectedNodeY;
  const beamLength = Math.sqrt(beamDeltaX * beamDeltaX + beamDeltaY * beamDeltaY);
  const beamAngle = Math.atan2(beamDeltaY, beamDeltaX) * (180 / Math.PI);
  const particleDots = Array.from({ length: 18 }, (_, index) => {
    const angle = (index / 18) * Math.PI * 2;
    const radius = 26 + (index % 4) * 8;
    const x = 50 + Math.cos(angle) * radius;
    const y = 62 + Math.sin(angle) * (radius * 0.62);
    const size = 4 + (index % 3) * 2;
    const delay = (index % 6) * 0.45;
    const duration = 4.5 + (index % 5) * 0.6;
    return `<span class="adopt-stage-particle p-${(index % 3) + 1}" style="--particle-x:${x.toFixed(2)}%; --particle-y:${y.toFixed(2)}%; --particle-size:${size}px; --particle-delay:${delay}s; --particle-duration:${duration}s;"></span>`;
  }).join("");
  const runeMarks = Array.from({ length: 6 }, (_, index) => {
    const angle = -90 + index * 60;
    return `<span class="adopt-stage-rune rune-${index + 1}" style="--rune-angle:${angle}deg;">✦</span>`;
  }).join("");
  const energyShards = Array.from({ length: 8 }, (_, index) => {
    const angle = -66 + index * 18;
    const radius = index % 2 === 0 ? 34 : 39;
    const delay = (index % 4) * 0.35;
    return `<span class="adopt-stage-shard shard-${index + 1}" style="--shard-angle:${angle}deg; --shard-radius:${radius}%; --shard-delay:${delay}s;"></span>`;
  }).join("");
  const orbitNodes = Array.from({ length: PET_STAGE_COUNT }, (_, index) => {
    const stageNo = index + 1;
    const stage = stages.find((item) => item.stageNo === stageNo);
    const enabled = Boolean(stage);
    const angle = 205 - index * 22.8;
    const radians = (angle * Math.PI) / 180;
    const radiusX = 43;
    const radiusY = 42;
    const x = 50 + Math.cos(radians) * radiusX;
    const y = 60 - Math.sin(radians) * radiusY;
    return `
      <button
        type="button"
        class="adopt-orbit-node${enabled ? " active" : ""}${stageNo <= previewStageNo ? " passed" : ""}${previewStageNo === stageNo ? " current" : ""}"
        style="--node-x:${x.toFixed(2)}%; --node-y:${y.toFixed(2)}%; --pet-accent:${theme.accent}; --pet-glow:${theme.glow};"
        title="Lv.${stageNo}"
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
          onclick="previewAdoptPet('${pet.code}', ${stage.stageNo})"
          style="--pet-accent:${theme.accent}; --pet-accent-soft:${theme.accentSoft};"
        >
          <div class="adopt-stage-chip-image">
            <img src="${resolveAssetUrl(stage.imageUrl)}" alt="${escapeHtml(stage.name || pet.name)}" loading="lazy" onerror="this.src='images/logo.svg'">
          </div>
          <span>Lv.${stage.stageNo}</span>
        </button>`,
    )
    .join("");
  const previewImageUrl = getPetPreviewImage(pet, previewStageNo);
  const highResPreviewUrl = resolvePetAssetVariantUrl(previewImageUrl, getShowcasePetImageSize());
  const fallbackPreviewUrl = resolvePetAssetVariantUrl(previewImageUrl, 400) || "images/logo.svg";
  detail.innerHTML = `
    <div class="adopt-stage-showcase" style="--pet-accent:${theme.accent}; --pet-accent-soft:${theme.accentSoft}; --pet-glow:${theme.glow}; --pet-gradient:${theme.gradient};">
      <div class="adopt-stage-arena">
        <div class="adopt-stage-sigils" aria-hidden="true"></div>
        <div class="adopt-stage-runes" aria-hidden="true">${runeMarks}</div>
        <div class="adopt-stage-particles" aria-hidden="true">${particleDots}</div>
        <div class="adopt-stage-trails" aria-hidden="true"></div>
        <div class="adopt-stage-beam" aria-hidden="true" style="--beam-x:${selectedNodeX.toFixed(2)}%; --beam-y:${selectedNodeY.toFixed(2)}%; --beam-length:${beamLength.toFixed(2)}%; --beam-angle:${beamAngle.toFixed(2)}deg;"></div>
        <div class="adopt-stage-flash" aria-hidden="true"></div>
        <div class="adopt-stage-arc" aria-hidden="true"></div>
        ${orbitNodes}
        <div class="adopt-stage-core">
          <div class="adopt-stage-dais" aria-hidden="true">
            <div class="adopt-stage-dais-grid"></div>
            <div class="adopt-stage-shards">${energyShards}</div>
          </div>
          <div class="adopt-stage-core-badge">Lv.${selectedStage?.stageNo || previewStageNo}</div>
          <div class="adopt-detail-preview" data-transition-seed="${adoptModalState.transitionSeed}">
            <img class="${adoptModalState.transitionSeed > 0 ? "evo-pet-shine" : ""}" src="${highResPreviewUrl}" alt="${escapeHtml(pet.name)}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(fallbackPreviewUrl)}'">
            ${
              adoptModalState.transitionSeed > 0
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
          pet.description || `当前图鉴共配置 ${pet.stageCount || stages.length} 个成长阶段，点击星轨即可切换不同等级形态。`,
        )}</p>
        <div class="adopt-detail-stats">
          <div class="adopt-detail-stat">
            <span>当前等级</span>
            <strong>Lv.${selectedStage?.stageNo || previewStageNo}</strong>
          </div>
          <div class="adopt-detail-stat">
            <span>累计积分</span>
            <strong>${selectedStage?.needScoreTotal ?? 0}</strong>
          </div>
          <div class="adopt-detail-stat">
            <span>下一阶段</span>
            <strong>${nextStage ? `Lv.${nextStage.stageNo}` : "已满级"}</strong>
          </div>
          <div class="adopt-detail-stat">
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
  renderStudentGrid();
}

function getVisibleStudentIndices() {
  const out = [];
  students.forEach((s, i) => {
    if (groupFilter === null || s.group === groupFilter) out.push(i);
  });
  return out;
}

function toggleBatchMode() {
  batchMode = !batchMode;
  const btn = document.getElementById("batchToggleBtn");
  const bar = document.getElementById("batchBar");
  if (btn) btn.classList.toggle("active", batchMode);
  if (bar) bar.classList.toggle("hide", !batchMode);
  if (!batchMode) batchSelectedNames.clear();
  updateBatchCount();
  renderStudentGrid();
}

function toggleBatchSelect(name, ev) {
  if (ev) ev.stopPropagation();
  if (batchSelectedNames.has(name)) batchSelectedNames.delete(name);
  else batchSelectedNames.add(name);
  updateBatchCount();
  renderStudentGrid();
}

function clearBatchSelection() {
  batchSelectedNames.clear();
  updateBatchCount();
  renderStudentGrid();
}

function updateBatchCount() {
  const t = document.getElementById("batchCountText");
  if (t) t.textContent = "已选 " + batchSelectedNames.size + " 人";
}

function openGroupPointForFilter() {
  if (groupFilter === null) {
    showDisplayToast("请先在「小组」中选择一个组，或使用「分组管理」为学生分组。");
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
  if (!canAdoptPet()) {
    showDisplayToast("萌宠领养仅允许班主任或管理员执行");
    return;
  }
  adoptTargetName = studentName;
  const t = document.getElementById("adoptModalTitle");
  if (t) t.textContent = studentName + " · 选择萌宠";
  adoptModalState.family = "all";
  adoptModalState.previewStageNo = 1;
  adoptModalState.detailEntrySource = "adopt";
  if (runtimeState.petCatalog.length === 0) {
    const petCatalog = await apiFetch("/display/pet-catalog").catch(() => adoptPetCatalog);
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
  const s = students.find((x) => x.name === adoptTargetName);
  if (!s || s.hasPet !== false) return;
  if (!runtimeState.token || !runtimeState.classId) {
    showDisplayToast("请先登录班主任账号");
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
  const selectedPet = getAdoptCatalog().find((pet) => pet.code === petCode) || null;
  const fallbackPetImageUrl = selectedPet ? getPetPreviewImage(selectedPet, 1) : null;
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
    await bootstrapDisplayData({ authenticated: true, silent: true });
    const adoptedStudent =
      students.find((student) => Number(student.id) === Number(s.id)) ||
      {
        ...s,
        hasPet: true,
        petName: selectedPet?.name || "星宠",
        petImageUrl: fallbackPetImageUrl,
        lv: 1,
      };
    showGlobalPetAdoptAnimation(adoptedStudent);
  } catch (error) {
    showDisplayToast(error.message || "领养失败");
  }
}

function openGroupManageModal() {
  if (!isHomeroomTeacher()) {
    showDisplayToast("分组管理仅允许班主任执行");
    return;
  }
  groupManageDraft = {
    groups: getGroupOptions().map((option) => ({
      id: option.id,
      groupNo: Number(option.groupNo),
      name: option.name || `第${option.groupNo}组`,
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
}

async function closeGroupManageModal() {
  if (groupManageDraft) {
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
            title="删除小组"
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
    .map((group) => `<option value="${group.groupNo}">${escapeHtml(group.name)}</option>`)
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
  const used = new Set(groupManageDraft.groups.map((group) => Number(group.groupNo)));
  let groupNo = 1;
  while (used.has(groupNo)) groupNo += 1;
  groupManageDraft.groups.push({
    id: null,
    groupNo,
    name: `第${groupNo}组`,
  });
  renderGroupManageDraft();
  await persistGroupManageChanges("新增小组失败");
}

async function renameGroupManageGroup(groupNo, name, silent = false) {
  if (!groupManageDraft) return;
  const group = groupManageDraft.groups.find((item) => item.groupNo === Number(groupNo));
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
  const assignedCount = Array.from(groupManageDraft.assignments.values()).filter(
    (value) => Number(value) === targetNo,
  ).length;
  if (assignedCount > 0) {
    const confirmed = await showConfirmModal({
      tone: "warn",
      badge: "删除小组",
      icon: "fa-layer-group",
      title: "确认删除这个小组吗？",
      description: `当前有 ${assignedCount} 名学生在该小组。确认删除后，这些学生会变为未分组。`,
      confirmText: "删除小组",
    });
    if (!confirmed) return;
  }
  groupManageDraft.groups = groupManageDraft.groups.filter((group) => group.groupNo !== targetNo);
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
  const groupNos = new Set(groupManageDraft.groups.map((group) => Number(group.groupNo)));
  return groupManageDraft.groups.map((option) => ({
    id: option.id,
    groupNo: Number(option.groupNo),
    name: option.name || `第${option.groupNo}组`,
    studentIds: students
      .filter((student, index) => {
        const assignedGroupNo = groupManageDraft.assignments.get(getStudentDraftKey(student, index));
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

function applyGroupManageDraftToStudents() {
  if (!groupManageDraft) return;
  students.forEach((student, index) => {
    const assignedGroupNo = groupManageDraft.assignments.get(getStudentDraftKey(student, index));
    const group = groupManageDraft.groups.find((item) => Number(item.groupNo) === Number(assignedGroupNo));
    student.group = group ? group.groupNo : null;
    student.groupName = group ? group.name : null;
  });
}

async function persistGroupManageChanges(errorMessage = "保存分组失败", options = {}) {
  const renderAfter = options.renderAfter !== false;
  window.clearTimeout(groupManagePersistTimer);
  if (!runtimeState.token || !runtimeState.classId) {
    showDisplayToast("请先登录班主任账号");
    return;
  }
  if (!isHomeroomTeacher()) {
    showDisplayToast("分组管理仅允许班主任执行");
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
      const latestGroups = await apiFetch(`/classes/${runtimeState.classId}/groups`).catch(() => null);
      if (!groupManageDraft) return;
      if (Array.isArray(latestGroups)) {
        runtimeState.groups = latestGroups;
        const idByGroupNo = new Map(latestGroups.map((group) => [Number(group.groupNo), group.id || null]));
        groupManageDraft.groups.forEach((group) => {
          group.id = idByGroupNo.get(Number(group.groupNo)) || group.id || null;
        });
      } else {
        runtimeState.groups = groupManageDraft.groups.map((group) => ({ ...group }));
      }
      updateGroupToolbar();
      if (renderAfter) {
        renderStudentGrid();
        renderGroupManageDraft();
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

/* ========== 渲染学生卡片 ========== */
function renderStudentGrid(options = {}) {
  const grid = document.getElementById("studentGrid");
  if (!grid) return;
  const indices = getVisibleStudentIndices();
  const renderKey = studentGridRenderSignature(indices);
  if (!options.force && runtimeState.studentGridRenderKey === renderKey && grid.childElementCount > 0) {
    initPetPkInteractions();
    return;
  }
  runtimeState.studentGridRenderKey = renderKey;
  const escName = (n) =>
    String(n || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");
  
  const innerHtmlStr = indices
    .map((realIdx, visPos) => {
      const s = students[realIdx];
      const rankClass =
        visPos === 0
          ? "rank-1"
          : visPos === 1
            ? "rank-2"
            : visPos === 2
              ? "rank-3"
              : "";
      const badge =
        visPos < 3 ? `<span class="card-rank-badge">${visPos + 1}</span>` : "";
      const noPet = s.hasPet === false;
      const batchOn = batchMode;
      const sel = batchSelectedNames.has(s.name);
      const topRight = batchOn
        ? `<input type="checkbox" class="card-batch-check" ${sel ? "checked" : ""} onclick="toggleBatchSelect('${s.name.replace(/'/g, "\\'")}', event)">`
        : `<span class="card-group-tag">${escapeHtml(s.groupName || getGroupLabel(s.group))}</span>`;
      const noPetClass = noPet ? " no-pet" : "";
      const batchCls = batchOn && sel ? " batch-selected" : "";
      const modeCls = batchOn ? " batch-mode" : "";
      const qn = s.name.replace(/'/g, "\\'");
      const avatarBlock = noPet
        ? `<button type="button" class="card-pet-trigger card-pet-trigger--seed" title="孕育星宠" onclick="event.stopPropagation();openAdoptModal('${qn}')"><img class="card-pet-img card-pet-img--seed" src="${petImg(s)}" alt="待孕育星种" loading="lazy" draggable="false" onerror="this.src='images/logo.svg'"><span class="card-nameplate-placeholder">待孕育</span></button>`
        : `<button type="button" class="card-pet-trigger" title="查看萌宠档案" data-student-name="${escName(s.name)}"><img class="card-pet-img" src="${petImg(s)}" alt="${escapeHtml(s.petName || `${s.name}的萌宠`)}" loading="lazy" draggable="false" onerror="this.src='images/logo.svg'"></button>`;
      return `
      <div class="student-card ${rankClass}${noPetClass}${batchCls}${modeCls}" data-student-id="${s.id ?? ""}" data-student-name="${escName(s.name)}">
        ${topRight}
        ${badge}
        ${avatarBlock}
        <div class="card-name">${s.name}</div>
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
      onBeforeElUpdated: function(fromEl, toEl) {
        if (fromEl.isEqualNode && fromEl.isEqualNode(toEl)) {
          return false;
        }
        return true;
      }
    });
  } else {
    grid.innerHTML = innerHtmlStr;
  }
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
    petPkState.hoverTargetCard.classList.remove("pk-drop-ready");
    petPkState.hoverTargetCard = null;
  }
  if (petPkState.targetLockEl) {
    petPkState.targetLockEl.classList.remove("active");
  }
  petPkState.lastHoverName = "";
}

function clearPetPkSource() {
  petPkState.sourceCard?.classList.remove("pk-source-active");
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
  if (!card) return;
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

function updatePetPkTargetLock(card) {
  const lock = ensurePetPkTargetLock();
  const rect = card.getBoundingClientRect();
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
    const hit = cachedRects.find(item => {
      return (
        clientX >= item.rect.left &&
        clientX <= item.rect.right &&
        clientY >= item.rect.top &&
        clientY <= item.rect.bottom
      );
    });
    if (hit) validTarget = hit.card;
  } else {
    const visibleCards = Array.from(document.querySelectorAll(".page.active .student-card"));
    const geometryTarget =
      visibleCards.find((card) => {
        if (card === sourceCard || !card.querySelector(".card-pet-trigger")) return false;
        const rect = card.getBoundingClientRect();
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      }) || null;
    const stack = geometryTarget ? [] : document.elementsFromPoint(clientX, clientY);
    const targetCard =
      geometryTarget ||
      stack.find((node) => {
        if (!(node instanceof Element)) return false;
        const card = node.closest?.(".student-card");
        return card && card !== sourceCard;
      })?.closest?.(".student-card") || null;
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
    updatePetPkTargetLock(validTarget);
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
  overlay.classList.remove("active");
  overlay.classList.remove("countdown-active");
  overlay.classList.remove("impact-active");
  overlay.classList.remove("climax-active");
  overlay.classList.remove("result-active");
  overlay.classList.remove("winner-left");
  overlay.classList.remove("winner-right");
  overlay.classList.remove("winner-draw");
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

  const result = getPetPkResult(sourceStudent, targetStudent);
  resultTitleEl.textContent = result.title;
  resultNameEl.textContent = result.name;
  resultMetaEl.textContent = result.meta;
  resultEl.setAttribute("aria-hidden", "true");

  overlay.classList.add("active");
  overlay.classList.add("countdown-active");
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
    resultEl.setAttribute("aria-hidden", "true");
  }, 6900);
}

function startPetPkDrag(trigger, event) {
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
  const startX = event.clientX;
  const startY = event.clientY;
  const moveThreshold = 14;

  petPkState.sourceCard = sourceCard;
  petPkState.sourceTrigger = trigger;
  
  const visibleCards = Array.from(document.querySelectorAll(".page.active .student-card"));
  const cachedRects = visibleCards
    .filter(card => card !== sourceCard && card.querySelector(".card-pet-trigger"))
    .map(card => ({
      card,
      rect: card.getBoundingClientRect()
    }));

  const onMove = (moveEvent) => {
    const clientX = moveEvent.clientX;
    const clientY = moveEvent.clientY;
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

    const targetCard = updatePetPkHoverTarget(sourceCard, clientX, clientY, cachedRects);
    updatePetPkDragAtmosphere(clientX, clientY, Boolean(targetCard));
    ensurePetPkProxy(trigger, clientX, clientY, Boolean(targetCard));
  };

  const onEnd = () => {
    const targetName =
      petPkState.hoverTargetCard?.getAttribute("data-student-name") || "";
    const targetStudent = students.find((item) => item.name === targetName);

    finishPetPkDrag();

    if (moved && targetStudent && targetStudent.hasPet !== false) {
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
      afterLevel: Number.isFinite(afterLevel) && afterLevel > 0 ? afterLevel : null,
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
  overlay.classList.remove("active");
  overlay.classList.remove("adopt-mode");
  if (energyContainer) energyContainer.innerHTML = "";
  void overlay.offsetWidth;

  /* 提取并设置专属色彩属性 */
  let petH = null, petS = null, petL = null;
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
      extractId = String(student.petId).padStart(3, '0');
    }

    if (extractId && window.PET_THEME_COLORS[extractId]) {
      const theme = window.PET_THEME_COLORS[extractId];
      petH = theme.h;
      petS = theme.s;
      petL = theme.l;
    }
  }

  if (petH !== null) {
    overlay.style.setProperty('--pet-theme-h', petH);
    overlay.style.setProperty('--pet-theme-s', `${petS}%`);
    overlay.style.setProperty('--pet-theme-l', `${petL}%`);
    overlay.style.setProperty('--pet-theme-energy', `hsla(${petH}, ${petS}%, ${Math.min(100, petL + 20)}%, 0.9)`);
    overlay.style.setProperty('--pet-theme-energy-fade', `hsla(${petH}, ${petS}%, ${Math.min(100, petL + 20)}%, 0)`);
  } else {
    overlay.style.removeProperty('--pet-theme-h');
    overlay.style.removeProperty('--pet-theme-s');
    overlay.style.removeProperty('--pet-theme-l');
    overlay.style.removeProperty('--pet-theme-energy');
    overlay.style.removeProperty('--pet-theme-energy-fade');
  }

  /* 设置内容 */
  const showcaseImageSize = getShowcasePetImageSize();
  if (seed) {
    seed.src = resolvePetAssetVariantUrl(STAR_SEED_IMAGE_URL, showcaseImageSize);
  }
  avatar.src = petImgVariant(student, showcaseImageSize);
  avatar.onerror = () => {
    avatar.onerror = null;
    avatar.src = petImgVariant(student, 400);
  };
  avatar.alt = `${student.petName || student.name || "萌宠"} 升级形态`;
  text.textContent = `Lv.${afterLevel || student.lv || 1} 发育进化`;
  studentName.textContent = `${student.name || "该学生"} 的 ${student.petName || "萌宠"} 升级了`;

  /* 激活动画 */
  overlay.classList.add("active");

  /* 启动Canvas粒子爆炸效果 */
  let particleRAF = null;
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const effectBudget = getDisplayEffectBudget();
    const canvasScale = effectBudget.upgradeCanvasScale;
    const w = canvas.width = Math.max(1, Math.round(window.innerWidth * canvasScale));
    const h = canvas.height = Math.max(1, Math.round(window.innerHeight * canvasScale));
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const cx = w / 2;
    const cy = h / 2;
    const particles = [];
    const startTime = performance.now();

    // 识别宠物题材流派 (用于生成不同的专属粒子物理与绘制形态)
    let archetype = "default";
    const petNameStr = student.petName || "";
    const isZodiac = student.category === "zodiac" || (student.petId && Number(student.petId) >= 74);
    
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
      let rot = Math.PI / 2 * 3;
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
      c.quadraticCurveTo(px + size, py - size / 2, px + size / 2, py - size / 2);
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
      const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.4;
      const speed = (2 + Math.random() * 6) * canvasScale;
      const isGold = Math.random() > 0.3;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: (1.5 + Math.random() * 3) * canvasScale,
        life: 0.6 + Math.random() * 0.6,
        born: 0.4 + Math.random() * 0.3,
        color: petH !== null 
          ? `hsla(${petH + (Math.random() - 0.5) * 20}, ${petS}%, ${petL + (Math.random() - 0.5) * 15}%, `
          : (isGold
            ? `hsla(${40 + Math.random() * 15}, 90%, ${55 + Math.random() * 20}%, `
            : `hsla(0, 0%, ${85 + Math.random() * 15}%, `),
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
        color: petH !== null 
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
      const globalFade = elapsed > 4.8 ? Math.max(0, 1 - (elapsed - 4.8) / 0.8) : 1;

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

          const alpha = Math.max(0, (1 - age / p.life)) * globalFade;
          const sparkleAlpha = alpha * (0.6 + 0.4 * Math.sin(elapsed * 8 + p.sparkle * 10));
          const currentRadius = p.r * (1 - age / p.life * 0.5);

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

          if (p.y < -30) { p.y = h + 30; p.x = Math.random() * w; }
          const baseAlpha = 0.3 + 0.3 * Math.sin(elapsed * 2.5 + p.phase);
          const alpha = baseAlpha * globalFade;

          drawParticleShape(ctx, p, p.r, alpha, elapsed);
        }
      });
      particleRAF = requestAnimationFrame(drawParticles);
    }
    particleRAF = requestAnimationFrame(drawParticles);
  }

  /* 生成能量聚合线条 — 从四周汇聚到中心 */
  if (energyContainer) {
    setTimeout(() => {
      const lineCount = getDisplayEffectBudget().upgradeEnergyLines;
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
    overlay.classList.remove("active");
    overlay.classList.remove("adopt-mode");
    if (particleRAF) cancelAnimationFrame(particleRAF);
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (energyContainer) energyContainer.innerHTML = "";
    if (typeof onComplete === "function") onComplete();
  }, 5600);
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
    studentName.textContent = `${student.name || "该学生"} 孕育出了 ${student.petName || "星宠"}`;
  }
}

/* ========== 渲染今日排行 ========== */
function renderTodayRank() {
  const wrap = document.getElementById("todayRank");
  wrap.innerHTML = students
    .slice(0, 5)
    .map((s, i) => {
      const cls = i === 0 ? "r1" : i === 1 ? "r2" : i === 2 ? "r3" : "rn";
      const sub = s.hasPet === false ? "待孕育星种" : `${s.petName} · Lv.${s.lv}`;
      return `
      <div class="rank-item">
        <span class="rank-num ${cls}">${i + 1}</span>
        <img class="rank-pet-sm" src="${petImg(s)}" alt="${sub}">
        <div class="rank-info">
          <div class="rank-name">${s.name}</div>
          <div class="rank-pts">${sub}</div>
        </div>
        <span style="color:var(--honor-gold);font-weight:700;font-size:14px;">${s.pts}</span>
      </div>`;
    })
    .join("");
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
      <img class="lb-row-pet" src="${petImg(s)}" alt="${s.hasPet === false ? "待孕育星种" : s.petName}">
      <div class="lb-row-info">
        <div class="lb-row-name">${s.name}</div>
        <div class="lb-row-petname">${s.hasPet === false ? "待孕育星种" : s.petName}</div>
      </div>
      <div class="lb-row-right">
        <span class="lb-row-lv">Lv.${s.lv}</span>
        <span class="lb-row-xp">${s.pts} XP</span>
      </div>
    </div>`,
    )
    .join("");
}

/* ========== 页面导航 ========== */
const pageMap = {
  entry: "page-entry",
  setup: "page-setup",
  login: "page-login",
  transition: "page-transition",
  classroom: "page-classroom",
  academic: "page-academic",
  leaderboard: "page-leaderboard",
  exchange: "page-exchange",
};

function navigateTo(key) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  const target = document.getElementById(pageMap[key]);
  if (target) {
    target.classList.add("active");
    if (key === "exchange") {
      const stars = target.querySelector(".deco-stars");
      if (stars && !stars.hasChildNodes()) {
        createDecoStars("exStars", 28);
      }
    }
    if (key === "classroom") {
      setTimeout(() => {
        const bar = document.getElementById("goalBar");
        if (bar) bar.style.width = "81.9%";
      }, 300);
    }
    if (key === "academic") {
      renderAcademicGrowth();
      /* 未来感增强：过场动画 → 粒子星网全屏展示 → 淡出 → 面板入场 */
      if (!isStandardDisplay()) {
        startAcademicSplash(target);
      }
    }
    /* 离开 academic 页时清理粒子动画 */
    if (key !== "academic") {
      cleanupAcademicParticles();
      cleanupAcademicSplash();
    }
  }

  document.querySelectorAll(".bottom-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.target === key);
  });
  if (key === "login") {
    setLoginMessage("");
    hydrateLoginCredentials();
  }
  if (key === "entry") {
    runtimeState.lockOverlayForced = false;
  }
  if (typeof applyLockOverlay === "function") {
    applyLockOverlay();
  }
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
}

function confirmExchange(studentName) {
  const s = students.find((x) => x.name === studentName);
  if (!s || s.pts < currentExchangeCost) return;

  s.pts -= currentExchangeCost;
  reorderStudents();

  renderStudentGrid();
  renderTodayRank();
  renderLeaderboardList();

  closeSelectStudentModal();
  showExchangeSuccess(currentExchangeItem, s.name, currentExchangeCost);
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
  document.getElementById("transFlash").classList.remove("active");
  document.getElementById("skipBtn").style.display = "block";
}

function startTransitionAnimation() {
  clearTransTimers();
  resetTransitionPage();

  const bg = document.getElementById("transBg");
  const overlay = document.getElementById("transOverlay");
  const glow = document.getElementById("transGlow");
  const progress = document.getElementById("transProgress");
  const canvas = document.getElementById("transParticles");
  const stage1 = document.getElementById("transStage1");
  const stage2 = document.getElementById("transStage2");
  const cls = document.getElementById("transClass");
  const flash = document.getElementById("transFlash");
  const skip = document.getElementById("skipBtn");

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

  /* 白闪 + 跳转准备：7.2s */
  transTimers.push(
    setTimeout(() => {
      flash.classList.add("active");
      skip.style.display = "none";
    }, 7200),
  );

  /* 跳转到班级页：8s */
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
    }, 8000),
  );
}

function skipTransition() {
  clearTransTimers();
  navigateTo("classroom");
}

function initTransParticles(canvas) {
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
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".lb-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
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
  chip.title = payload.title || label;
  icon.className = `fa-solid ${payload.icon || "fa-cloud-sun"}`;
}

async function refreshDisplayWeather() {
  updateWeatherDisplay({
    label: "天气加载中",
    title: "正在获取实时天气",
    icon: "fa-cloud-sun",
  });
  try {
    const weatherData = await apiFetchWithToken(`/display/weather`, null);
    updateWeatherDisplay({
      label: weatherData.label || "当前城市",
      title: weatherData.title || "天气接口暂时不可用",
      icon: weatherData.icon || "fa-cloud",
    });
  } catch (error) {
    updateWeatherDisplay({
      label: "当前城市",
      title: "天气接口暂时不可用",
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
  createDecoDots("classroomDots", 25);
  createDecoStars("lbStars", 40);
});

/* ========== 视差与交互逻辑 ========== */
document.addEventListener("DOMContentLoaded", () => {
  initDisplayParallax();

  const interactSelectors = [
    ".student-card",
    ".lb-entry-card",
    ".star-wrap",
    ".podium-slot",
    ".lb-row",
  ];
  interactSelectors.forEach((sel) =>
    document.querySelectorAll(sel).forEach(makeInteractive),
  );

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          interactSelectors.forEach((sel) => {
            if (node.matches && node.matches(sel)) makeInteractive(node);
            node.querySelectorAll(sel).forEach(makeInteractive);
          });
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
});

function initDisplayParallax() {
  const parallaxLayers = document.querySelectorAll(
    ".deco-dots, .deco-stars, #transBg",
  );
  document.addEventListener("mousemove", (e) => {
    if (isStandardDisplay()) return;
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

function makeInteractive(card) {
  if (card.classList.contains("interact-card")) return;
  card.classList.add("interact-card");
  let bounds, startX, startY;
  let moveX = 0,
    moveY = 0;
  let isDragging = false;
  let hasMoved = false;
  let pkSourceStudent = null;
  let lastMagneticTarget = null;
  let dragFrame = 0;
  let pendingDragTransform = "";

  const applyDragTransform = (transformValue) => {
    pendingDragTransform = transformValue;
    if (dragFrame) return;
    dragFrame = window.requestAnimationFrame(() => {
      dragFrame = 0;
      card.style.transform = pendingDragTransform;
    });
  };

  // 考虑到大屏端为触控设备，为保障性能与防止粘滞，移除了原有的卡片 3D Tilt 跟手效果

  const onStart = (e) => {
    if (
      e.target.closest("a") ||
      (!batchMode && e.target.closest("button")) ||
      e.target.closest("input") ||
      e.target.closest(".card-nameplate--empty")
    )
      return;
    isDragging = true;
    hasMoved = false;
    pkSourceStudent = card.classList.contains("student-card")
      ? getStudentByCard(card)
      : null;
    card.classList.remove("snapping");
    if (!batchMode) {
      card.classList.add("dragging");
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startX = clientX - moveX;
    startY = clientY - moveY;

    document.addEventListener("mousemove", onMove, { passive: false });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  };

  const onMove = (e) => {
    if (!isDragging) return;
    if (batchMode) return;
    e.preventDefault();
    hasMoved = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    moveX = clientX - startX;
    moveY = clientY - startY;

    let scaleBoost = 1.08;
    let rotZ = Math.max(-9, Math.min(9, moveX * 0.045));

    if (
      pkSourceStudent &&
      pkSourceStudent.hasPet !== false &&
      !batchMode
    ) {
      card.classList.add("pk-source-active");
      const magneticTarget = updatePetPkHoverTarget(card, clientX, clientY);
      updatePetPkDragAtmosphere(clientX, clientY, Boolean(magneticTarget));
      if (magneticTarget) {
        const targetRect = magneticTarget.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const dx = targetCenterX - clientX;
        scaleBoost = 1.11;
        rotZ += Math.max(-4, Math.min(4, dx * 0.01));
        card.classList.add("pk-magnetic");
        lastMagneticTarget = magneticTarget;
      } else {
        card.classList.remove("pk-magnetic");
        lastMagneticTarget = null;
      }
    }

    applyDragTransform(`translate(${moveX}px, ${moveY}px) rotateZ(${rotZ}deg) scale(${scaleBoost})`);
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onEnd);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onEnd);

    // 修复 Bug：无论拖拽还是点击，都必须移除 dragging 状态
    card.classList.remove("dragging");
    card.classList.remove("pk-source-active");
    card.classList.remove("pk-magnetic");
    lastMagneticTarget = null;

    const targetCard = petPkState.hoverTargetCard;
    const targetStudent =
      pkSourceStudent && targetCard
        ? getStudentByCard(targetCard)
        : null;
    clearPetPkDragAtmosphere();
    clearPetPkHoverTarget();

    if (hasMoved) {
      card.classList.add("snapping");

      moveX = 0;
      moveY = 0;
      applyDragTransform(`translate(0px, 0px) perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`);

      setTimeout(() => {
        card.classList.remove("snapping");
      }, 600);

      if (
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
    } else {
      const name = card.getAttribute("data-student-name");
      if (name !== null) {
        card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        if (batchMode) {
          toggleBatchSelect(name, { stopPropagation() {} });
        } else {
          openPointModalByName(name, card);
        }
      }
    }
    pkSourceStudent = null;
  };

  card.addEventListener("mousedown", onStart);
  card.addEventListener("touchstart", onStart, { passive: false });
}

/* ========== 加减分弹窗处理 ========== */
let currentFocusStudent = null;
let confirmModalResolver = null;
let displayToastTimer = null;

function showDisplayToast(message, options = {}) {
  const toast = document.getElementById("displayToast");
  if (!toast) return;
  const text = String(message || "").trim();
  if (!text) return;
  window.clearTimeout(displayToastTimer);
  toast.textContent = text;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("active"));
  displayToastTimer = window.setTimeout(() => {
    toast.classList.remove("active");
    window.setTimeout(() => {
      if (!toast.classList.contains("active")) {
        toast.hidden = true;
      }
    }, 240);
  }, options.duration || 2800);
}

window.alert = (message) => showDisplayToast(message);

function closeConfirmModal(confirmed = false) {
  document.getElementById("confirmModal")?.classList.remove("active");
  if (confirmModalResolver) {
    const resolver = confirmModalResolver;
    confirmModalResolver = null;
    resolver(confirmed);
  }
}

function bindConfirmModalButton(button, action) {
  if (!button) return;
  button.__displayConfirmAction = action;
  if (button.__displayConfirmBound) return;
  button.__displayConfirmBound = true;
  button.__displayLastDirectPressAt = 0;

  const activate = (event, source) => {
    if (button.disabled) return;
    const now = Date.now();
    if (source === "click" && now - button.__displayLastDirectPressAt < 500) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (source !== "click") {
      button.__displayLastDirectPressAt = now;
    }
    event.preventDefault();
    event.stopPropagation();
    button.__displayConfirmAction?.(event);
  };

  button.addEventListener("click", (event) => activate(event, "click"));
  button.addEventListener("pointerup", (event) => {
    if (event.pointerType === "mouse") return;
    if (event.button !== undefined && event.button !== 0) return;
    activate(event, "pointerup");
  });
  button.addEventListener(
    "touchend",
    (event) => {
      if (window.PointerEvent) return;
      activate(event, "touchend");
    },
    { passive: false },
  );
}

function showConfirmModal(options = {}) {
  const overlay = document.getElementById("confirmModal");
  const badge = document.getElementById("confirmModalBadge");
  const badgeText = document.getElementById("confirmModalBadgeText");
  const badgeIcon = document.getElementById("confirmModalBadgeIcon");
  const title = document.getElementById("confirmModalTitle");
  const desc = document.getElementById("confirmModalDesc");
  const cancelBtn = document.getElementById("confirmModalCancelBtn");
  const confirmBtn = document.getElementById("confirmModalConfirmBtn");
  if (
    !overlay ||
    !badge ||
    !badgeText ||
    !badgeIcon ||
    !title ||
    !desc ||
    !cancelBtn ||
    !confirmBtn
  ) {
    return Promise.resolve(false);
  }

  const tone = options.tone || "danger";
  badge.classList.remove("danger", "warn", "success");
  badge.classList.add(tone);
  confirmBtn.classList.remove("warn", "success");
  if (tone === "warn" || tone === "success") {
    confirmBtn.classList.add(tone);
  }

  badgeText.textContent = options.badge || "操作确认";
  badgeIcon.className = `fa-solid ${options.icon || "fa-shield-halved"}`;
  title.textContent = options.title || "请确认本次操作";
  desc.textContent = options.description || "确认后将继续执行当前操作。";
  cancelBtn.textContent = options.cancelText || "取消";
  confirmBtn.textContent = options.confirmText || "确认";

  bindConfirmModalButton(cancelBtn, () => closeConfirmModal(false));
  bindConfirmModalButton(confirmBtn, () => closeConfirmModal(true));
  overlay.onclick = (event) => {
    if (event.target === overlay) {
      closeConfirmModal(false);
    }
  };
  overlay.classList.add("active");

  return new Promise((resolve) => {
    confirmModalResolver = resolve;
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
  closeMoreRulePanel();
  closeAllHistoryModal();
  document.getElementById("pointModal").classList.remove("active");
  currentFocusStudent = null;
  setAllHistoryButtonState({ visible: false });
  currentAllHistoryRecords = [];
}

function closePetProfileModal() {
  closePetProfileAllHistoryModal();
  document.getElementById("petProfileModal")?.classList.remove("active");
  currentProfileStudent = null;
  currentPetProfileRecords = [];
  setPetProfileAllHistoryButtonState({ visible: false });
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
    showDisplayToast(`暂未在图鉴中找到名为 "${petName || "未知"}" 的萌宠进化详情。`);
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
  renderPetProfileAllHistoryModal(currentProfileStudent.name, currentPetProfileRecords);
  overlay.onclick = (event) => {
    if (event.target === overlay) {
      closePetProfileAllHistoryModal();
    }
  };
  overlay.classList.add("active");
}

function closePetProfileAllHistoryModal() {
  document.getElementById("petProfileAllHistoryModal")?.classList.remove("active");
}

function renderPetProfileLoading() {
  const history = document.getElementById("petProfileHistory");
  setPetProfileAllHistoryButtonState({ visible: true, enabled: false, text: "加载中..." });
  if (history) {
    history.innerHTML = '<div class="pet-profile-loading">正在加载积分记录...</div>';
  }
}

function renderPetProfile(student, records = []) {
  currentProfileStudent = student;
  currentPetProfileRecords = Array.isArray(records) ? records : [];
  const modal = document.getElementById("petProfileModal");
  const avatar = document.getElementById("petProfileAvatar");
  const title = document.getElementById("petProfileTitle");
  const subtitle = document.getElementById("petProfileSubtitle");
  const currentScore = document.getElementById("petProfileCurrentScore");
  const totalScore = document.getElementById("petProfileTotalScore");
  const level = document.getElementById("petProfileLevel");
  const status = document.getElementById("petProfileStatus");
  const infoList = document.getElementById("petProfileInfoList");
  const history = document.getElementById("petProfileHistory");
  if (
    !modal ||
    !avatar ||
    !title ||
    !subtitle ||
    !currentScore ||
    !totalScore ||
    !level ||
    !status ||
    !infoList ||
    !history
  ) {
    return;
  }

  const petName = student.petName || "未命名萌宠";
  avatar.src = petImgVariant(student, 1024);
  avatar.onerror = () => {
    avatar.onerror = null;
    avatar.src = petImgVariant(student, 400);
  };
  avatar.alt = `${student.name}的萌宠`;
  title.textContent = `${student.name} · ${petName}`;
  subtitle.textContent = `Lv.${student.lv || 1} · ${student.petStageName || "当前形态"}`;
  currentScore.textContent = String(student.pts || 0);
  totalScore.textContent = String(student.totalScore || 0);
  level.textContent = `Lv.${student.lv || 1}`;
  status.textContent = student.hasPet === false ? "未领养" : "已领养";

  infoList.innerHTML = [
    ["萌宠名称", petName],
    ["当前形态", student.petStageName || `Lv.${student.lv || 1}`],
    ["萌宠累计积分", String(student.petTotalScore || student.totalScore || 0)],
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

  modal.classList.add("active");
}

async function openPetProfileByName(name) {
  const student = students.find((item) => item.name === name);
  if (!student || student.hasPet === false) return;
  renderPetProfile(student, []);
  renderPetProfileLoading();
  document.getElementById("petProfileModal")?.classList.add("active");
  if (!student.id) return;
  const records = await loadPetProfileRecords(student.id).catch(() => []);
  renderPetProfile(student, records);
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
  if (currentFocusStudent === null) return;
  const ctx = currentFocusStudent;
  let targetText = "当前对象";
  if (ctx.type === "single") {
    targetText = students[ctx.idx]?.name || "当前学生";
  } else if (ctx.type === "batch") {
    targetText = `已选 ${ctx.names.length} 名学生`;
  } else if (ctx.type === "group") {
    targetText = `第 ${ctx.group} 组`;
  }
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
  user: null,
  scopes: [],
  classAssignments: [],
  availableClasses: [],
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
  classCountdownTimer: null,
  lockStatus: "locked",
  unlockSessionId: null,
  unlockedUntil: null,
  lastLockedAt: null,
  lockOverlayForced: false,
  pendingLoginResult: null,
  setupStep: 1,
  setupMode: "initialize",
  selectedSetupClassId: null,
  selectedSetupGradeName: "",
  setupClassGridDrag: null,
  socket: null,
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
  scoreGridReorderTimer: null,
  scoreGridReorderDueAt: 0,
  metaPollTimer: null,
};

const displayRulePanelState = {
  activeType: "add",
  searchKeyword: "",
  sceneCode: "all",
};

const DISPLAY_SCENE_LABELS = {
  attendance: "出勤",
  behavior: "行为规范",
  classroom: "课堂",
  competition: "竞赛",
  dictation: "听写默写",
  discipline: "纪律",
  equipment: "器材设备",
  exam: "测评",
  group: "小组合作",
  homework: "作业",
  presentation: "展讲",
  qa: "答疑互动",
  reading: "早读",
  recitation: "背诵",
  self_study: "自习",
  activity: "活动",
};

const DISPLAY_LOGIN_CREDENTIALS_KEY =
  "yuyingpets_display_login_credentials";
const DISPLAY_LOGIN_ACCOUNTS_KEY = "yuyingpets_display_login_accounts";
const DISPLAY_SETUP_LAST_USERNAME_KEY =
  "yuyingpets_display_setup_last_username";
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

function getDisplayPerformanceTier() {
  const params = new URL(window.location.href).searchParams;
  if (params.get("highQuality") === "1" || params.get("quality") === "high") {
    return "high";
  }
  if (params.get("lowMemory") === "1" || params.get("quality") === "standard") {
    return "standard";
  }
  const deviceMemory = Number(navigator.deviceMemory || 0);
  const cores = Number(navigator.hardwareConcurrency || 0);
  const isWindows = /Windows/i.test(navigator.userAgent || "");
  if ((deviceMemory > 0 && deviceMemory <= 4) || (isWindows && cores > 0 && cores <= 4)) {
    return "standard";
  }
  return "high";
}

function isStandardDisplay() {
  return getDisplayPerformanceTier() === "standard";
}

function isHighQualityDisplay() {
  return getDisplayPerformanceTier() === "high";
}

function getDisplayEffectBudget() {
  return isStandardDisplay()
    ? {
        upgradeBurstParticles: 48,
        upgradeDriftParticles: 24,
        upgradeCanvasScale: 0.72,
        upgradeEnergyLines: 10,
        transitionParticles: 38,
        realtimeRefreshDelay: 1000,
        academicParticles: 35,
        academicConnectionDist: 110,
      }
    : {
        upgradeBurstParticles: 90,
        upgradeDriftParticles: 60,
        upgradeCanvasScale: 1,
        upgradeEnergyLines: 16,
        transitionParticles: 70,
        realtimeRefreshDelay: 800,
        academicParticles: 55,
        academicConnectionDist: 140,
      };
}

function isLowMemoryDisplay() {
  return isStandardDisplay();
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
      .map((r) => `${r.className ?? ""}:${r.academicIndex ?? ""}:${r.riskLevel ?? ""}:${r.isCurrentClass ? "1" : "0"}`)
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

function getShellLocation() {
  return window.location;
}

function resolveRuntimeParams() {
  const shellLocation = getShellLocation();
  const shellUrl = new URL(shellLocation.href);
  const storedTerminalCode = localStorage.getItem(
    "yuyingpets_display_terminal",
  );
  const requestedTerminalCode =
    shellUrl.searchParams.get("terminal") ||
    shellUrl.searchParams.get("displayTerminalCode");
  const allowTerminalOverride =
    shellUrl.searchParams.get("terminalOverride") === "1";
  const terminalCode =
    (allowTerminalOverride && requestedTerminalCode) ||
    storedTerminalCode ||
    requestedTerminalCode ||
    createTerminalCode();
  runtimeState.classId = null;
  runtimeState.terminalCode = terminalCode;
  localStorage.setItem("yuyingpets_display_terminal", terminalCode);
  runtimeState.terminalName =
    localStorage.getItem("yuyingpets_display_terminal_name") ||
    `育英星宠终端-${terminalCode.slice(-6).toUpperCase()}`;
}

function createTerminalCode() {
  const stored = localStorage.getItem("yuyingpets_display_terminal");
  if (stored) return stored;
  const generated = `display-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem("yuyingpets_display_terminal", generated);
  return generated;
}

function getApiBase() {
  return `${window.location.origin}/api/v1`;
}

function getAssetBase() {
  return getApiBase().replace(/\/api\/v1$/, "");
}

function resolveAssetUrl(url) {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return url.startsWith("/") ? `${getAssetBase()}${url}` : `${getAssetBase()}/${url}`;
}

function giftImageVariant(url, size = 480) {
  if (!url || /^(https?:)?\/\//i.test(url) || url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url || "";
  }
  return url.replace("images/gifts/", `images/gifts/${size}/`);
}

function resolveDisplayImageUrl(url) {
  if (!url) return "";
  return url.startsWith("images/") ? url : resolveAssetUrl(url);
}

function resolvePetAssetVariantUrl(url, size = 400) {
  if (!url) return "";
  const requestedSize = Number(size || 400);
  const effectiveSize = requestedSize > 400 && isHighQualityDisplay() ? requestedSize : 400;
  if (effectiveSize === 400 || /^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return resolveAssetUrl(url);
  }
  return resolveAssetUrl(url.replace("/assets/pets/400/", "/assets/pets/1024/"));
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
  if (s.petId && s.petName && s.ext) {
    return `images/pets/${s.petId}_${s.petName}_5.${s.ext}`;
  }
  return "images/logo.svg";
}

function getSocketBase() {
  return window.location.origin;
}

async function apiFetch(path, options = {}) {
  return apiFetchWithToken(path, runtimeState.token, options);
}

async function apiFetchWithToken(path, token, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
  });
  const payload = await response
    .json()
    .catch(() => ({ code: -1, message: "响应解析失败" }));
  if (!response.ok || payload.code !== 0) {
    const message =
      payload && payload.message
        ? payload.message
        : `请求失败（${response.status}）`;
    throw new Error(message);
  }
  return payload.data;
}

function setLoginMessage(message, type = "error") {
  const el = document.getElementById("loginMessage");
  if (!el) return;
  el.textContent = message || "";
  el.style.color = type === "success" ? "#1e8e5a" : "#d64343";
}

function requestDisplayFullscreen() {
  const root = document.documentElement;
  if (getDisplayFullscreenElement() || !root) {
    syncDisplayFullscreenButton();
    return;
  }
  const request =
    root.requestFullscreen ||
    root.webkitRequestFullscreen ||
    root.msRequestFullscreen;
  if (typeof request !== "function") return;
  try {
    const result = request.call(root);
    if (result && typeof result.catch === "function") {
      result
        .then(() => syncDisplayFullscreenButton())
        .catch(() => syncDisplayFullscreenButton());
    }
  } catch {
    // 浏览器只允许在点击、选择等用户动作内进入全屏。
    syncDisplayFullscreenButton();
  }
}

function getDisplayFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    null
  );
}

function syncDisplayFullscreenButton() {
  const button = document.getElementById("displayFullscreenBtn");
  if (!button) return;
  button.hidden = Boolean(getDisplayFullscreenElement());
}

function enterDisplayLogin() {
  requestDisplayFullscreen();
  navigateTo("login");
}

function getStoredLoginCredentials() {
  const raw = localStorage.getItem(DISPLAY_LOGIN_CREDENTIALS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.username !== "string") {
      return null;
    }
    const sanitized = {
      username: parsed.username,
      displayName:
        typeof parsed?.displayName === "string" ? parsed.displayName : "",
    };
    if (
      typeof parsed?.password === "string" ||
      parsed.displayName !== sanitized.displayName
    ) {
      localStorage.setItem(
        DISPLAY_LOGIN_CREDENTIALS_KEY,
        JSON.stringify(sanitized),
      );
    }
    return sanitized;
  } catch {
    return null;
  }
}

function getStoredLoginAccounts() {
  const raw = localStorage.getItem(DISPLAY_LOGIN_ACCOUNTS_KEY);
  let accounts = [];
  let shouldRewrite = false;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        accounts = parsed.filter(
          (item) =>
            typeof item?.username === "string" &&
            item.username.trim(),
        );
        shouldRewrite = parsed.some(
          (item) =>
            typeof item?.password === "string" ||
            typeof item?.displayName !== "string" ||
            item?.username !== item?.username?.trim(),
        );
        accounts = accounts.map((item) => ({
          username: item.username.trim(),
          displayName:
            typeof item.displayName === "string" && item.displayName.trim()
              ? item.displayName.trim()
              : item.username.trim(),
          updatedAt:
            typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
        }));
      }
    } catch {
      accounts = [];
    }
  }
  const legacy = getStoredLoginCredentials();
  if (
    legacy &&
    !accounts.some((item) => item.username === legacy.username)
  ) {
    accounts.unshift(legacy);
    shouldRewrite = true;
  }
  if (shouldRewrite) {
    localStorage.setItem(
      DISPLAY_LOGIN_ACCOUNTS_KEY,
      JSON.stringify(accounts.slice(0, 12)),
    );
  }
  return accounts;
}

function setStoredLoginCredentials(username, displayName = "") {
  const normalizedUsername = String(username || "").trim();
  if (!normalizedUsername) return;
  localStorage.setItem(
    DISPLAY_LOGIN_CREDENTIALS_KEY,
    JSON.stringify({
      username: normalizedUsername,
      displayName: displayName || normalizedUsername,
    }),
  );
  const accounts = getStoredLoginAccounts().filter(
    (item) => item.username !== normalizedUsername,
  );
  accounts.unshift({
    username: normalizedUsername,
    displayName: displayName || normalizedUsername,
    updatedAt: Date.now(),
  });
  localStorage.setItem(
    DISPLAY_LOGIN_ACCOUNTS_KEY,
    JSON.stringify(accounts.slice(0, 12)),
  );
  renderSavedLoginAccounts(normalizedUsername);
}

function getStoredSetupUsername() {
  return (
    localStorage.getItem(DISPLAY_SETUP_LAST_USERNAME_KEY)?.trim() || ""
  );
}

function setStoredSetupUsername(username) {
  const normalizedUsername = String(username || "").trim();
  if (!normalizedUsername) return;
  localStorage.setItem(DISPLAY_SETUP_LAST_USERNAME_KEY, normalizedUsername);
}

function hydrateSetupUsername() {
  const input = document.getElementById("setupAdminUsername");
  if (!input) return;
  input.value = getStoredSetupUsername();
}

function removeStoredLoginAccount(username) {
  const normalizedUsername = String(username || "").trim();
  if (!normalizedUsername) return false;
  const accounts = getStoredLoginAccounts().filter(
    (item) => item.username !== normalizedUsername,
  );
  localStorage.setItem(
    DISPLAY_LOGIN_ACCOUNTS_KEY,
    JSON.stringify(accounts.slice(0, 12)),
  );
  const legacy = getStoredLoginCredentials();
  if (legacy?.username === normalizedUsername) {
    localStorage.removeItem(DISPLAY_LOGIN_CREDENTIALS_KEY);
  }
  return true;
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
  if (token) {
    localStorage.setItem("yuyingpets_display_token", token);
  } else {
    localStorage.removeItem("yuyingpets_display_token");
  }
}

function clearAuthState(options = {}) {
  const preserveClassId = options.preserveClassId !== false;
  setPersistentToken("");
  runtimeState.user = null;
  runtimeState.scopes = [];
  runtimeState.classAssignments = [];
  runtimeState.availableClasses = [];
  runtimeState.pendingLoginResult = null;
  runtimeState.lockStatus = "locked";
  runtimeState.unlockSessionId = null;
  runtimeState.unlockedUntil = null;
  runtimeState.lockOverlayForced = false;
  if (!preserveClassId) {
    runtimeState.classId = null;
    localStorage.removeItem("yuyingpets_display_class_id");
  }
  syncBottomUserName();
  subscribeRealtimeRooms();
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
  const scopeIds = scopes
    .filter((scope) => scope && scope.classId)
    .map((scope) => Number(scope.classId));
  const assignmentIds = (runtimeState.classAssignments || [])
    .filter((assignment) => assignment && assignment.classId)
    .map((assignment) => Number(assignment.classId));
  return Array.from(new Set([...scopeIds, ...assignmentIds])).filter(Boolean);
}

function isDisplayAdminRole(roleCode = runtimeState.user?.roleCode) {
  return ["super_admin", "school_admin", "academic_admin", "moral_admin"].includes(
    roleCode || "",
  );
}

function canInitializeDisplayTerminalRole(roleCode) {
  return ["super_admin", "school_admin", "academic_admin", "moral_admin", "homeroom_teacher"].includes(
    roleCode || "",
  );
}

function canCurrentUserAccessClass(classId) {
  if (isDisplayAdminRole()) {
    return true;
  }
  return getClassScopeIds().includes(Number(classId));
}

function isHomeroomTeacher() {
  return runtimeState.user?.roleCode === "homeroom_teacher";
}

function canAdoptPet() {
  return isHomeroomTeacher() || isDisplayAdminRole();
}

function getGroupOptions() {
  return runtimeState.groups
    .map((group) => ({
      id: group.id || null,
      groupNo: Number(group.groupNo),
      name: group.name || `第${group.groupNo}组`,
    }))
    .filter((group) => Number.isFinite(group.groupNo))
    .sort((a, b) => a.groupNo - b.groupNo);
}

function getGroupLabel(groupNo) {
  if (groupNo == null || groupNo === "") return "未分组";
  const targetNo = Number(groupNo);
  const group = runtimeState.groups.find((item) => Number(item.groupNo) === targetNo);
  return group?.name || `第${targetNo}组`;
}

function getActiveDisplayPage() {
  return document.querySelector(".page.active")?.id || "";
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

function accumulateScoreEffects(bucket, payload) {
  if (!bucket || !payload) return;
  const changes = Array.isArray(payload.changes) ? payload.changes : [];
  changes.forEach((change) => {
    const studentId = Number(change?.studentId);
    if (!Number.isFinite(studentId) || studentId <= 0) return;
    const prev =
      bucket.byStudent.get(studentId) || {
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
      afterLevel: Number.isFinite(afterLevel) && afterLevel > 0 ? afterLevel : null,
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
      runtimeState.home.scoreSummary.classScore = Number(payload.classCurrentScore);
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
  const count = Math.max(0, Number(animCount) || 0);
  if (count <= 0) return 0;
  return (count - 1) * SCORE_ANIM_STAGGER_MS + SCORE_FLOAT_ANIM_MS + SCORE_FLOAT_TAIL_MS;
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

  const remaining = Math.max(0, runtimeState.scoreGridReorderDueAt - Date.now());
  runtimeState.scoreGridReorderTimer = setTimeout(() => {
    runtimeState.scoreGridReorderTimer = null;
    runtimeState.scoreGridReorderDueAt = 0;
    applyPendingScoreGridReorder();
  }, remaining);
}

function playSingleStudentScoreAnim(row) {
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
    const cardBounds = card.getBoundingClientRect();
    const floatSpan = document.createElement("span");
    floatSpan.className = "point-float-anim";
    floatSpan.textContent = netDelta > 0 ? `+${netDelta}` : `${netDelta}`;
    floatSpan.style.color =
      netDelta > 0 ? "var(--success-green)" : "var(--brand-red)";
    floatSpan.style.left = `${cardBounds.left + cardBounds.width / 2 - 15}px`;
    floatSpan.style.top = `${cardBounds.top + cardBounds.height / 2 - 20}px`;
    document.body.appendChild(floatSpan);
    setTimeout(() => floatSpan.remove(), 1500);
  }
}

function playRemoteScoreAnimations(rows, options = {}) {
  const mode = options.mode || "immediate";
  const staggerMs = options.staggerMs ?? 120;
  const list = Array.isArray(rows) ? rows.filter((row) => row.netDelta !== 0) : [];
  if (list.length === 0) return;

  const cap = isStandardDisplay() ? 3 : 8;
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
    setTimeout(() => playSingleStudentScoreAnim(row), index * staggerMs);
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
  syncClassroomMeta();
  renderClassCountdown();
}

function syncStudentCollectionFromRoster(rosterData) {
  cancelPendingScoreGridReorder();
  const rosterGroups = Array.isArray(rosterData?.groups) ? rosterData.groups : [];
  const rosterStudents = Array.isArray(rosterData?.students) ? rosterData.students : [];
  runtimeState.groups = rosterGroups.map((group) => ({
    id: group.id,
    groupNo: group.groupNo,
    name: group.name,
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
    petName: row.pet?.name || null,
    ext:
      row.pet?.currentImageUrl?.split(".").pop() ||
      row.pet?.coverUrl?.split(".").pop() ||
      "jpg",
    lv: row.currentPetLevel || row.pet?.currentLevel || 1,
    pts: row.currentScore || 0,
    totalScore: row.totalScore || 0,
    medals: 0,
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
}

async function refreshStudentRoster() {
  if (!runtimeState.classId) return;
  const roster = await apiFetch(`/display/classes/${runtimeState.classId}/roster`);
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
  const cap = isStandardDisplay() ? 3 : 8;
  const animCount =
    mode === "deferred" && activeRows.length > cap ? cap : activeRows.length;
  playRemoteScoreAnimations(rows, { mode });
  queueScoreUpgradesFromBucket(batch);
  setTimeout(() => {
    playPendingPetUpgradeAnimations();
  }, computeScoreAnimDuration(animCount));
}

function flushClassroomStaleUpdates(options = {}) {
  const animationMode = options.animationMode || "none";
  syncClassroomMeta();
  renderClassCountdown();

  if (animationMode === "deferred" && runtimeState.pendingScoreEffects?.eventCount) {
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
  if (pageKey === "leaderboard" && runtimeState.stalePages?.has("leaderboard")) {
    refreshLeaderboardOnly().finally(() => {
      runtimeState.stalePages.delete("leaderboard");
    });
    return;
  }
  if (pageKey === "exchange" && runtimeState.stalePages?.has("exchange")) {
    if (typeof currentExchangeItem !== "undefined" && currentExchangeItem) {
      initiateExchange(currentExchangeItem, currentExchangeCost);
    }
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
    runtimeState.stalePages.delete("classroom");
  }
}

function handleRewardOrderCreated(payload) {
  if (payload?.scoreSummary) {
    patchHomeFromConfigPayload({ scoreSummary: payload.scoreSummary });
  }
  markPageStale("classroom");
  markPageStale("exchange");
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
  runtimeState.scoreRealtimeFlushTimer = setTimeout(() => {
    runtimeState.scoreRealtimeFlushTimer = null;
    const batch = runtimeState.immediateScoreBatch;
    runtimeState.immediateScoreBatch = null;
    if (!batch || batch.eventCount === 0) return;
    flushClassroomScoreVisuals(batch, { mode: "immediate" });
    runtimeState.stalePages?.delete("classroom");
    refreshLeaderboardOnly().catch(() => {});
  }, 100);
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

function connectRealtime() {
  if (runtimeState.socket || typeof window.io !== "function") return;
  const socket = window.io(`${getSocketBase()}/ws`, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  runtimeState.socket = socket;

  socket.on("connect", () => {
    subscribeRealtimeRooms();
    stopClassMetaPoll();
    if (runtimeState.stalePages?.size) {
      const active = getActiveDisplayPage();
      if (active === "page-classroom") {
        flushClassroomStaleUpdates({
          animationMode:
            runtimeState.pendingScoreEffects?.eventCount > 0 ? "deferred" : "none",
        });
      }
    }
  });
  socket.on("connect_error", (error) => {
    console.warn("[display-realtime] connect_error:", error?.message || error);
  });
  socket.on("disconnect", (reason) => {
    console.warn("[display-realtime] disconnected:", reason);
    startClassMetaPoll();
  });

  socket.on("class.config.changed", (payload) => {
    if (
      payload?.classId &&
      Number(payload.classId) !== Number(runtimeState.classId)
    ) {
      return;
    }
    handleClassConfigChanged(payload);
  });

  socket.on("class.score.changed", (payload) => {
    if (
      payload?.classId &&
      Number(payload.classId) !== Number(runtimeState.classId)
    ) {
      return;
    }
    handleClassScoreChanged(payload);
  });

  socket.on("class.leaderboard.changed", (payload) => {
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
      if (
        payload?.classId &&
        Number(payload.classId) !== Number(runtimeState.classId)
      ) {
        return;
      }
      handleClassStudentOrGroupChanged().catch(() => {});
    });
  });

  socket.on("reward.order.created", (payload) => {
    if (
      payload?.classId &&
      Number(payload.classId) !== Number(runtimeState.classId)
    ) {
      return;
    }
    handleRewardOrderCreated(payload);
  });

  socket.on("display.unlock.changed", (payload) => {
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
  if (!socket || !socket.connected) return;

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
    authTitle: isRebind ? "请由班主任或管理员确认改绑" : "请由班主任或管理员完成授权",
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
  runtimeState.selectedSetupGradeName = "";
  setSetupMessage("setupAdminMessage", "");
  setSetupMessage("setupBindMessage", "");
  syncSetupMode();
  navigateTo("entry");
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
    )
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
        if (!wrap.hasPointerCapture || wrap.hasPointerCapture(event.pointerId)) {
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
    .map(
      (row) => `
            <button type="button" class="setup-class-card ${Number(runtimeState.selectedSetupClassId) === Number(row.id) ? "selected" : ""}" data-class-id="${row.id}" onclick="selectSetupClass(${row.id})">
              <span class="setup-class-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
              <div class="setup-class-name">${escapeHtml(row.gradeName || "")} ${escapeHtml(row.name)}</div>
              <div class="setup-class-sub">
                班主任：${escapeHtml(row.homeroomTeacher?.name || "未设置")}<br />
                口号：${escapeHtml(row.slogan || "未设置")}
              </div>
            </button>`,
    )
    .join("");
}

function selectSetupClass(classId) {
  const nextClassId = Number(classId);
  if (!Number.isFinite(nextClassId)) return;
  if (runtimeState.selectedSetupClassId === nextClassId) return;
  runtimeState.selectedSetupClassId = nextClassId;
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
    setStoredSetupUsername(username);
    const classes = await apiFetchWithToken(
      "/classes",
      runtimeState.setupAdminToken,
    );
    runtimeState.availableClasses = classes || [];
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
    localStorage.setItem(
      "yuyingpets_display_terminal_name",
      runtimeState.terminalName,
    );
    runtimeState.classId = result.classId;
    runtimeState.terminalInitialized = true;
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
      await bootstrapDisplayData({ authenticated: false, silent: true });
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
    localStorage.setItem(
      "yuyingpets_display_terminal_name",
      runtimeState.terminalName,
    );
  }
  runtimeState.terminalInitialized = Boolean(state.isInitialized);
  runtimeState.classId = state.classId || null;
  syncLoginTerminalInfoFromTerminalState(state);
  return state;
}

function updateLockMeta(lines = []) {
  const meta = document.getElementById("displayLockMeta");
  if (!meta) return;
  meta.innerHTML = lines.join("<br />");
}

function applyLockOverlay() {
  const overlay = document.getElementById("displayLockOverlay");
  const badge = document.getElementById("displayLockBadgeText");
  const title = document.getElementById("displayLockTitle");
  const desc = document.getElementById("displayLockDesc");
  const primaryBtn = document.getElementById("displayLockPrimaryBtn");
  const secondaryBtn = document.getElementById("displayLockSecondaryBtn");
  const opBar = document.getElementById("displayOpBar");
  const opTitle = document.getElementById("displayOpTitle");
  const opSubtitle = document.getElementById("displayOpSubtitle");
  const opPrimaryBtn = document.getElementById("displayOpPrimaryBtn");
  const opSecondaryBtn = document.getElementById("displayOpSecondaryBtn");
  const topActionBtn = document.getElementById("displayTopActionBtn");
  const topActionIcon = document.getElementById("displayTopActionIcon");
  if (!overlay || !badge || !title || !desc || !primaryBtn || !secondaryBtn) {
    return;
  }
  syncBottomUserName();

  const activePageId = document.querySelector(".page.active")?.id;
  const shouldHandlePage = [
    "page-classroom",
    "page-exchange",
    "page-leaderboard",
  ].includes(activePageId);
  const shouldShow = shouldHandlePage && runtimeState.lockOverlayForced;
  overlay.classList.toggle("active", shouldShow);
  if (opBar) {
    opBar.classList.add("hidden");
  }

  const metaLines = [
    `当前终端：${escapeHtml(runtimeState.terminalCode)}`,
    `当前班级：${escapeHtml(runtimeState.home?.className || (runtimeState.classId ? `班级 ${runtimeState.classId}` : "未绑定"))}`,
  ];

  if (!runtimeState.user) {
    badge.textContent = "操作已锁定";
    title.textContent = "教师操作已锁定";
    desc.textContent =
      "当前为展示状态。若需加减分、兑换或执行其他教师操作，请重新登录后解锁操作权限。";
    primaryBtn.textContent = "去解锁";
    secondaryBtn.textContent = "我知道了";
    if (runtimeState.lastLockedAt) {
      metaLines.push(
        `锁定时间：${new Date(runtimeState.lastLockedAt).toLocaleString("zh-CN")}`,
      );
    }
    if (opTitle) opTitle.textContent = "操作已锁定";
    if (opSubtitle)
      opSubtitle.textContent =
        "学生可继续查看展示内容，教师需重新登录后才可操作";
    if (opPrimaryBtn) opPrimaryBtn.textContent = "去解锁";
    if (opSecondaryBtn) opSecondaryBtn.textContent = "我知道了";
    if (topActionBtn) {
      topActionBtn.title = "重新登录并解锁操作";
      topActionBtn.classList.remove("unlocked");
    }
    if (topActionIcon) topActionIcon.className = "fa-solid fa-lock-open";
  } else if (runtimeState.lockStatus === "active") {
    badge.textContent = "操作已解锁";
    title.textContent = `当前教师：${runtimeState.user.name}`;
    desc.textContent =
      "当前展示端处于 15 分钟可操作状态。您可以继续课堂加减分、积分兑换或主动锁定终端。";
    primaryBtn.textContent = "继续操作";
    secondaryBtn.textContent = "立即锁定";
    if (runtimeState.unlockedUntil) {
      metaLines.push(
        `操作截止：${new Date(runtimeState.unlockedUntil).toLocaleString("zh-CN")}`,
      );
    }
    if (opTitle) opTitle.textContent = `教师操作中：${runtimeState.user.name}`;
    if (opSubtitle) {
      opSubtitle.textContent = runtimeState.unlockedUntil
        ? `可操作至 ${new Date(runtimeState.unlockedUntil).toLocaleTimeString(
            "zh-CN",
            {
              hour: "2-digit",
              minute: "2-digit",
            },
          )}`
        : "当前可进行加减分与兑换";
    }
    if (opPrimaryBtn) opPrimaryBtn.textContent = "继续操作";
    if (opSecondaryBtn) opSecondaryBtn.textContent = "立即锁定";
    if (topActionBtn) {
      topActionBtn.title = "立即锁定展示端";
      topActionBtn.classList.add("unlocked");
    }
    if (topActionIcon) topActionIcon.className = "fa-solid fa-lock";
  } else {
    badge.textContent = "操作已锁定";
    title.textContent = "教师操作已锁定";
    desc.textContent =
      "当前为展示状态。若需继续加减分、兑换或执行其他教师操作，请重新登录后解锁操作权限。";
    primaryBtn.textContent = "去解锁";
    secondaryBtn.textContent = "我知道了";
    if (runtimeState.lastLockedAt || runtimeState.unlockedUntil) {
      metaLines.push(
        `锁定时间：${new Date(runtimeState.lastLockedAt || runtimeState.unlockedUntil).toLocaleString("zh-CN")}`,
      );
    }
    if (opTitle) {
      opTitle.textContent = "操作已锁定";
    }
    if (opSubtitle) {
      opSubtitle.textContent = "展示继续可见，教师需重新登录后才可继续操作";
    }
    if (opPrimaryBtn) opPrimaryBtn.textContent = "去解锁";
    if (opSecondaryBtn) opSecondaryBtn.textContent = "我知道了";
    if (topActionBtn) {
      topActionBtn.title = "重新登录并解锁操作";
      topActionBtn.classList.remove("unlocked");
    }
    if (topActionIcon) topActionIcon.className = "fa-solid fa-lock-open";
  }

  updateLockMeta(metaLines);
}

function ensureOperationUnlocked() {
  if (runtimeState.lockStatus === "active") return true;
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
  if (groupFilter !== null && !groups.some((group) => group.groupNo === groupFilter)) {
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
}

function classroomGradeLabel(home) {
  return home?.gradeName ? `${home.gradeName}` : "";
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
  if (card) {
    card.title = `查看 ${topStudent.name} 的萌宠档案`;
  }
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

function syncMarquee(records = []) {
  const fallback = "最近动态：课堂表现、作业表现、班级荣誉会在这里实时滚动展示";
  const lines = records.slice(0, 6).map((item) => {
    const student = students.find((student) => student.id === item.studentId);
    const rule = runtimeState.scoreRules.find((row) => row.id === item.ruleId);
    const score = Number(item.scoreDelta || 0);
    const delta = score > 0 ? `+${score}` : `${score}`;
    return `${student?.name || "学生"} ${rule?.name || item.remark || "积分调整"} ${delta}分`;
  });
  const text =
    lines.length > 0 ? `最近动态：${lines.join(" &nbsp;│&nbsp; ")}` : fallback;
  const primary = document.getElementById("marqueeTextPrimary");
  const secondary = document.getElementById("marqueeTextSecondary");
  if (primary) primary.innerHTML = text;
  if (secondary) secondary.innerHTML = text;
}

function renderTodayRank() {
  const wrap = document.getElementById("todayRank");
  if (!wrap) return;
  wrap.innerHTML = getRankedStudentsByScore()
    .slice(0, 5)
    .map((s, i) => {
      const cls = i === 0 ? "r1" : i === 1 ? "r2" : i === 2 ? "r3" : "rn";
      const sub =
        s.hasPet === false ? "待孕育星种" : `${s.petName || "萌宠"} · Lv.${s.lv}`;
      const safeName = s.name.replace(/'/g, "\\'");
      return `
      <button type="button" class="rank-item" title="查看 ${escapeHtml(s.name)} 的萌宠档案" onclick="openPetProfileByName('${safeName}')">
        <span class="rank-num ${cls}">${i + 1}</span>
        <img class="rank-pet-sm" src="${petImg(s)}" alt="${escapeHtml(sub)}" onerror="this.src='images/logo.svg'">
        <div class="rank-info">
          <div class="rank-name">${escapeHtml(s.name)}</div>
          <div class="rank-pts">${escapeHtml(sub)}</div>
        </div>
        <span style="color:var(--honor-gold);font-weight:700;font-size:14px;">${s.pts}</span>
      </button>`;
    })
    .join("");
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
  const deadlineAt = countdown?.deadlineAt ? new Date(countdown.deadlineAt) : null;
  if (!countdown?.title || !deadlineAt || Number.isNaN(deadlineAt.getTime())) {
    card.hidden = true;
    card.classList.remove("is-ended");
    return;
  }

  const title = document.getElementById("classCountdownTitle");
  const deadline = document.getElementById("classCountdownDeadline");
  if (title) title.textContent = countdown.title;
  if (deadline) deadline.textContent = `截止时间 ${formatClassCountdownDeadline(deadlineAt)}`;
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
      const value =
        runtimeState.leaderboardType === "score"
          ? row.currentScore || 0
          : runtimeState.leaderboardType === "pet-level"
            ? row.currentPetLevel || 1
            : row.currentScore || 0;
      const unit = runtimeState.leaderboardType === "pet-level" ? "级" : "分";
      xp.textContent = `${value} ${unit}`;
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
      const value =
        runtimeState.leaderboardType === "score"
          ? s.currentScore || 0
          : runtimeState.leaderboardType === "pet-level"
            ? s.currentPetLevel || 1
            : s.currentScore || 0;
      const unit = runtimeState.leaderboardType === "pet-level" ? "级" : "分";
      return `
    <div class="lb-row">
      <span class="lb-row-num">${s.rank}</span>
      <img class="lb-row-pet" src="${displayImage}" alt="${escapeHtml(s.petName || s.name)}" onerror="this.src='images/logo.svg'">
      <div class="lb-row-info">
        <div class="lb-row-name">${escapeHtml(s.name)}</div>
        <div class="lb-row-petname">${escapeHtml(s.petName || "待孕育星种")}</div>
      </div>
      <div class="lb-row-right">
        <span class="lb-row-lv">Lv.${s.currentPetLevel || 1}</span>
        <span class="lb-row-xp">${value} ${unit}</span>
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
  /* 低性能设备直接赋值 */
  if (isStandardDisplay()) {
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
  if (!canvas || isStandardDisplay()) return;
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
  return numeric > 0 ? `+${Math.round(numeric * 10) / 10}` : `${Math.round(numeric * 10) / 10}`;
}

function academicRankDeltaValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function academicRankDeltaText(value) {
  const numeric = academicRankDeltaValue(value);
  if (numeric === null) return "-";
  if (numeric === 0) return "0";
  return numeric > 0 ? `+${Math.round(numeric * 10) / 10}` : `${Math.round(numeric * 10) / 10}`;
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
  const selectedKey = academicStudentKey(runtimeState.selectedAcademicStudentId);
  return rows.find((row) => academicStudentKey(row.studentId) === selectedKey) || rows[0];
}

function selectAcademicStudent(studentId) {
  runtimeState.selectedAcademicStudentId = studentId;
  renderAcademicStudentDetail(getAcademicGrowthData());
  document.querySelectorAll(".academic-table tbody tr").forEach((row) => {
    row.classList.toggle("selected", row.dataset.studentId === academicStudentKey(studentId));
  });
}

function handleAcademicStudentPick(studentId, options = {}) {
  if (!studentId) return;
  selectAcademicStudent(studentId);
  if (options.openAi === false) return;
  const now = Date.now();
  const key = academicStudentKey(studentId);
  if (runtimeState.lastAcademicAiOpenKey === key && now - runtimeState.lastAcademicAiOpenAt < 450) {
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
  return runtimeState.academicGrowth || {
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
  };
}

async function fetchAcademicGrowthData(options = {}) {
  if (!runtimeState.classId) return null;
  const examId = options.examId ?? runtimeState.selectedAcademicExamId;
  const query = examId ? `?examId=${encodeURIComponent(examId)}` : "";
  const academicGrowth = await apiFetch(`/display/classes/${runtimeState.classId}/academic-growth${query}`).catch((error) => ({
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
  runtimeState.selectedAcademicExamId = Number.isInteger(examId) && examId > 0 ? examId : null;
  await fetchAcademicGrowthData({ examId: runtimeState.selectedAcademicExamId });
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
  setText("academicCoverage", `较上次 ${academicDeltaText(metrics.indexDelta)}`);
  setText("academicAverage", academicNumber(metrics.averageScore, 1));
  setText("academicParticipants", `${academicNumber(metrics.participantCount)}人`);
  setText("academicProgress", academicNumber(metrics.progressCount));
  setText("academicRisk", academicNumber(metrics.riskCount ?? metrics.declineCount));
  setText("academicGradeIndex", academicNumber(metrics.gradeBaselineIndex ?? metrics.currentClassAcademicIndex, 1));
  setText("academicGradeAverage", academicNumber(metrics.gradeAverage ?? metrics.currentClassAverage, 1));
  renderAcademicTrajectory(data, limits);
  renderAcademicScoreTable(data, limits);
  renderAcademicRadar(data.subjects || [], limits);
  renderAcademicClassList(data.classSummaries || [], limits);
  renderAcademicSignals("academicProgressList", data.progressLeaders || [], "up", limits);
  renderAcademicSignals("academicRiskList", data.riskStudents || [], "down", limits);
  if (!runtimeState.selectedAcademicStudentId || !(data.studentRows || []).some((row) => academicStudentKey(row.studentId) === academicStudentKey(runtimeState.selectedAcademicStudentId))) {
    runtimeState.selectedAcademicStudentId = data.studentRows?.[0]?.studentId ?? null;
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
  const avgDelta = latest && previous ? Number(latest.relativeIndex || 0) - Number(previous.relativeIndex || 0) : 0;
  const rows = data.studentRows || [];
  const sortedRows = [...rows].sort((left, right) => Number(right.totalScore || 0) - Number(left.totalScore || 0));
  const total = sortedRows.length || 1;
  const highEnd = Math.max(1, Math.ceil(total * 0.25));
  const stableEnd = Math.max(highEnd, Math.ceil(total * 0.6));
  const borderEnd = Math.max(stableEnd, Math.ceil(total * 0.85));
  const levels = [
    { key: "high", label: "高分层", rows: sortedRows.slice(0, highEnd) },
    { key: "stable", label: "稳定层", rows: sortedRows.slice(highEnd, stableEnd) },
    { key: "border", label: "临界层", rows: sortedRows.slice(stableEnd, borderEnd) },
    { key: "support", label: "帮扶层", rows: sortedRows.slice(borderEnd) },
  ];
  const migration = {
    up: rows.filter((row) => (academicRankDeltaValue(row.rankDelta) ?? 0) > 0).length,
    flat: rows.filter((row) => (academicRankDeltaValue(row.rankDelta) ?? 0) === 0).length,
    down: rows.filter((row) => (academicRankDeltaValue(row.rankDelta) ?? 0) < 0).length,
  };
  const bars = visibleTrend
    .map((item) => {
      const height = Math.max(14, Math.round((Number(item.relativeIndex || 0) / max) * 86));
      return `<div class="academic-trend-bar" style="--h:${height}px"><span>${academicNumber(item.relativeIndex, 1)}</span><em>${escapeHtml(item.examName || "考试")}</em></div>`;
    })
    .join("");
  const levelHtml = levels
    .map((item) => {
      const count = item.rows.length;
      const width = Math.max(4, Math.round((count / total) * 100));
      const positive = item.rows.filter((row) => (academicRankDeltaValue(row.rankDelta) ?? 0) > 0).length;
      const negative = item.rows.filter((row) => (academicRankDeltaValue(row.rankDelta) ?? 0) < 0).length;
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
  if (meta) meta.textContent = `${rows.length}/${sourceRows.length} ROWS · ${columns.length} SUBJECTS`;
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
      const deltaClass = rankDelta === null ? "" : rankDelta >= 0 ? "up" : "down";
      const selectedClass = academicStudentKey(row.studentId) === academicStudentKey(runtimeState.selectedAcademicStudentId) ? " selected" : "";
      const cells = columns
        .map((_, columnIndex) => `<td>${row.subjectScores?.[columnIndex] ?? "--"}</td>`)
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
  const maxScore = Math.max(1, ...rows.map((item) => Number(item.averageScore || 0)));
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
      const width = Math.max(8, Math.min(100, Math.round((Number(item.averageScore || 0) / maxScore) * 100)));
      return `<div class="academic-subject-row"><span>${escapeHtml(item.subjectName)}</span><i><b style="--w:${width}%"></b></i><strong>${academicNumber(item.averageScore, 1)}</strong></div>`;
    })
    .join("");
}

function renderAcademicClassList(classSummaries, limits = getAcademicRenderLimits()) {
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

function renderAcademicSignals(id, rows, tone, limits = getAcademicRenderLimits()) {
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
    wrap.innerHTML = '<div class="academic-student-empty">选择成绩矩阵中的学生，查看个人学业画像。</div>';
    return;
  }
  const delta = academicRankDeltaValue(student.rankDelta);
  const deltaClass = delta === null ? "" : delta >= 0 ? "up" : "down";
  const subjectRows = columns
    .map((subject, index) => {
      const value = student.subjectScores?.[index];
      const width = value === null || value === undefined ? 0 : Math.max(6, Math.min(100, Math.round(Number(value))));
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
  const topPositive = [...dimensions].sort((a, b) => b.positiveCount - a.positiveCount).find((item) => item.positiveCount > 0);
  const topNegative = [...dimensions].sort((a, b) => b.negativeCount - a.negativeCount).find((item) => item.negativeCount > 0);
  const periodLabel = summary.periodType === "monthly" ? "本月" : "本周";
  const positiveRatio = Math.round(Number(trend.positiveRatio || 0) * 100);
  const suggestions = splitAcademicAiLines(summary.aiSuggestion);
  const highlights = [];
  const risks = [];
  const actions = [];
  if (positiveCount > 0) highlights.push(`${periodLabel}正向 ${positiveCount} 次，积分 ${positiveDelta >= 0 ? "+" : ""}${positiveDelta}`);
  if (topPositive) highlights.push(`优势维度：${topPositive.dimension}（${topPositive.positiveCount} 次）`);
  if (trend.recentTrend === "up") highlights.push("近期状态向上，节奏正在改善");
  if (negativeCount > 0) risks.push(`${periodLabel}负向 ${negativeCount} 次，影响 ${negativeDelta >= 0 ? "+" : ""}${negativeDelta}`);
  if (topNegative) risks.push(`重点关注：${topNegative.dimension}（${topNegative.negativeCount} 次）`);
  if (trend.recentTrend === "down") risks.push("近期趋势回落，需要及时纠偏");
  suggestions.slice(0, 2).forEach((item) => actions.push(item));
  if (!actions.length) {
    actions.push(negativeCount > positiveCount ? "建议优先跟进课堂执行与作业完成，设置短周期目标。" : "建议保持优势维度，每周沉淀一个可量化进步目标。");
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
  if (nameEl) nameEl.textContent = student?.studentName ? `${student.studentName} · AI 学情分析` : "AI 学情分析";
  if (metaEl) metaEl.textContent = payload.meta || "本周 · 学生画像";
  if (!body) return;
  if (state === "loading") {
    body.innerHTML = '<div class="academic-ai-placeholder"><i></i>正在读取 AI 学情摘要...</div>';
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
    body.innerHTML = '<div class="academic-ai-placeholder">暂无 AI 学情摘要。</div>';
    return;
  }
  const listHtml = (items, emptyText) =>
    items.length
      ? items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")
      : `<span>${escapeHtml(emptyText)}</span>`;
  const dimensionHtml = view.dimensions.length
    ? view.dimensions
        .map((item) => `<div><span>${escapeHtml(item.dimension)}</span><strong>${item.count}</strong><em>正${item.positiveCount} / 负${item.negativeCount}</em></div>`)
        .join("")
    : '<div><span>暂无维度</span><strong>0</strong><em>待积累</em></div>';
  const evidenceHtml = view.evidence.length
    ? view.evidence
        .map((item) => `<div class="academic-ai-evidence-item">
          <strong>${escapeHtml(item.ruleName || item.signal || "学情事件")}</strong>
          <span>${escapeHtml([item.date, item.subject, item.scene].filter(Boolean).join(" · "))}</span>
          <b class="${Number(item.scoreDelta || 0) >= 0 ? "up" : "down"}">${academicDeltaText(item.scoreDelta)}</b>
        </div>`)
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
  const student = (getAcademicGrowthData().studentRows || []).find((row) => academicStudentKey(row.studentId) === academicStudentKey(studentId)) || getSelectedAcademicStudent();
  runtimeState.selectedAcademicAiStudentId = studentId;
  document.getElementById("academicAiModal")?.classList.add("active");
  renderAcademicAiModalState("loading", { student, meta: "本周 · 正在生成画像" });
  try {
    const summary = await loadAcademicAiSummary(studentId);
    if (academicStudentKey(runtimeState.selectedAcademicAiStudentId) !== academicStudentKey(studentId)) return;
    renderAcademicAiModalState("ready", { student, summary, meta: `${summary.periodType === "monthly" ? "本月" : "本周"} · ${summary.snapshotDate ? String(summary.snapshotDate).slice(0, 10) : "最新生成"}` });
  } catch (error) {
    if (academicStudentKey(runtimeState.selectedAcademicAiStudentId) !== academicStudentKey(studentId)) return;
    renderAcademicAiModalState("error", { student, message: error instanceof Error ? error.message : "AI 学情摘要加载失败" });
  }
}

async function regenerateAcademicAiSummary() {
  const studentId = runtimeState.selectedAcademicAiStudentId || runtimeState.selectedAcademicStudentId;
  if (!studentId) return;
  const student = (getAcademicGrowthData().studentRows || []).find((row) => academicStudentKey(row.studentId) === academicStudentKey(studentId)) || getSelectedAcademicStudent();
  renderAcademicAiModalState("loading", { student, meta: "本周 · 正在重新生成" });
  try {
    const summary = await loadAcademicAiSummary(studentId, { regenerate: true });
    renderAcademicAiModalState("ready", { student, summary, meta: `${summary.periodType === "monthly" ? "本月" : "本周"} · ${summary.snapshotDate ? String(summary.snapshotDate).slice(0, 10) : "最新生成"}` });
  } catch (error) {
    renderAcademicAiModalState("error", { student, message: error instanceof Error ? error.message : "AI 学情生成失败" });
  }
}

function enableAcademicSelectionEvents() {
  ["academicScoreTable", "academicProgressList", "academicRiskList"].forEach((id) => {
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
        const moved = Math.abs(event.clientX - startX) > 8 || Math.abs(event.clientY - startY) > 8;
        delete el.dataset.pendingAcademicStudentId;
        delete el.dataset.pendingAcademicX;
        delete el.dataset.pendingAcademicY;
        const tableIgnoreMicroDrag = id === "academicScoreTable";
        if (!moved && (el.dataset.dragMoved !== "1" || tableIgnoreMicroDrag)) {
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
  });
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
          if (event.target.closest("[data-student-id], .academic-student-subjects, .academic-class-list")) return;
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
        if (!state.dragging || (event?.pointerId !== undefined && event.pointerId !== state.pointerId)) return;
        if (state.moved) {
          event?.preventDefault?.();
          event?.stopPropagation?.();
        }
        state.dragging = false;
        el.classList.remove("dragging");
        if (event?.pointerId !== undefined) {
          try {
            if (!el.hasPointerCapture || el.hasPointerCapture(event.pointerId)) {
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
  grid.innerHTML = runtimeState.rewards
    .map(
      (reward, index) => {
        const fallbackImage = fallbackImages[index % fallbackImages.length];
        const imageUrl = resolveDisplayImageUrl(giftImageVariant(reward.imageUrl, 480)) || fallbackImage;
        return `
          <div class="ex-item-card">
            <div class="ex-item-img-wrap">
              <img src="${imageUrl}" class="ex-item-img" alt="${escapeHtml(reward.name)}" loading="lazy" decoding="async" onerror="this.src='${fallbackImage}'" />
            </div>
            <div class="ex-item-body">
              <div class="ex-item-name">${escapeHtml(reward.name)}</div>
              <div class="ex-item-cost">${reward.scoreCost} 积分</div>
              <button class="ex-btn" onclick="initiateExchange(${reward.id}, '${escapeHtml(reward.name)}', ${reward.scoreCost})">
                立即兑换
              </button>
            </div>
          </div>`;
      },
    )
    .join("");
}

function configureRuleButtons() {
  const addGrid = document.getElementById("pmAddGrid");
  const subGrid = document.getElementById("pmSubGrid");
  if (!addGrid || !subGrid) return;
  const sortRules = (rules) =>
    [...rules].sort((a, b) => {
      const highFrequencyDiff = Number(Boolean(b.isHighFrequency)) - Number(Boolean(a.isHighFrequency));
      if (highFrequencyDiff !== 0) return highFrequencyDiff;
      return String(a.name || "").localeCompare(String(b.name || ""), "zh-CN");
    });
  const positiveRules = sortRules(
    runtimeState.scoreRules.filter((rule) => rule.scoreType === "add"),
  ).slice(0, 8);
  const negativeRules = sortRules(
    runtimeState.scoreRules.filter((rule) => rule.scoreType === "deduct"),
  ).slice(0, 6);

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
    const searchSource = `${rule.name || ""} ${rule.dimension || ""} ${rule.tag || ""}`.toLowerCase();
    const matchesKeyword = !keyword || searchSource.includes(keyword);
    return matchesType && matchesScene && matchesKeyword;
  });
}

function renderMoreRulePanel() {
  const panel = document.getElementById("pmMorePanel");
  const grid = document.getElementById("pmMoreGrid");
  const sceneFilters = document.getElementById("pmSceneFilters");
  const addTab = document.getElementById("pmMoreTabAdd");
  const deductTab = document.getElementById("pmMoreTabDeduct");
  const searchInput = document.getElementById("pmRuleSearch");
  const title = document.getElementById("pmMoreTitle");
  if (!panel || !grid || !sceneFilters || !addTab || !deductTab || !searchInput || !title) return;

  addTab.classList.toggle("active", displayRulePanelState.activeType === "add");
  deductTab.classList.toggle("active", displayRulePanelState.activeType === "deduct");
  searchInput.value = displayRulePanelState.searchKeyword;
  title.innerHTML = `<i class="fa-solid fa-layer-group"></i> ${
    displayRulePanelState.activeType === "add" ? "全部加分规则" : "全部扣分规则"
  }`;

  const sceneCodeSet = Array.from(
    new Set(
      runtimeState.scoreRules
        .filter((rule) => rule.scoreType === displayRulePanelState.activeType)
        .map((rule) => rule.sceneCode)
        .filter(Boolean),
    ),
  ).sort((a, b) => String(DISPLAY_SCENE_LABELS[a] || a).localeCompare(String(DISPLAY_SCENE_LABELS[b] || b), "zh-CN"));

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

function openMoreRulePanel(type = "add") {
  const panel = document.getElementById("pmMorePanel");
  const quickPanels = document.getElementById("pmQuickPanels");
  if (!panel || !quickPanels) return;
  displayRulePanelState.activeType = type;
  displayRulePanelState.searchKeyword = "";
  displayRulePanelState.sceneCode = "all";
  quickPanels.classList.add("hidden");
  panel.classList.add("active");
  renderMoreRulePanel();
}

function closeMoreRulePanel() {
  const panel = document.getElementById("pmMorePanel");
  const quickPanels = document.getElementById("pmQuickPanels");
  if (!panel || !quickPanels) return;
  panel.classList.remove("active");
  quickPanels.classList.remove("hidden");
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

function setAllHistoryButtonState({ visible = false, enabled = false, text = "全部记录" } = {}) {
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
  overlay.onclick = (event) => {
    if (event.target === overlay) {
      closeAllHistoryModal();
    }
  };
  overlay.classList.add("active");
}

function closeAllHistoryModal() {
  document.getElementById("pmAllHistoryModal")?.classList.remove("active");
}

async function loadPetProfileRecords(studentId) {
  const rows = await apiFetch(
    `/score-records?classId=${runtimeState.classId}&studentId=${studentId}`,
  ).catch(() => []);
  return rows.map((item) => {
    const rule = runtimeState.scoreRules.find((row) => row.id === item.ruleId);
    const time = new Date(item.createdAt);
    const teacherName = item.operatorName || item.teacher?.name || item.createdByUser?.name || "教师";
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
  setAllHistoryButtonState({ visible: true, enabled: false, text: "加载中..." });
  currentAllHistoryRecords = Array.isArray(s.history) ? s.history : [];
  renderModalHistory(s);
  closeMoreRulePanel();
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
    setAllHistoryButtonState({ visible: true, enabled: false, text: "全部记录" });
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
  closeMoreRulePanel();
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
  closeMoreRulePanel();
  document.getElementById("pointModal").classList.add("active");
}

async function applyQuickRule(ruleId) {
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
  const confirmed = await showConfirmModal({
    tone: rule.scoreType === "add" ? "success" : "warn",
    badge: rule.scoreType === "add" ? "加分确认" : "扣分确认",
    icon: rule.scoreType === "add" ? "fa-plus" : "fa-minus",
    title: `确认${rule.scoreType === "add" ? "加分" : "扣分"}吗？`,
    description: `${targetText}\n规则：${rule.name}\n分值：${deltaPrefix}${Math.abs(rule.scoreValue || 0)}`,
    confirmText: rule.scoreType === "add" ? "确认加分" : "确认扣分",
  });
  if (!confirmed) return;

  try {
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
    if (!runtimeState.socket?.connected) {
      await bootstrapDisplayData({ authenticated: true, silent: true });
    }
  } catch (error) {
    showDisplayToast(error.message || "加减分失败");
  }
}

let currentExchangeRewardId = null;

function initiateExchange(rewardId, itemName, cost) {
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
  const s = students.find((x) => x.name === studentName);
  if (!s || s.pts < currentExchangeCost) return;
  if (!runtimeState.token) {
    showDisplayToast("请先登录班主任账号");
    return;
  }
  const confirmed = await showConfirmModal({
    tone: "warn",
    badge: "兑换确认",
    icon: "fa-gift",
    title: "确认兑换该礼品吗？",
    description: `${studentName} 将兑换「${currentExchangeItem}」。\n本次将扣除 ${currentExchangeCost} 积分。`,
    confirmText: "确认兑换",
  });
  if (!confirmed) return;

  try {
    await apiFetch("/reward-orders", {
      method: "POST",
      body: JSON.stringify({
        classId: runtimeState.classId,
        studentId: s.id,
        rewardId: currentExchangeRewardId,
        sourceTerminal: "display",
      }),
    });
    closeSelectStudentModal();
    showExchangeSuccess(currentExchangeItem, s.name, currentExchangeCost);
    await bootstrapDisplayData({ authenticated: true, silent: true });
  } catch (error) {
    showDisplayToast(error.message || "兑换失败");
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
      runtimeState.lastLockedAt =
        statusData.expiredAt || new Date().toISOString();
    }
    applyLockOverlay();
    return;
  }
  runtimeState.lockStatus = "active";
  runtimeState.unlockSessionId = statusData.unlockSessionId || null;
  runtimeState.unlockedUntil = statusData.expiredAt || null;
  runtimeState.lastLockedAt = null;
  applyLockOverlay();
}

async function unlockDisplay() {
  if (!runtimeState.user) {
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
  await bootstrapDisplayData({ authenticated: true });
  await unlockDisplay();
  setLoginMessage("登录成功，正在进入班级...", "success");
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
  localStorage.setItem(
    "yuyingpets_display_class_id",
    String(runtimeState.classId),
  );
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
      petName: row.pet?.name || null,
      ext:
        row.pet?.currentImageUrl?.split(".").pop() ||
        row.pet?.coverUrl?.split(".").pop() ||
        "jpg",
      lv: row.currentPetLevel || row.pet?.currentLevel || 1,
      pts: row.currentScore || 0,
      totalScore: row.totalScore || 0,
      medals: 0,
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
}

async function bootstrapDisplayData(options = {}) {
  const authenticated =
    options.authenticated ?? Boolean(runtimeState.token && runtimeState.user);
  const silent = options.silent ?? false;

  cancelPendingScoreGridReorder();

  try {
    if (!runtimeState.classId) {
      updateLockMeta([
        `当前终端：${escapeHtml(runtimeState.terminalCode)}`,
        "当前班级：未绑定",
      ]);
      return;
    }
    const [home, rewards] = await Promise.all([
      apiFetch(`/display/classes/${runtimeState.classId}/home`),
      apiFetch(`/display/classes/${runtimeState.classId}/reward-center`),
    ]);
    runtimeState.home = home;
    runtimeState.rewards = rewards.rewards || [];
    await fetchAcademicGrowthData();

    if (authenticated || runtimeState.petCatalog.length > 0) {
      const petCatalog = await apiFetch("/display/pet-catalog").catch(() => adoptPetCatalog);
      runtimeState.petCatalog = normalizePetCatalog(petCatalog || []);
    }

    if (authenticated) {
      const [studentsData, groups, scoreRules] = await Promise.all([
        apiFetch(`/students?classId=${runtimeState.classId}`),
        apiFetch(`/classes/${runtimeState.classId}/groups`),
        apiFetch(`/score-rules?displayEnabled=true&scoreTarget=student&classId=${runtimeState.classId}`),
      ]);
      runtimeState.groups = groups || [];
      runtimeState.scoreRules = (scoreRules || []).filter(
        (rule) => rule && rule.scoreTarget !== "class",
      );
      syncStudentCollection(studentsData || [], runtimeState.groups);
      updateGroupToolbar();
      configureRuleButtons();
      const recentRecords = await apiFetch(
        `/score-records?classId=${runtimeState.classId}`,
      ).catch(() => []);
      syncMarquee(recentRecords || []);
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

    syncClassroomMeta();
    renderClassCountdown();
    syncTodayStar();
    if (!isScoreVisualsPending()) {
      renderStudentGrid();
      playPendingPetUpgradeAnimations();
      renderTodayRank();
    }
    renderRewardCenter();
    renderAcademicGrowth();
    await fetchLeaderboard(runtimeState.leaderboardType || "score");
    await checkActiveCall().catch(console.warn);
    applyLockOverlay();
  } catch (error) {
    if (!silent) {
      console.error(error);
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
        localStorage.setItem(
          "yuyingpets_display_class_id",
          String(runtimeState.classId),
        );
        await finalizeTeacherSession();
      } else {
        await loadAvailableClasses();
        const available = runtimeState.availableClasses.filter((item) =>
          classScopeIds.includes(Number(item.id)),
        );
        if (available.length === 1) {
          runtimeState.classId = Number(available[0].id);
          localStorage.setItem(
            "yuyingpets_display_class_id",
            String(runtimeState.classId),
          );
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

document.addEventListener("DOMContentLoaded", () => {
  resolveRuntimeParams();
  const performanceTier = getDisplayPerformanceTier();
  document.body.dataset.displayPerformance = performanceTier;
  document.body.classList.toggle("low-memory-display", isLowMemoryDisplay());
  document.body.classList.toggle("standard-display", isStandardDisplay());
  document.body.classList.toggle("high-quality-display", isHighQualityDisplay());
  syncDisplayFullscreenButton();
  document.addEventListener("fullscreenchange", syncDisplayFullscreenButton);
  document.addEventListener("webkitfullscreenchange", syncDisplayFullscreenButton);
  document.addEventListener("MSFullscreenChange", syncDisplayFullscreenButton);
  window.addEventListener("resize", syncDisplayFullscreenButton);
  clearAuthState({ preserveClassId: true });
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
  const petProfileModal = document.getElementById("petProfileModal");
  if (petProfileModal) {
    petProfileModal.addEventListener("click", (event) => {
      if (event.target === petProfileModal) {
        closePetProfileModal();
      }
    });
  }
  const academicAiModal = document.getElementById("academicAiModal");
  if (academicAiModal) {
    academicAiModal.addEventListener("click", (event) => {
      if (event.target === academicAiModal) {
        closeAcademicAiModal();
      }
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
      await bootstrapDisplayData({ authenticated: false, silent: true });
      navigateTo("entry");
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
  return originalOpenPointModalByName(name, cardEl);
};

const originalToggleBatchMode = toggleBatchMode;
toggleBatchMode = function patchedToggleBatchMode() {
  if (!ensureOperationUnlocked()) return;
  return originalToggleBatchMode();
};

const originalOpenGroupPointForFilter = openGroupPointForFilter;
openGroupPointForFilter = function patchedOpenGroupPointForFilter() {
  if (!ensureOperationUnlocked()) return;
  return originalOpenGroupPointForFilter();
};

const originalOpenBatchPointModal = openBatchPointModal;
openBatchPointModal = function patchedOpenBatchPointModal() {
  if (!ensureOperationUnlocked()) return;
  return originalOpenBatchPointModal();
};

const originalInitiateExchange = initiateExchange;
initiateExchange = function patchedInitiateExchange(...args) {
  if (!ensureOperationUnlocked()) return;
  return originalInitiateExchange(...args);
};

// ==================== 大屏叫号控制逻辑 ====================
let activeCallId = null;
let callAudioInterval = null;
let audioCtx = null;

function playMelodicChime() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const chimes = [659.25, 830.61, 987.77, 1318.51];
    const now = audioCtx.currentTime;
    chimes.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.15);
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
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

function handleCallQueueChanged(call) {
  const overlay = document.getElementById("callOverlay");
  const locEl = document.getElementById("callLocation");
  const studEl = document.getElementById("callStudents");
  if (!overlay || !locEl || !studEl) return;

  if (call && call.status === "calling") {
    activeCallId = call.id;
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
    // 启动悠扬警报铃声
    startAlertSound();
  } else {
    activeCallId = null;
    overlay.style.display = "none";
    stopAlertSound();
  }
}

async function confirmActiveCall() {
  if (!activeCallId) return;
  try {
    const btn = document.querySelector(".co-confirm-btn");
    if (btn) btn.disabled = true;
    await apiFetch("/call-queue/" + activeCallId + "/confirm", { method: "POST" });
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
    const data = await apiFetch("/call-queue/active/" + runtimeState.classId);
    if (data && data.status === "calling") {
      handleCallQueueChanged(data);
    } else {
      handleCallQueueChanged(null);
    }
  } catch (err) {
    console.warn("获取活动叫号失败", err);
  }
}
