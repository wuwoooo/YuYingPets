(function initDisplayStudentGrid(global) {
  "use strict";

  function sortStudents(students = [], mode = "score") {
    const rows = Array.isArray(students) ? [...students] : [];
    if (mode === "score") return rows.sort((a, b) => Number(b.pts || 0) - Number(a.pts || 0));
    return rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "zh-CN"));
  }

  function getVisibleStudentIndices(students = [], groupFilter = null) {
    const result = [];
    const targetGroup = groupFilter == null ? null : Number(groupFilter);
    students.forEach((student, index) => {
      if (
        targetGroup == null ||
        Number(student.group) === targetGroup
      ) {
        result.push(index);
      }
    });
    return result;
  }

  function createRenderSignature(students = [], indices = []) {
    return JSON.stringify(
      indices.map((index) => {
        const student = students[index];
        return [
          student?.id,
          student?.name,
          student?.pts,
          student?.lv,
          student?.group,
          student?.hasPet,
          student?.petImageUrl,
          student?.petNickname,
          student?.equippedDecorations?.length || 0,
        ];
      }),
    );
  }

  function toggleSelectedName(selectedNames, name) {
    const next = new Set(selectedNames || []);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    return next;
  }

  function selectAllVisible(students = [], indices = []) {
    return new Set(indices.map((index) => students[index]?.name).filter(Boolean));
  }

  function getBatchCountText(count) {
    return count > 0 ? `已选 ${count} 人` : "未选择学生";
  }

  function lvCategory(lv) {
    if (lv >= 4) return "high";
    if (lv >= 2) return "mid";
    return "low";
  }

  function studentCardDomKey(student) {
    if (!student) return "";
    return student.id != null ? `id:${student.id}` : `name:${student.name || ""}`;
  }

  function escapeAttribute(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");
  }

  function escapeSingleQuotedJs(value) {
    return String(value || "").replace(/'/g, "\\'");
  }

  function buildStudentCardTopRightHtml(student, options = {}) {
    const escapeHtml = options.escapeHtml || ((value) => String(value ?? ""));
    const batchMode = Boolean(options.batchMode);
    const selected = Boolean(options.selected);
    const groupLabel =
      options.groupLabel ||
      student?.groupName ||
      (options.getGroupLabel ? options.getGroupLabel(student?.group) : "");
    const hideUngrouped = options.hideUngrouped !== false;
    if (!batchMode) {
      return groupLabel && (!hideUngrouped || groupLabel !== "未分组")
        ? `<span class="card-group-tag">${escapeHtml(groupLabel)}</span>`
        : "";
    }
    const safeName = escapeSingleQuotedJs(student?.name);
    return `<input type="checkbox" class="card-batch-check" ${selected ? "checked" : ""} onclick="toggleBatchSelect('${safeName}', event)">`;
  }

  function applyStudentCardRank(card, visiblePosition) {
    if (!card) return;
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

  function buildStudentCardHtml(student, realIdx, view = {}, helpers = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    const petImg = helpers.petImg || (() => "images/logo.svg");
    const buildCardDecoLayers = helpers.buildCardDecoLayers || (() => "");
    const resolvePetDisplayName =
      helpers.resolvePetDisplayName || ((row) => row?.petName || row?.name || "星宠");
    const resolveCardCustomName = helpers.resolveCardCustomName || (() => "");
    const getGroupLabel = helpers.getGroupLabel || (() => "未分组");

    const visPos = Number.isInteger(view.visiblePosition)
      ? view.visiblePosition
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
      visPos >= 0 && visPos < 3 && view.studentSortMode === "score"
        ? `<span class="card-rank-badge">${visPos + 1}</span>`
        : "";
    const noPet = student.hasPet === false;
    const batchOn = Boolean(view.batchMode);
    const selectedNames = view.batchSelectedNames || new Set();
    const selected = selectedNames.has(student.name);
    const groupLabel = student.groupName || getGroupLabel(student.group);
    const topRight = buildStudentCardTopRightHtml(student, {
      batchMode: batchOn,
      selected,
      groupLabel,
      escapeHtml,
    });
    const noPetClass = noPet ? " no-pet" : "";
    const batchCls = batchOn && selected ? " batch-selected" : "";
    const modeCls = batchOn ? " batch-mode" : "";
    const safeNameForJs = escapeSingleQuotedJs(student.name);
    const safeNameAttr = escapeAttribute(student.name);
    const imageLoading = visPos >= 0 && visPos < 8 ? "eager" : "lazy";
    const imagePriority = visPos >= 0 && visPos < 8 ? "high" : "low";
    const decoLayers = !noPet ? buildCardDecoLayers(student) : "";
    const petDisplayLabel = resolvePetDisplayName(student);
    const customName = resolveCardCustomName(student);
    const cardNameHtml = `<span class="card-student-name">${escapeHtml(student.name)}</span>${customName ? `<span class="card-custom-name">（${escapeHtml(customName)}）</span>` : ""}`;
    const avatarBlock = noPet
      ? `<button type="button" class="card-pet-trigger card-pet-trigger--seed" onclick="event.stopPropagation();openAdoptModal('${safeNameForJs}')"><img class="card-pet-img card-pet-img--seed" src="${petImg(student)}" alt="待孕育星种" loading="${imageLoading}" decoding="async" fetchpriority="${imagePriority}" draggable="false" onerror="this.src='images/logo.svg'"><span class="card-nameplate-placeholder">待孕育</span></button>`
      : decoLayers
        ? `<button type="button" class="card-pet-trigger" data-student-name="${safeNameAttr}"><div class="card-pet-deco-wrap">${decoLayers}<img class="card-pet-img" src="${petImg(student)}" alt="${escapeHtml(petDisplayLabel)}" loading="${imageLoading}" decoding="async" fetchpriority="${imagePriority}" draggable="false" onerror="this.src='images/logo.svg'"></div></button>`
        : `<button type="button" class="card-pet-trigger" data-student-name="${safeNameAttr}"><img class="card-pet-img" src="${petImg(student)}" alt="${escapeHtml(petDisplayLabel)}" loading="${imageLoading}" decoding="async" fetchpriority="${imagePriority}" draggable="false" onerror="this.src='images/logo.svg'"></button>`;

    return `
      <div class="student-card ${rankClass}${noPetClass}${batchCls}${modeCls}"${hiddenAttr}${hiddenStyle} data-student-key="${studentCardDomKey(student)}" data-student-id="${student.id ?? ""}" data-student-name="${safeNameAttr}">
        ${topRight}
        ${badge}
        ${avatarBlock}
        <div class="card-name">${cardNameHtml}</div>
        <div class="card-info">
          <span class="card-level" data-lv="${lvCategory(student.lv)}">Lv.${student.lv}</span>
          <span class="card-points">${student.pts}分</span>
          ${student.medals > 0 ? `<span class="card-medals"><i class="fa-solid fa-medal" aria-hidden="true"></i>×${student.medals}</span>` : ""}
        </div>
      </div>`;
  }

  function buildStudentGridHtml(students = [], indices = [], view = {}, helpers = {}) {
    const visiblePositionByRealIdx = new Map(
      indices.map((realIdx, visPos) => [realIdx, visPos]),
    );
    return students
      .map((student, realIdx) =>
        buildStudentCardHtml(
          student,
          realIdx,
          {
            ...view,
            visiblePosition: visiblePositionByRealIdx.has(realIdx)
              ? visiblePositionByRealIdx.get(realIdx)
              : -1,
          },
          helpers,
        ),
      )
      .join("");
  }

  global.DisplayStudentGrid = {
    sortStudents,
    getVisibleStudentIndices,
    createRenderSignature,
    toggleSelectedName,
    selectAllVisible,
    getBatchCountText,
    lvCategory,
    studentCardDomKey,
    buildStudentCardTopRightHtml,
    applyStudentCardRank,
    buildStudentCardHtml,
    buildStudentGridHtml,
  };
})(window);
