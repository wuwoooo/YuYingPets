(function initDisplayDeco(global) {
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

  const decoAssetWarmCache = new Set();

  function createNoneDeco(type) {
    return { isNone: true, type, id: null, name: "无" };
  }

  function isPetDecoNone(deco) {
    return deco?.isNone === true;
  }

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
      if (fallbackKey !== "::") seen.add(fallbackKey);
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

  function formatLocalYmd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function isThemeFreeRuleActive(rule, date = new Date()) {
    if (!rule || typeof rule !== "object") return false;
    if (rule.kind === "annual") {
      return date.getMonth() + 1 === Number(rule.month) && date.getDate() === Number(rule.day);
    }
    if (rule.kind === "range") {
      const ymd = formatLocalYmd(date);
      return ymd >= rule.start && ymd <= rule.end;
    }
    return false;
  }

  function sortDecorationsWithEquippedFirst(items = [], equipped, isSameDeco) {
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

  function sortThemesWithEquippedFirst(themes = [], isThemeFullyEquipped) {
    return [...themes].sort((a, b) => {
      const aFirst = isThemeFullyEquipped(a.key) ? 0 : 1;
      const bFirst = isThemeFullyEquipped(b.key) ? 0 : 1;
      return aFirst - bFirst;
    });
  }

  function resolveDecoCode(deco) {
    if (!deco) return "";
    if (deco.code) return deco.code;
    const url = `${deco.imageUrl || ""} ${deco.previewUrl || ""}`;
    const match = url.match(/\/([a-z0-9_]+)\.png/i);
    return match ? match[1] : "";
  }

  function buildAccessoryDecoAttrs(deco, helpers = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    const code = resolveDecoCode(deco);
    return code ? `data-deco-code="${escapeHtml(code)}"` : "";
  }

  function extractPetSpeciesCode(student) {
    const url = student?.petImageUrl || "";
    const match = url.match(/(?:^|\/)(\d{3})_/);
    if (match) return match[1];
    if (student?.petId) return String(student.petId).padStart(3, "0");
    return null;
  }

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
        (petSpeciesCode && PET_ANCHOR_MAP[petSpeciesCode]) ||
        PET_ANCHOR_DEFAULT;
      const offsetY = -(acc.stickerCY - anchor.headTopY) + (acc.nudgeY ?? 0);
      return {
        x: acc.offsetX || 0,
        y: +offsetY.toFixed(1),
        scale: acc.scale ?? 1,
      };
    }
    return { x: 0, y: 0, scale: 1 };
  }

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

  function resolveDecoPreviewSize() {
    return 400;
  }

  function warmDecoAssetCache(decos, size = 400, helpers = {}) {
    const resolveDecoAssetUrl = helpers.resolveDecoAssetUrl || (() => "");
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

  function setDecoLayerElement(el, deco, size = 1024, helpers = {}) {
    if (!el) return;
    const resolveDecoAssetUrl = helpers.resolveDecoAssetUrl || (() => "");
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
    helpers = {},
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
    const resolveDecoAssetUrl = helpers.resolveDecoAssetUrl || (() => "");
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

  function buildCardDecoLayers(student = {}, helpers = {}) {
    const resolveDecoAssetUrl = helpers.resolveDecoAssetUrl || (() => "");
    const themeBackdropType = helpers.themeBackdropType || "theme_backdrop";
    const decos = student.equippedDecorations;
    if (!decos || decos.length === 0) return "";
    let html = "";
    const backdrop = decos.find((deco) => deco.type === themeBackdropType);
    const bg = decos.find((deco) => deco.type === "background");
    const frame = decos.find((deco) => deco.type === "frame");
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

  global.DisplayDeco = {
    PET_ANCHOR_MAP,
    PET_ANCHOR_DEFAULT,
    ACC_PLACEMENT,
    createNoneDeco,
    isPetDecoNone,
    normalizeDecoArrayPayload,
    mergeDecorationCatalogWithKnownState,
    formatLocalYmd,
    isThemeFreeRuleActive,
    sortDecorationsWithEquippedFirst,
    sortThemesWithEquippedFirst,
    resolveDecoCode,
    buildAccessoryDecoAttrs,
    extractPetSpeciesCode,
    computeDecoTransform,
    applyDecoOffset,
    resolveDecoPreviewSize,
    warmDecoAssetCache,
    setDecoLayerElement,
    syncAccessoryDecoElement,
    buildCardDecoLayers,
  };
})(window);
