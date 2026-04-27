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

/* 补全分组；未领养学生默认无宠 */
students.forEach((s, i) => {
  if (s.group == null) s.group = (i % 4) + 1;
  if (s.hasPet == null) s.hasPet = true;
});

/* 可选领养萌宠（与图鉴文件名一致） */
const adoptPetCatalog = [
  { code: "002", name: "侏儒兔", category: "rabbit", coverUrl: "/assets/pets/002_侏儒兔_1.jpg" },
  { code: "005", name: "柯基", category: "dog", coverUrl: "/assets/pets/005_柯基_1.jpg" },
  { code: "007", name: "萨摩耶", category: "dog", coverUrl: "/assets/pets/007_萨摩耶_1.jpg" },
  { code: "008", name: "金渐层", category: "cat", coverUrl: "/assets/pets/008_金渐层_1.jpg" },
  { code: "010", name: "橘猫", category: "cat", coverUrl: "/assets/pets/010_橘猫_1.jpg" },
  { code: "004", name: "布丁仓鼠", category: "hamster", coverUrl: "/assets/pets/004_布丁仓鼠_1.jpg" },
  { code: "023", name: "哈士奇", category: "dog", coverUrl: "/assets/pets/023_哈士奇_1.jpg" },
  { code: "018", name: "金毛", category: "dog", coverUrl: "/assets/pets/018_金毛_1.jpg" },
];
const PET_STAGE_COUNT = 10;

const PET_FAMILY_OPTIONS = [
  { key: "all", label: "全部" },
  { key: "cat", label: "猫咪系" },
  { key: "dog", label: "犬类系" },
  { key: "rabbit", label: "兔子系" },
  { key: "hamster", label: "仓鼠系" },
  { key: "mythical", label: "神兽系" },
  { key: "other", label: "其他" },
];

const PET_CATEGORY_META = {
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
let batchMode = false;
const batchSelectedNames = new Set();
let adoptTargetName = null;
let currentProfileStudent = null;
let currentAllHistoryRecords = [];
let currentPetProfileRecords = [];
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

function getSelectedAdoptPet() {
  return getAdoptCatalog().find((pet) => pet.code === adoptModalState.selectedPetCode) || null;
}

function setAdoptPetFamily(family) {
  adoptModalState.family = family;
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
  tabs.innerHTML = PET_FAMILY_OPTIONS.map(
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
          <div class="adopt-pet-card-tags">
            <span class="adopt-pet-tag">${escapeHtml(familyLabel)}</span>
            ${
              familyLabel !== categoryLabel
                ? `<span class="adopt-pet-tag adopt-pet-tag--subtle">${escapeHtml(categoryLabel)}</span>`
                : ""
            }
          </div>
          <div class="adopt-stage-dots">${dots}</div>
          <div class="adopt-pet-card-link">查看进化图谱</div>
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
            <img class="${adoptModalState.transitionSeed > 0 ? "evo-pet-shine" : ""}" src="${resolveAssetUrl(getPetPreviewImage(pet, previewStageNo))}" alt="${escapeHtml(pet.name)}" loading="lazy" onerror="this.src='images/logo.svg'">
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
  if (s.hasPet === false) {
    return "images/logo.svg";
  }
  if (s.petImageUrl) {
    return resolveAssetUrl(s.petImageUrl);
  }
  return `images/pets/${s.petId}_${s.petName}_5.${s.ext}`;
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
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById("gf" + i);
    if (el) el.classList.toggle("active", g === i);
  }
  const allEl = document.getElementById("gfAll");
  if (allEl) allEl.classList.toggle("active", g === null);
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
    alert("请先在「小组」中选择一个组，或使用「分组管理」为学生分组。");
    return;
  }
  openPointModalGroup(groupFilter);
}

function openBatchPointModal() {
  if (batchSelectedNames.size === 0) {
    alert("请先勾选学生。");
    return;
  }
  openPointModalBatch([...batchSelectedNames]);
}

function openAdoptModal(studentName) {
  if (!isHomeroomTeacher()) {
    alert("萌宠领养仅允许班主任执行");
    return;
  }
  adoptTargetName = studentName;
  const t = document.getElementById("adoptModalTitle");
  if (t) t.textContent = studentName + " · 选择萌宠";
  adoptModalState.family = "all";
  adoptModalState.previewStageNo = 1;
  adoptModalState.detailEntrySource = "adopt";
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
    alert("请先登录班主任账号");
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
  } catch (error) {
    alert(error.message || "领养失败");
  }
}

