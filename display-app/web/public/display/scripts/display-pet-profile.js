(function initDisplayPetProfile(global) {
  function resolvePetDisplayName(student = {}, fallback = "星宠伙伴") {
    return student.petNickname || student.petName || fallback;
  }

  function resolveCardCustomName(student = {}) {
    return student.petNickname || student.petCustomName || "";
  }

  function normalizePetNicknameInput(value, maxChars = 12) {
    return Array.from(String(value || "").trim()).slice(0, maxChars).join("");
  }

  function resolveStudentPetId(student = {}) {
    return student.studentPetId || student.petRecordId || student.petId || null;
  }

  function splitAcademicAiLines(text) {
    return String(text || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function buildHistoryRows(records = [], helpers = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    if (!records.length) {
      return '<div class="pet-history-empty">暂无成长记录</div>';
    }
    return records
      .map(
        (record) => `
      <div class="pet-history-row">
        <div class="pet-history-main">${escapeHtml(record.title || record.reason || "成长记录")}</div>
        <div class="pet-history-meta">${escapeHtml(record.time || record.createdAt || "")}</div>
      </div>`,
      )
      .join("");
  }

  global.DisplayPetProfile = {
    resolvePetDisplayName,
    resolveCardCustomName,
    normalizePetNicknameInput,
    resolveStudentPetId,
    splitAcademicAiLines,
    buildHistoryRows,
  };
})(window);
