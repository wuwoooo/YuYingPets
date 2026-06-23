(function initDisplayPetCatalog(global) {
  const PET_STAGE_COUNT = 10;
  const STAR_SEED_IMAGE_URL = "/assets/pets/400/star-seed.png";
  const ADOPT_ORBIT_LAYOUT = {
    centerX: 50,
    centerY: 54,
    radiusX: 48,
    radiusY: 30,
    startDeg: 154,
    endDeg: 26,
  };

  const DEFAULT_PET_CATALOG_SEEDS = [
    ["051", "星尘鸮", "star"],
    ["052", "星糖喵", "star"],
    ["053", "晨露鹿", "star"],
    ["054", "曜虎机", "star"],
    ["055", "月纱兔", "star"],
    ["056", "森歌獭", "star"],
    ["057", "樱铃猫", "star"],
    ["058", "泡泡狐", "star"],
    ["059", "潮汐獭", "star"],
    ["060", "烈焰牛", "star"],
    ["061", "玉麒团", "star"],
    ["062", "电波狸", "star"],
    ["063", "竹团貘", "star"],
    ["064", "糖霜鹿", "star"],
    ["065", "绒雪喵", "star"],
    ["066", "蜜桃狐", "star"],
    ["067", "钢牙鲨", "star"],
    ["068", "雷翼狼", "star"],
    ["069", "霓虹豚", "star"],
    ["070", "风暴柴", "star"],
    ["071", "岩角龙", "star"],
    ["072", "布丁兔", "star"],
    ["073", "云团熊", "star"],
    ["074", "子鼠宝", "zodiac"],
    ["075", "丑牛宝", "zodiac"],
    ["076", "寅虎宝", "zodiac"],
    ["077", "卯兔宝", "zodiac"],
    ["078", "辰龙宝", "zodiac"],
    ["079", "巳蛇宝", "zodiac"],
    ["080", "午马宝", "zodiac"],
    ["081", "未羊宝", "zodiac"],
    ["082", "申猴宝", "zodiac"],
    ["083", "酉鸡宝", "zodiac"],
    ["084", "戌狗宝", "zodiac"],
    ["085", "亥猪宝", "zodiac"],
  ];

  const DEFAULT_PET_CATALOG = DEFAULT_PET_CATALOG_SEEDS.map(
    ([code, name, category]) => ({
      code,
      name,
      category,
      coverUrl: `/assets/pets/400/${code}_${name}_1.png`,
    }),
  );

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

  function getDefaultPetCatalog() {
    return DEFAULT_PET_CATALOG.map((item) => ({ ...item }));
  }

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

  function getState(context) {
    return context.adoptModalState;
  }

  function getAdoptCatalog(context) {
    const runtimeState = context.runtimeState || {};
    const source =
      Array.isArray(runtimeState.petCatalog) && runtimeState.petCatalog.length > 0
        ? runtimeState.petCatalog
        : getDefaultPetCatalog();
    return normalizePetCatalog(source);
  }

  function getFilteredAdoptCatalog(context) {
    const state = getState(context);
    return getAdoptCatalog(context).filter(
      (pet) =>
        state.family === "all" || resolvePetFamily(pet.category) === state.family,
    );
  }

  function getVisibleAdoptFamilyOptions(context) {
    const familiesWithPets = new Set(
      getAdoptCatalog(context).map((pet) => resolvePetFamily(pet.category)),
    );
    return PET_FAMILY_OPTIONS.filter(
      (option) => option.key === "all" || familiesWithPets.has(option.key),
    );
  }

  function normalizeAdoptFamilySelection(context) {
    const state = getState(context);
    const options = getVisibleAdoptFamilyOptions(context);
    if (!options.some((option) => option.key === state.family)) {
      state.family = "all";
    }
    return options;
  }

  function getSelectedAdoptPet(context) {
    const state = getState(context);
    return (
      getAdoptCatalog(context).find((pet) => pet.code === state.selectedPetCode) ||
      null
    );
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

  function ensureAdoptPreviewStageImage(context, previewEl, pet, stageNo) {
    const existing = previewEl.querySelector(`img[data-stage-no="${stageNo}"]`);
    if (existing) return existing;
    const previewImageUrl = getPetPreviewImage(pet, stageNo);
    const showcaseSize = context.isLowSpecMode() ? 400 : context.getShowcasePetImageSize();
    const highResPreviewUrl = context.resolvePetAssetVariantUrl(
      previewImageUrl,
      showcaseSize,
    );
    const fallbackPreviewUrl =
      context.resolvePetAssetVariantUrl(previewImageUrl, 400) || "images/logo.svg";
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

  function updateAdoptPetDetailStage(context, petCode, stageNo) {
    const state = getState(context);
    const detail = document.getElementById("adoptPetDetail");
    if (!detail || detail.dataset.petCode !== String(petCode)) return false;
    const pet = getSelectedAdoptPet(context);
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
      previewEl.dataset.transitionSeed = String(state.transitionSeed);
      const activeImg = ensureAdoptPreviewStageImage(
        context,
        previewEl,
        pet,
        previewStageNo,
      );
      previewEl.querySelectorAll("img[data-stage-no]").forEach((img) => {
        const active = img === activeImg;
        img.hidden = !active;
        img.style.display = active ? "" : "none";
        img.classList.toggle("evo-pet-shine", active && !context.isLowSpecMode());
      });
    }

    const currentName = detail.querySelector(".adopt-stage-current-name");
    if (currentName) {
      currentName.textContent =
        selectedStage?.name || `${pet.name} · Lv.${previewStageNo}`;
    }
    const currentLevel = detail.querySelector(
      '[data-adopt-stat="current-level"] strong',
    );
    if (currentLevel) {
      currentLevel.textContent = `Lv.${selectedStage?.stageNo || previewStageNo}`;
    }
    const needScore = detail.querySelector('[data-adopt-stat="need-score"] strong');
    if (needScore) needScore.textContent = String(selectedStage?.needScoreTotal ?? 0);
    const nextLevel = detail.querySelector('[data-adopt-stat="next-level"] strong');
    if (nextLevel) nextLevel.textContent = nextStage ? `Lv.${nextStage.stageNo}` : "已满级";
    const scoreDiff = detail.querySelector('[data-adopt-stat="score-diff"] strong');
    if (scoreDiff) {
      scoreDiff.textContent = String(
        nextStage
          ? nextStage.needScoreTotal - (selectedStage?.needScoreTotal ?? 0)
          : 0,
      );
    }
    const hint = detail.querySelector(".adopt-stage-hint");
    if (hint) {
      hint.textContent = previousStage
        ? `上一形态 Lv.${previousStage.stageNo} 已解锁，下一形态 ${nextStage ? `Lv.${nextStage.stageNo}` : "已到终点"}.`
        : `当前是初始形态，下一形态 ${nextStage ? `Lv.${nextStage.stageNo}` : "已到终点"}.`;
    }
    const evoText = detail.querySelector(".evo-text");
    if (evoText) {
      evoText.textContent = `Lv.${selectedStage?.stageNo || previewStageNo} 进化形态`;
    }
    return true;
  }

  function renderAdoptFamilyTabs(context) {
    const state = getState(context);
    const tabs = document.getElementById("adoptPetFamilyTabs");
    if (!tabs) return;
    const options = normalizeAdoptFamilySelection(context);
    tabs.innerHTML = options
      .map(
        (option) => `
      <button
        type="button"
        class="adopt-family-chip${state.family === option.key ? " active" : ""}"
        onclick="setAdoptPetFamily('${option.key}')"
      >
        ${context.escapeHtml(option.label)}
      </button>`,
      )
      .join("");
  }

  function renderAdoptPetGrid(context) {
    const state = getState(context);
    const grid = document.getElementById("adoptPetGrid");
    if (!grid) return;
    const catalog = getFilteredAdoptCatalog(context);
    const gridSignature = JSON.stringify({
      family: state.family,
      selectedPetCode: state.selectedPetCode,
      previewStageNo: state.previewStageNo,
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
        const previewStageNo =
          state.selectedPetCode === pet.code ? state.previewStageNo : 1;
        return `
      <div
        class="adopt-pet-card${state.selectedPetCode === pet.code ? " active" : ""}"
        onclick="openAdoptPetDetailModal('${pet.code}', ${previewStageNo})"
        role="button"
        tabindex="0"
      >
        <div class="adopt-pet-card-image">
          <img src="${context.resolveAssetUrl(getPetPreviewImage(pet, previewStageNo))}" alt="${context.escapeHtml(pet.name)}" loading="lazy" onerror="this.src='images/logo.svg'">
        </div>
        <div class="adopt-pet-card-body">
          <div class="adopt-pet-card-name">${context.escapeHtml(pet.name)}</div>
        </div>
      </div>`;
      })
      .join("");
  }

  function renderAdoptPetDetail(context) {
    const state = getState(context);
    const detail = document.getElementById("adoptPetDetail");
    if (!detail) return;
    const pet = getSelectedAdoptPet(context);
    const title = document.getElementById("adoptPetDetailTitle");
    if (!pet) {
      if (title) title.textContent = "未找到萌宠信息";
      detail.innerHTML = `
      <div class="adopt-pet-empty" style="padding: 100px 0;">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 48px; margin-bottom: 20px; color: rgba(255,255,255,0.2);"></i>
        <p>未能在当前图鉴中找到编号为 "${state.selectedPetCode}" 的萌宠记录。</p>
        <button class="card-adopt-btn" style="margin-top: 20px; width: auto; padding: 10px 30px;" onclick="closeAdoptPetDetailModal()">关闭</button>
      </div>`;
      return;
    }

    if (title) title.textContent = `${pet.name} · 进化图谱`;
    const familyLabel = resolvePetFamilyLabel(pet.category);
    const categoryLabel = resolvePetCategoryLabel(pet.category);
    const { stages, previewStageNo, selectedStage, nextStage, previousStage } =
      getAdoptStageContext(pet, state.previewStageNo || 1);
    const theme = resolvePetTheme(pet.category);
    const isAdoptLite = context.isLowSpecMode();
    const coreX = ADOPT_ORBIT_LAYOUT.centerX;
    const coreY = 66;
    const selectedOrbit = getAdoptOrbitPosition(Math.max(0, previewStageNo - 1));
    const selectedNodeX = selectedOrbit.x;
    const selectedNodeY = selectedOrbit.y;
    const beamDeltaX = coreX - selectedNodeX;
    const beamDeltaY = coreY - selectedNodeY;
    const beamLength = Math.sqrt(beamDeltaX * beamDeltaX + beamDeltaY * beamDeltaY);
    const beamAngle = Math.atan2(beamDeltaY, beamDeltaX) * (180 / Math.PI);
    const particleDots = isAdoptLite
      ? ""
      : Array.from({ length: 18 }, (_, index) => {
          const angle = (index / 18) * Math.PI * 2;
          const radius = 26 + (index % 4) * 8;
          const x = 50 + Math.cos(angle) * radius;
          const y = 62 + Math.sin(angle) * (radius * 0.62);
          return `<span class="adopt-stage-particle p-${(index % 3) + 1}" style="--particle-x:${x.toFixed(2)}%; --particle-y:${y.toFixed(2)}%; --particle-size:${4 + (index % 3) * 2}px; --particle-delay:${(index % 6) * 0.45}s; --particle-duration:${4.5 + (index % 5) * 0.6}s;"></span>`;
        }).join("");
    const runeMarks = isAdoptLite
      ? ""
      : Array.from(
          { length: 6 },
          (_, index) =>
            `<span class="adopt-stage-rune rune-${index + 1}" style="--rune-angle:${-90 + index * 60}deg;">✦</span>`,
        ).join("");
    const energyShards = isAdoptLite
      ? ""
      : Array.from({ length: 8 }, (_, index) => {
          const angle = -66 + index * 18;
          const radius = index % 2 === 0 ? 34 : 39;
          return `<span class="adopt-stage-shard shard-${index + 1}" style="--shard-angle:${angle}deg; --shard-radius:${radius}%; --shard-delay:${(index % 4) * 0.35}s;"></span>`;
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
            <img src="${context.resolveAssetUrl(stage.imageUrl)}" alt="${context.escapeHtml(stage.name || pet.name)}" loading="lazy" decoding="async" fetchpriority="low" onerror="this.src='images/logo.svg'">
          </div>
          <span>Lv.${stage.stageNo}</span>
        </button>`,
      )
      .join("");
    const previewImageUrl = getPetPreviewImage(pet, previewStageNo);
    const showcaseSize = isAdoptLite ? 400 : context.getShowcasePetImageSize();
    const highResPreviewUrl = context.resolvePetAssetVariantUrl(
      previewImageUrl,
      showcaseSize,
    );
    const fallbackPreviewUrl =
      context.resolvePetAssetVariantUrl(previewImageUrl, 400) || "images/logo.svg";
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
          <div class="adopt-detail-preview" data-transition-seed="${state.transitionSeed}">
            <img class="${!isAdoptLite && state.transitionSeed > 0 ? "evo-pet-shine" : ""}" data-stage-no="${previewStageNo}" src="${highResPreviewUrl}" alt="${context.escapeHtml(pet.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${context.escapeHtml(fallbackPreviewUrl)}'">
            ${
              !isAdoptLite && state.transitionSeed > 0
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
          <span class="adopt-pet-tag" style="background:${theme.accentSoft}; color:${theme.accent};">${context.escapeHtml(familyLabel)}</span>
          ${
            familyLabel !== categoryLabel
              ? `<span class="adopt-pet-tag adopt-pet-tag--subtle">${context.escapeHtml(categoryLabel)}</span>`
              : ""
          }
          <span class="adopt-pet-tag adopt-pet-tag--ghost">${pet.sourceType === "system" ? "系统图鉴" : "自定义图鉴"}</span>
        </div>
        <div class="adopt-stage-kicker">成长星轨</div>
        <h3>${context.escapeHtml(pet.name)}</h3>
        <div class="adopt-stage-current-name">${context.escapeHtml(selectedStage?.name || `${pet.name} · Lv.${previewStageNo}`)}</div>
        <p>${context.escapeHtml(
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
          state.detailEntrySource === "adopt" && context.getAdoptTargetName()
            ? `<button type="button" class="card-adopt-btn adopt-detail-confirm" onclick="confirmAdopt('${pet.code}')">
                确认领养 ${context.escapeHtml(pet.name)}
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

  function renderAdoptPetModal(context) {
    renderAdoptFamilyTabs(context);
    renderAdoptPetGrid(context);
  }

  function setAdoptPetFamily(context, family) {
    const state = getState(context);
    const options = getVisibleAdoptFamilyOptions(context);
    state.family = options.some((option) => option.key === family) ? family : "all";
    const filtered = getFilteredAdoptCatalog(context);
    if (!filtered.some((pet) => pet.code === state.selectedPetCode)) {
      state.selectedPetCode = filtered[0]?.code || null;
    }
    state.previewStageNo = 1;
    renderAdoptPetModal(context);
  }

  function previewAdoptPet(context, petCode, stageNo = 1) {
    const state = getState(context);
    const detailModalActive = document
      .getElementById("adoptPetDetailModal")
      ?.classList.contains("active");
    state.selectedPetCode = petCode;
    state.previewStageNo = stageNo;
    state.transitionSeed += 1;
    if (detailModalActive && updateAdoptPetDetailStage(context, petCode, stageNo)) {
      return;
    }
    renderAdoptPetGrid(context);
    if (detailModalActive) {
      renderAdoptPetDetail(context);
    }
  }

  function openAdoptPetDetailModal(
    context,
    petCode,
    stageNo = 1,
    entrySource = "adopt",
  ) {
    const state = getState(context);
    state.detailEntrySource = entrySource;
    state.selectedPetCode = petCode;
    state.previewStageNo = stageNo;
    state.transitionSeed += 1;
    renderAdoptPetDetail(context);
    document.getElementById("adoptPetDetailModal")?.classList.add("active");
  }

  function closeAdoptPetDetailModal() {
    document.getElementById("adoptPetDetailModal")?.classList.remove("active");
  }

  global.DisplayPetCatalog = {
    PET_STAGE_COUNT,
    STAR_SEED_IMAGE_URL,
    getDefaultPetCatalog,
    getAdoptOrbitPosition,
    resolvePetCategoryMeta,
    resolvePetFamily,
    resolvePetFamilyLabel,
    resolvePetCategoryLabel,
    resolvePetTheme,
    normalizePetStage,
    normalizePetCatalogItem,
    normalizePetCatalog,
    getAdoptCatalog,
    getFilteredAdoptCatalog,
    getVisibleAdoptFamilyOptions,
    normalizeAdoptFamilySelection,
    getSelectedAdoptPet,
    setAdoptPetFamily,
    previewAdoptPet,
    openAdoptPetDetailModal,
    closeAdoptPetDetailModal,
    getPetPreviewImage,
    getAdoptStageContext,
    updateAdoptPetDetailStage,
    renderAdoptFamilyTabs,
    renderAdoptPetGrid,
    renderAdoptPetDetail,
    renderAdoptPetModal,
  };
})(window);