function openGroupManageModal() {
  if (!isHomeroomTeacher()) {
    alert("分组管理仅允许班主任执行");
    return;
  }
  const tbody = document.querySelector("#groupManageTable tbody");
  if (!tbody) return;
  const options = getGroupOptions();
  tbody.innerHTML = students
    .map((s) => {
      const g = s.group || 1;
      return `<tr>
        <td>${s.name}</td>
        <td>
          <select onchange="setStudentGroupByName('${s.name.replace(/'/g, "\\'")}', parseInt(this.value,10))">
            ${options
              .map(
                (option) =>
                  `<option value="${option.groupNo}" ${g === option.groupNo ? "selected" : ""}>${option.name}</option>`,
              )
              .join("")}
          </select>
        </td>
      </tr>`;
    })
    .join("");
  document.getElementById("groupManageModal").classList.add("active");
}

function closeGroupManageModal() {
  document.getElementById("groupManageModal").classList.remove("active");
  renderStudentGrid();
}

function setStudentGroupByName(name, g) {
  const s = students.find((x) => x.name === name);
  if (s) s.group = g;
}

async function saveGroupManageChanges() {
  if (!runtimeState.token || !runtimeState.classId) {
    alert("请先登录班主任账号");
    return;
  }
  if (!isHomeroomTeacher()) {
    alert("分组管理仅允许班主任执行");
    return;
  }
  const groupsPayload = getGroupOptions().map((option) => ({
    id: option.id,
    groupNo: option.groupNo,
    name: option.name,
    studentIds: students
      .filter((student) => Number(student.group) === option.groupNo)
      .map((student) => student.id),
  }));

  try {
    await apiFetch(`/classes/${runtimeState.classId}/groups/students`, {
      method: "PUT",
      body: JSON.stringify({
        groups: groupsPayload,
      }),
    });
    closeGroupManageModal();
    await bootstrapDisplayData({ authenticated: true, silent: true });
  } catch (error) {
    alert(error.message || "保存分组失败");
  }
}

function lvCategory(lv) {
  if (lv >= 4) return "high";
  if (lv >= 2) return "mid";
  return "low";
}

