(function initDisplayLeaderboard(global) {
  function resolveLeaderboardMetric(row = {}, context = {}) {
    if (context.leaderboardType === "pet-level") {
      return { value: row.currentPetLevel || 1, unit: "级" };
    }
    if (context.leaderboardType === "honor") {
      return {
        value:
          row.honorsCount ??
          context.students?.find((item) => item.id === row.id)?.medals ??
          0,
        unit: "枚",
      };
    }
    return { value: row.currentScore || 0, unit: "分" };
  }

  function renderLeaderboardRow(row = {}, context = {}) {
    const escapeHtml = context.escapeHtml || ((value) => String(value ?? ""));
    const localStudent = context.students?.find((item) => item.id === row.id);
    const displayImage = context.leaderboardPetImg?.(row, localStudent) || "images/logo.svg";
    const metric = resolveLeaderboardMetric(row, context);
    return `
    <div class="lb-row">
      <span class="lb-row-num">${row.rank}</span>
      <img class="lb-row-pet" src="${displayImage}" alt="${escapeHtml(row.petNickname || row.petName || row.name)}" onerror="this.src='images/logo.svg'">
      <div class="lb-row-info">
        <div class="lb-row-name">${escapeHtml(row.name)}</div>
        <div class="lb-row-petname">${escapeHtml(row.petNickname || row.petName || "待孕育星种")}</div>
      </div>
      <div class="lb-row-right">
        <span class="lb-row-lv">Lv.${row.currentPetLevel || 1}</span>
        <span class="lb-row-xp">${metric.value} ${metric.unit}</span>
      </div>
    </div>`;
  }

  function renderLeaderboardListHtml(rows = [], context = {}) {
    return rows.slice(3, 10).map((row) => renderLeaderboardRow(row, context)).join("");
  }

  function applyLeaderboardTop3(slots, rows = [], context = {}) {
    const podiumOrder = [1, 0, 2];
    slots.forEach((slot, slotIndex) => {
      const row = rows[podiumOrder[slotIndex]];
      if (!row) return;
      const localStudent = context.students?.find((item) => item.id === row.id);
      const displayImage = context.leaderboardPetImg?.(row, localStudent) || "images/logo.svg";
      const metric = resolveLeaderboardMetric(row, context);
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
      if (name) name.textContent = row.name || "";
      if (petName) petName.textContent = row.petName || "待孕育星种";
      if (lv) lv.textContent = `Lv.${row.currentPetLevel || 1}`;
      if (xp) xp.textContent = `${metric.value} ${metric.unit}`;
      if (rankRing) rankRing.textContent = String(row.rank || "");
    });
  }

  global.DisplayLeaderboard = {
    resolveLeaderboardMetric,
    renderLeaderboardRow,
    renderLeaderboardListHtml,
    applyLeaderboardTop3,
  };
})(window);
