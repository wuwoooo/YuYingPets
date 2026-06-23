(function initDisplayHonor(global) {
  const CLASS_HONOR_BADGE_LIMIT = 6;

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

  function mergeRecentHonors(records = [], existing = []) {
    const normalized = records.map(normalizeHonorRecord).filter(Boolean);
    const seen = new Set();
    const merged = [];
    [...normalized, ...existing].forEach((item) => {
      const key = `${item.id || ""}:${item.honorId || ""}:${item.studentId || ""}:${item.grantedAt || ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });
    return merged.slice(0, 12);
  }

  function mergeClassHonors(records = [], existing = []) {
    const normalized = records
      .map(normalizeHonorRecord)
      .filter((item) => item && item.targetType === "class");
    const seen = new Set();
    const merged = [];
    [...normalized, ...existing].forEach((item) => {
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
    return merged;
  }

  function renderClassHonorBadgeHtml(item, helpers = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    const resolveAssetUrl = helpers.resolveAssetUrl || ((value) => value || "");
    const title = escapeHtml(item.honorName || "集体荣誉");
    const iconUrl = item.honorIconUrl ? resolveAssetUrl(item.honorIconUrl) : "";
    if (iconUrl) {
      return `<span class="class-honor-badge" title="${title}"><img src="${escapeHtml(iconUrl)}" alt="${title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><i class="fa-solid fa-people-group class-honor-badge-fallback" aria-hidden="true"></i></span>`;
    }
    return `<span class="class-honor-badge class-honor-badge--fallback" title="${title}"><i class="fa-solid fa-people-group" aria-hidden="true"></i></span>`;
  }

  function renderClassHonorBadgesHtml(honors = [], options = {}, helpers = {}) {
    const limit = options.limit ?? CLASS_HONOR_BADGE_LIMIT;
    const rows = Array.isArray(honors) ? honors : [];
    if (!rows.length) return "";
    const visible = rows.slice(0, limit);
    const badges = visible.map((item) => renderClassHonorBadgeHtml(item, helpers)).join("");
    if (rows.length <= limit) return badges;
    return `${badges}<span class="class-honor-badge class-honor-badge--more" title="更多集体荣誉">+${rows.length - limit}</span>`;
  }

  function buildHonorMarqueeLine(item, context = {}) {
    const escapeHtml = context.escapeHtml || ((value) => String(value ?? ""));
    const honorName = escapeHtml(item.honorName || "荣誉勋章");
    if (item.targetType === "class") {
      return `<span class="marquee-honor-line">🏆 全班 获得荣誉「${honorName}」</span>`;
    }
    const studentName = escapeHtml(
      item.studentName ||
        context.students?.find((row) => row.id === item.studentId)?.name ||
        "同学",
    );
    return `<span class="marquee-honor-line">🎖 ${studentName} 获得荣誉「${honorName}」</span>`;
  }

  function renderHonorBadgeIcon(item, helpers = {}, options = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    const resolveAssetUrl = helpers.resolveAssetUrl || ((value) => value || "");
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

  function renderHonorFeedHtml(honors = [], helpers = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    const rows = Array.isArray(honors) ? honors.slice(0, 6) : [];
    if (!rows.length) {
      return '<div class="honor-feed-empty">暂无荣誉记录，教师颁发后将在此展示</div>';
    }
    return rows
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
        ${renderHonorBadgeIcon(item, helpers, { isClass })}
        <div class="honor-feed-main">
          <div class="honor-feed-title">${title}</div>
          <div class="honor-feed-meta">${meta || "刚刚颁发"}</div>
        </div>
      </div>`;
      })
      .join("");
  }

  global.DisplayHonor = {
    CLASS_HONOR_BADGE_LIMIT,
    formatHonorGrantedTime,
    normalizeHonorRecord,
    mergeRecentHonors,
    mergeClassHonors,
    renderClassHonorBadgeHtml,
    renderClassHonorBadgesHtml,
    buildHonorMarqueeLine,
    renderHonorBadgeIcon,
    renderHonorFeedHtml,
  };
})(window);