/* ========== 渲染学生卡片 ========== */
function renderStudentGrid() {
  const grid = document.getElementById("studentGrid");
  const indices = getVisibleStudentIndices();
  const escName = (n) =>
    String(n || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");
  grid.innerHTML = indices
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
        : `<span class="card-group-tag">第${s.group}组</span>`;
      const noPetClass = noPet ? " no-pet" : "";
      const batchCls = batchOn && sel ? " batch-selected" : "";
      const modeCls = batchOn ? " batch-mode" : "";
      const qn = s.name.replace(/'/g, "\\'");
      const avatarBlock = noPet
        ? `<div class="card-nameplate card-nameplate--empty" role="button" tabindex="0" title="点击领养萌宠" onclick="event.stopPropagation();openAdoptModal('${qn}')"><span class="card-nameplate-placeholder">待领养</span></div>`
        : `<button type="button" class="card-pet-trigger" title="查看萌宠档案" onclick="event.stopPropagation();openPetProfileByName('${qn}')"><img class="card-pet-img" src="${petImg(s)}" alt="${escapeHtml(s.petName || `${s.name}的萌宠`)}" loading="lazy" onerror="this.src='images/logo.svg'"></button>`;
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
  if (energyContainer) energyContainer.innerHTML = "";
  void overlay.offsetWidth;

  /* 设置内容 */
  avatar.src = petImg(student);
  avatar.alt = `${student.petName || student.name || "萌宠"} 升级形态`;
  text.textContent = `Lv.${afterLevel || student.lv || 1} 发育进化`;
  studentName.textContent = `${student.name || "该学生"} 的 ${student.petName || "萌宠"} 升级了`;

  /* 激活动画 */
  overlay.classList.add("active");

  /* 启动Canvas粒子爆炸效果 */
  let particleRAF = null;
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width = window.innerWidth;
    const h = canvas.height = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const particles = [];
    const startTime = performance.now();

    /* 爆发粒子 — 从中心向外迸射 */
    for (let i = 0; i < 90; i++) {
      const angle = (Math.PI * 2 * i) / 90 + (Math.random() - 0.5) * 0.4;
      const speed = 2 + Math.random() * 6;
      const isGold = Math.random() > 0.3;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.5 + Math.random() * 3,
        life: 0.6 + Math.random() * 0.6,
        born: 0.4 + Math.random() * 0.3,
        color: isGold
          ? `hsla(${40 + Math.random() * 15}, 90%, ${55 + Math.random() * 20}%, `
          : `hsla(0, 0%, ${85 + Math.random() * 15}%, `,
        type: "burst",
        decay: 0.97 + Math.random() * 0.02,
        sparkle: Math.random(),
      });
    }

    /* 持续飘散粒子 — 周围缓缓升起的星尘 */
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: h + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.5 + Math.random() * 1.5),
        r: 0.8 + Math.random() * 2,
        life: 999,
        born: 0,
        color: `hsla(${38 + Math.random() * 12}, 80%, ${60 + Math.random() * 20}%, `,
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
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= p.decay;
          p.vy *= p.decay;
          p.vy += 0.04;
          const alpha = Math.max(0, (1 - age / p.life)) * globalFade;
          const sparkleAlpha = alpha * (0.6 + 0.4 * Math.sin(elapsed * 8 + p.sparkle * 10));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1 - age / p.life * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = p.color + sparkleAlpha.toFixed(3) + ")";
          ctx.fill();
        } else {
          p.x += p.vx + Math.sin(elapsed * 1.5 + p.phase) * 0.3;
          p.y += p.vy;
          if (p.y < -30) { p.y = h + 30; p.x = Math.random() * w; }
          const baseAlpha = 0.3 + 0.3 * Math.sin(elapsed * 2.5 + p.phase);
          const alpha = baseAlpha * globalFade;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color + alpha.toFixed(3) + ")";
          ctx.fill();
        }
      });
      particleRAF = requestAnimationFrame(drawParticles);
    }
    particleRAF = requestAnimationFrame(drawParticles);
  }

  /* 生成能量聚合线条 — 从四周汇聚到中心 */
  if (energyContainer) {
    setTimeout(() => {
      const lineCount = 16;
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
    if (particleRAF) cancelAnimationFrame(particleRAF);
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (energyContainer) energyContainer.innerHTML = "";
    if (typeof onComplete === "function") onComplete();
  }, 5600);
}

/* ========== 渲染今日排行 ========== */
function renderTodayRank() {
  const wrap = document.getElementById("todayRank");
  wrap.innerHTML = students
    .slice(0, 5)
    .map((s, i) => {
      const cls = i === 0 ? "r1" : i === 1 ? "r2" : i === 2 ? "r3" : "rn";
      const sub = s.hasPet === false ? "待领养" : `${s.petName} · Lv.${s.lv}`;
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
      <img class="lb-row-pet" src="${petImg(s)}" alt="${s.hasPet === false ? "待领养" : s.petName}">
      <div class="lb-row-info">
        <div class="lb-row-name">${s.name}</div>
        <div class="lb-row-petname">${s.hasPet === false ? "待领养" : s.petName}</div>
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
  }

  document.querySelectorAll(".bottom-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.target === key);
  });
  if (key === "login") {
    setLoginMessage("");
  }
  if (key === "entry") {
    runtimeState.lockOverlayForced = false;
  }
  if (typeof applyLockOverlay === "function") {
    applyLockOverlay();
  }
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

  /* 阶段3：5.2s → 粒子 + 班级信息 */
  transTimers.push(
    setTimeout(() => {
      initTransParticles(canvas);
      canvas.classList.add("visible");
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
  const pts = [];
  for (let i = 0; i < 70; i++) {
    pts.push({
      x: Math.random() * w,
      y: h + Math.random() * 100,
      r: Math.random() * 2.5 + 0.5,
      speed: Math.random() * 1.2 + 0.4,
      drift: (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.7 ? 45 : 38,
    });
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const t = Date.now() * 0.001;
    pts.forEach((p) => {
      p.y -= p.speed;
      p.x += p.drift + Math.sin(t + p.phase) * 0.3;
      if (p.y < -20) {
        p.y = h + 20;
        p.x = Math.random() * w;
      }
      const a = p.alpha * (0.5 + 0.5 * Math.sin(t * 2.5 + p.phase));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${a})`;
      ctx.fill();
    });
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

  card.addEventListener("mousemove", (e) => {
    if (isDragging) return;
    bounds = card.getBoundingClientRect();
    const px = e.clientX - bounds.left;
    const py = e.clientY - bounds.top;
    const cw = bounds.width;
    const ch = bounds.height;

    const normX = (px / cw) * 2 - 1;
    const normY = (py / ch) * 2 - 1;

    const rotX = -normY * 12; // 显示端可以给更强的3D感
    const rotY = normX * 12;

    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03, 1.03, 1.03)`;
  });

  card.addEventListener("mouseleave", () => {
    if (isDragging) return;
    card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
  });

  const onStart = (e) => {
    if (
      e.target.closest("a") ||
      e.target.closest("button") ||
      e.target.closest("input") ||
      e.target.closest(".card-nameplate--empty")
    )
      return;
    isDragging = true;
    hasMoved = false;
    card.classList.remove("snapping");
    card.classList.add("dragging");

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
    e.preventDefault();
    hasMoved = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    moveX = clientX - startX;
    moveY = clientY - startY;

    const rotZ = moveX * 0.08;

    card.style.transform = `translate(${moveX}px, ${moveY}px) rotateZ(${rotZ}deg) scale(1.08)`;
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

    if (hasMoved) {
      card.classList.add("snapping");

      moveX = 0;
      moveY = 0;
      card.style.transform = `translate(0px, 0px) perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;

      setTimeout(() => {
        card.classList.remove("snapping");
      }, 600);
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
  };

  card.addEventListener("mousedown", onStart);
  card.addEventListener("touchstart", onStart, { passive: false });
}

/* ========== 加减分弹窗处理 ========== */
let currentFocusStudent = null;
let confirmModalResolver = null;

function closeConfirmModal(confirmed = false) {
  document.getElementById("confirmModal")?.classList.remove("active");
  if (confirmModalResolver) {
    const resolver = confirmModalResolver;
    confirmModalResolver = null;
    resolver(confirmed);
  }
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

  cancelBtn.onclick = () => closeConfirmModal(false);
  confirmBtn.onclick = () => closeConfirmModal(true);
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
  currentFocusStudent = { type: "group", group: groupNum };
  document.getElementById("pmAvatar").src = "images/logo.svg";
  document.getElementById("pmName").textContent =
    "第" + groupNum + "组（" + list.length + " 人）";
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
    alert(`暂未在图鉴中找到名为 "${petName || "未知"}" 的萌宠进化详情。`);
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
  avatar.src = petImg(student);
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

  reorderStudents();
  setTimeout(() => {
    closePointModal();
  }, 300);
  renderStudentGrid();
  renderTodayRank();
  renderLeaderboardList();
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
  availableClasses: [],
  home: null,
  groups: [],
  groupMap: new Map(),
  scoreRules: [],
  petCatalog: [],
  rewards: [],
  leaderboardType: "score",
  leaderboardRows: [],
  lockStatus: "locked",
  unlockSessionId: null,
  unlockedUntil: null,
  lastLockedAt: null,
  lockOverlayForced: false,
  pendingLoginResult: null,
  setupStep: 1,
  setupMode: "initialize",
  selectedSetupClassId: null,
  socket: null,
  subscribedClassId: null,
  subscribedDisplayCode: null,
  realtimeRefreshTimer: null,
  pendingPetUpgradeAnimations: [],
  petUpgradePlaying: false,
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
  const host = window.location.hostname || "127.0.0.1";
  return `${window.location.protocol}//${host}:3000/api/v1`;
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

function getSocketBase() {
  const host = window.location.hostname || "127.0.0.1";
  return `${window.location.protocol}//${host}:3000`;
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
  return scopes
    .filter((scope) => scope && scope.classId)
    .map((scope) => Number(scope.classId));
}

function canCurrentUserAccessClass(classId) {
  return getClassScopeIds().includes(Number(classId));
}

function isHomeroomTeacher() {
  return runtimeState.user?.roleCode === "homeroom_teacher";
}

function getGroupOptions() {
  if (runtimeState.groups.length > 0) {
    return runtimeState.groups
      .map((group) => ({
        id: group.id || null,
        groupNo: Number(group.groupNo),
        name: group.name || `第${group.groupNo}组`,
      }))
      .sort((a, b) => a.groupNo - b.groupNo);
  }
  return [1, 2, 3, 4].map((groupNo) => ({
    id: null,
    groupNo,
    name: `第${groupNo}组`,
  }));
}

function connectRealtime() {
  if (runtimeState.socket || typeof window.io !== "function") return;
  const socket = window.io(`${getSocketBase()}/ws`, {
    transports: ["websocket"],
  });
  runtimeState.socket = socket;

  socket.on("connect", () => {
    subscribeRealtimeRooms();
  });

  [
    "class.score.changed",
    "class.leaderboard.changed",
    "reward.order.created",
    "class.student.changed",
    "class.group.changed",
  ].forEach((eventName) => {
    socket.on(eventName, (payload) => {
      if (
        payload?.classId &&
        Number(payload.classId) !== Number(runtimeState.classId)
      ) {
        return;
      }
      if (eventName === "class.score.changed") {
        queuePetUpgradeAnimations(payload?.upgrades);
      }
      scheduleRealtimeRefresh();
    });
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

function scheduleRealtimeRefresh() {
  if (!runtimeState.classId) return;
  if (runtimeState.realtimeRefreshTimer) {
    clearTimeout(runtimeState.realtimeRefreshTimer);
  }
  runtimeState.realtimeRefreshTimer = setTimeout(() => {
    bootstrapDisplayData({
      authenticated: Boolean(runtimeState.token && runtimeState.user),
      silent: true,
    }).catch(() => {});
  }, 250);
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
      ? "如需更换当前终端绑定的班级，请由超级管理员重新授权并完成改绑。完成后，终端将默认进入新的班级展示空间。"
      : "本终端完成初始化后，将自动进入对应班级的展示空间。以后学生可随时查看积分和萌宠成长，教师在需要时解锁操作即可。",
    welcomeTitle: isRebind
      ? "重新绑定当前展示终端"
      : "欢迎启用育英星宠展示终端",
    welcomeDesc: isRebind
      ? "这一过程会保留当前终端编号，并重新由超级管理员授权选择新的绑定班级。改绑完成后，系统会返回首页。"
      : "这一过程仅需几步：识别当前终端、完成管理员授权，并将本终端绑定到指定班级。绑定完成后，系统会自动进入该班的展示主页。",
    welcomeAction: isRebind ? "开始重新绑定" : "开始初始化",
    authTitle: isRebind ? "请由超级管理员确认改绑" : "请由超级管理员完成授权",
    authDesc: isRebind
      ? "为保证终端绑定安全，重新绑定班级也必须由超级管理员完成授权。授权成功后，即可继续选择新的班级。"
      : "为保证终端绑定安全，只有超级管理员可完成首次启用和后续改绑。授权成功后，即可继续选择本终端要绑定的班级。",
    bindTitle: isRebind ? "选择新的默认展示班级" : "选择本终端要进入的班级",
    bindDesc: isRebind
      ? "确认后，当前终端会切换为新班级的大屏展示端。后续仍可由超级管理员再次修改绑定。"
      : "绑定成功后，这块大屏默认会进入对应班级的展示页。后续仍可由超级管理员重新修改绑定。",
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
  goSetupStep(2);
}

function closeTerminalRebind() {
  runtimeState.setupMode = "initialize";
  runtimeState.setupAdminToken = "";
  setSetupMessage("setupAdminMessage", "");
  setSetupMessage("setupBindMessage", "");
  syncSetupMode();
  navigateTo("entry");
}

function renderSetupClassGrid() {
  const wrap = document.getElementById("setupClassGrid");
  if (!wrap) return;
  wrap.innerHTML = runtimeState.availableClasses
    .map(
      (row) => `
            <div class="setup-class-card ${runtimeState.selectedSetupClassId === row.id ? "selected" : ""}" onclick="selectSetupClass(${row.id})">
              <div class="setup-class-name">${escapeHtml(row.gradeName || "")} ${escapeHtml(row.name)}</div>
              <div class="setup-class-sub">
                班主任：${escapeHtml(row.homeroomTeacher?.name || "未设置")}<br />
                口号：${escapeHtml(row.slogan || "未设置")}
              </div>
            </div>`,
    )
    .join("");
}

function selectSetupClass(classId) {
  runtimeState.selectedSetupClassId = Number(classId);
  renderSetupClassGrid();
}

async function handleSetupAdminLogin() {
  const username = document.getElementById("setupAdminUsername")?.value?.trim();
  const password = document.getElementById("setupAdminPassword")?.value || "";
  if (!username || !password) {
    setSetupMessage("setupAdminMessage", "请输入超级管理员账号和密码");
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
    if (result.user?.roleCode !== "super_admin") {
      throw new Error("当前账号不是超级管理员，无法初始化终端");
    }
    runtimeState.setupAdminToken = result.token;
    const classes = await apiFetchWithToken(
      "/classes",
      runtimeState.setupAdminToken,
    );
    runtimeState.availableClasses = classes || [];
    runtimeState.selectedSetupClassId =
      runtimeState.availableClasses[0]?.id || null;
    renderSetupClassGrid();
    setSetupMessage("setupAdminMessage", "授权成功", "success");
    goSetupStep(4);
  } catch (error) {
    runtimeState.setupAdminToken = "";
    setSetupMessage("setupAdminMessage", error.message || "授权失败");
  }
}

async function confirmTerminalInitialize() {
  const terminalNameInput = document.getElementById("setupTerminalName");
  runtimeState.terminalName =
    terminalNameInput?.value?.trim() || runtimeState.terminalName;
  if (!runtimeState.setupAdminToken) {
    setSetupMessage("setupBindMessage", "请先完成超级管理员授权");
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
  if (s.hasPet === false) {
    return "images/logo.svg";
  }
  if (s.petImageUrl) return resolveAssetUrl(s.petImageUrl);
  if (s.avatarUrl) return resolveAssetUrl(s.avatarUrl);
  if (s.petId && s.petName && s.ext) {
    return `images/pets/${s.petId}_${s.petName}_5.${s.ext}`;
  }
  return "images/logo.svg";
}

function getRankedStudentsByScore() {
  return [...students].sort(
    (a, b) => b.pts - a.pts || a.name.localeCompare(b.name, "zh-CN"),
  );
}

function updateGroupToolbar() {
  const allBtn = document.getElementById("gfAll");
  if (allBtn) allBtn.classList.toggle("active", groupFilter === null);
  for (let i = 1; i <= 4; i += 1) {
    const chip = document.getElementById(`gf${i}`);
    if (!chip) continue;
    const group = runtimeState.groups[i - 1];
    chip.style.display = group ? "inline-flex" : "none";
    if (group) {
      chip.textContent = group.name || `第${group.groupNo}组`;
      chip.classList.toggle("active", groupFilter === group.groupNo);
      chip.setAttribute("onclick", `setGroupFilter(${group.groupNo})`);
    }
  }
}

function syncClassroomMeta() {
  const home = runtimeState.home;
  if (!home) return;
  const className = home.className || "育英星宠";
  const teacherName = home.homeroomTeacher?.name || "未设置";
  const slogan = home.slogan || "团结奋进 超越自我";
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
        ? "待领养萌宠"
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
        s.hasPet === false ? "待领养" : `${s.petName || "萌宠"} · Lv.${s.lv}`;
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

function renderLeaderboardTop3() {
  const slots = document.querySelectorAll(".podium-slot");
  const podiumOrder = [1, 0, 2];
  slots.forEach((slot, slotIndex) => {
    const row = runtimeState.leaderboardRows[podiumOrder[slotIndex]];
    if (!row) return;
    const localStudent = students.find((item) => item.id === row.id);
    const displayImage =
      row.avatarUrl ||
      (localStudent ? petImg(localStudent) : "images/logo.svg");
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
    if (petName) petName.textContent = row.petName || "待领养";
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
      const displayImage =
        s.avatarUrl ||
        (localStudent ? petImg(localStudent) : "images/logo.svg");
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
        <div class="lb-row-petname">${escapeHtml(s.petName || "待领养")}</div>
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

function renderRewardCenter() {
  const grid = document.querySelector("#page-exchange .ex-grid");
  if (!grid || runtimeState.rewards.length === 0) return;
  const fallbackImages = [
    "images/gifts/育英台历.jpg",
    "images/gifts/育英小卡.jpg",
    "images/gifts/育英布袋.jpg",
    "images/gifts/育英抱枕.jpg",
  ];
  grid.innerHTML = runtimeState.rewards
    .map(
      (reward, index) => `
          <div class="ex-item-card">
            <div class="ex-item-img-wrap">
              <img src="${resolveAssetUrl(reward.imageUrl) || fallbackImages[index % fallbackImages.length]}" class="ex-item-img" alt="${escapeHtml(reward.name)}" onerror="this.src='${fallbackImages[index % fallbackImages.length]}'" />
            </div>
            <div class="ex-item-body">
              <div class="ex-item-name">${escapeHtml(reward.name)}</div>
              <div class="ex-item-cost">${reward.scoreCost} 积分</div>
              <button class="ex-btn" onclick="initiateExchange(${reward.id}, '${escapeHtml(reward.name)}', ${reward.scoreCost})">
                立即兑换
              </button>
            </div>
          </div>`,
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
  currentFocusStudent = { type: "group", group: groupNum };
  document.getElementById("pmAvatar").src = "images/logo.svg";
  document.getElementById("pmName").textContent =
    "第" + groupNum + "组（" + list.length + " 人）";
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
    alert("当前规则不可用");
    return;
  }
  if (!runtimeState.token) {
    alert("请先登录教师账号");
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
      const result = await apiFetch("/score-records", {
        method: "POST",
        body: JSON.stringify({
          ...payloadBase,
          studentId: student.id,
        }),
      });
      if (result?.petUpgrade?.upgraded) {
        queuePetUpgradeAnimations([
          {
            studentId: result?.studentProfile?.studentId || student.id,
            afterLevel: result?.petUpgrade?.afterLevel,
          },
        ]);
      }
    } else if (currentFocusStudent.type === "batch") {
      const ids = students
        .filter((item) => currentFocusStudent.names.includes(item.name))
        .map((item) => item.id);
      const result = await apiFetch("/score-records/batch", {
        method: "POST",
        body: JSON.stringify({
          ...payloadBase,
          studentIds: ids,
        }),
      });
      queuePetUpgradeAnimations(
        Array.isArray(result?.items)
          ? result.items
              .filter((item) => item?.petUpgrade?.upgraded)
              .map((item) => ({
                studentId: item?.studentProfile?.studentId,
                afterLevel: item?.petUpgrade?.afterLevel,
              }))
          : [],
      );
    } else if (currentFocusStudent.type === "group") {
      const group = runtimeState.groups.find(
        (item) => item.groupNo === currentFocusStudent.group,
      );
      if (!group) {
        throw new Error("当前小组不存在");
      }
      const result = await apiFetch("/score-records/group", {
        method: "POST",
        body: JSON.stringify({
          ...payloadBase,
          classGroupId: group.id,
        }),
      });
      queuePetUpgradeAnimations(
        Array.isArray(result?.items)
          ? result.items
              .filter((item) => item?.petUpgrade?.upgraded)
              .map((item) => ({
                studentId: item?.studentProfile?.studentId,
                afterLevel: item?.petUpgrade?.afterLevel,
              }))
          : [],
      );
    }

    closePointModal();
    await bootstrapDisplayData({ authenticated: true, silent: true });
  } catch (error) {
    alert(error.message || "加减分失败");
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
    alert("请先登录班主任账号");
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
    alert(error.message || "兑换失败");
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
  clearAuthState({ preserveClassId: false });
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
      group: groupInfo?.groupNo || (index % 4) + 1,
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

    if (authenticated) {
      const [studentsData, groups, scoreRules, petCatalog] = await Promise.all([
        apiFetch(`/students?classId=${runtimeState.classId}`),
        apiFetch(`/classes/${runtimeState.classId}/groups`),
        apiFetch(`/score-rules?displayEnabled=true&classId=${runtimeState.classId}`),
        apiFetch("/display/pet-catalog").catch(() => adoptPetCatalog),
      ]);
      runtimeState.groups = groups || [];
      runtimeState.scoreRules = scoreRules || [];
      runtimeState.petCatalog = normalizePetCatalog(petCatalog || []);
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
    }

    syncClassroomMeta();
    syncTodayStar();
    renderStudentGrid();
    playPendingPetUpgradeAnimations();
    renderTodayRank();
    renderRewardCenter();
    await fetchLeaderboard(runtimeState.leaderboardType || "score");
    applyLockOverlay();
  } catch (error) {
    if (!silent) {
      console.error(error);
    }
  }
}

async function handleLogin() {
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

    if (runtimeState.classId) {
      if (!canCurrentUserAccessClass(runtimeState.classId)) {
        throw new Error("当前账号无权进入这块大屏绑定的班级");
      }
      await finalizeTeacherSession();
    } else {
      const classScopeIds = getClassScopeIds();
      if (classScopeIds.length === 0) {
        throw new Error("当前账号未分配任何班级权限");
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
    if (loginBtn) loginBtn.textContent = "登 录";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  resolveRuntimeParams();
  clearAuthState({ preserveClassId: true });
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
