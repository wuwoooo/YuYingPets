(function initDisplayGroup(global) {
  "use strict";

  function getStudentDraftKey(student, index = 0) {
    return String(student?.id ?? `${student?.name || "student"}-${index}`);
  }

  function createGroupManageDraft(groupOptions = [], students = []) {
    return {
      groups: groupOptions.map((option) => ({
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
  }

  function getGroupScoreRankingRows(groupOptions = [], runtimeGroups = []) {
    return groupOptions
      .filter((group) => group.id != null)
      .map((group) => {
        const source = runtimeGroups.find(
          (item) => Number(item.groupNo) === Number(group.groupNo),
        );
        return {
          id: group.id,
          groupNo: Number(group.groupNo),
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

  function renderGroupScoreRankingHtml(rows = [], helpers = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    if (rows.length === 0) {
      return '<div class="group-score-ranking-empty">暂无小组，请先新增小组</div>';
    }
    return rows
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

  function renderGroupScoreRecordsListHtml(records = [], helpers = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    const formatTime =
      helpers.formatGroupScoreRecordTime || formatGroupScoreRecordTime;
    if (!Array.isArray(records) || records.length === 0) {
      return '<div class="group-score-records-empty">暂无积分记录</div>';
    }
    return records
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
          <div class="group-score-record-meta">${escapeHtml(record.operatorName || "班主任")} · ${formatTime(record.occurredAt || record.createdAt)}</div>
        </div>`;
      })
      .join("");
  }

  function buildGroupOptionsHtml(groups = [], helpers = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    return (
      '<option value="">未分组</option>' +
      groups
        .map(
          (group) =>
            `<option value="${group.groupNo}">${escapeHtml(group.name)}</option>`,
        )
        .join("")
    );
  }

  function renderGroupManageListHtml(groups = [], helpers = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    return groups
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
  }

  function renderGroupManageStudentRowsHtml(
    students = [],
    draft,
    optionsHtml = "",
    helpers = {},
  ) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    if (!draft) return "";
    return students
      .map((student, index) => {
        const key = getStudentDraftKey(student, index);
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
  }

  function buildGroupManagePayload(draft, students = []) {
    if (!draft) return [];
    const groupNos = new Set(
      draft.groups.map((group) => Number(group.groupNo)),
    );
    return draft.groups.map((option) => ({
      id: option.id,
      groupNo: Number(option.groupNo),
      name: option.name || `第${option.groupNo}组`,
      studentIds: students
        .filter((student, index) => {
          const assignedGroupNo = draft.assignments.get(
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

  function normalizeGroupsForDirtyCheck(groups = []) {
    return groups
      .map((group) => ({
        id: group.id == null ? null : Number(group.id),
        groupNo: Number(group.groupNo),
        name: String(group.name || `第${group.groupNo}组`).trim(),
      }))
      .sort((a, b) => a.groupNo - b.groupNo);
  }

  function isGroupManageDraftDirty(draft, groupOptions = [], students = []) {
    if (!draft) return false;

    const currentGroups = normalizeGroupsForDirtyCheck(groupOptions);
    const draftGroups = normalizeGroupsForDirtyCheck(draft.groups);
    if (JSON.stringify(currentGroups) !== JSON.stringify(draftGroups)) {
      return true;
    }

    const currentAssignments = students
      .map((student, index) => [
        getStudentDraftKey(student, index),
        student.group == null ? null : Number(student.group),
      ])
      .sort((left, right) => String(left[0]).localeCompare(String(right[0])));

    const draftAssignments = Array.from(draft.assignments.entries())
      .map(([key, value]) => [String(key), value == null ? null : Number(value)])
      .sort((left, right) => String(left[0]).localeCompare(String(right[0])));

    return (
      JSON.stringify(currentAssignments) !== JSON.stringify(draftAssignments)
    );
  }

  function applyGroupManageDraftToStudents(students = [], draft) {
    if (!draft) return;
    students.forEach((student, index) => {
      const assignedGroupNo = draft.assignments.get(
        getStudentDraftKey(student, index),
      );
      const group = draft.groups.find(
        (item) => Number(item.groupNo) === Number(assignedGroupNo),
      );
      student.group = group ? group.groupNo : null;
      student.groupName = group ? group.name : null;
    });
  }

  global.DisplayGroup = {
    getStudentDraftKey,
    createGroupManageDraft,
    getGroupScoreRankingRows,
    formatGroupScoreRecordTime,
    renderGroupScoreRankingHtml,
    renderGroupScoreRecordsListHtml,
    buildGroupOptionsHtml,
    renderGroupManageListHtml,
    renderGroupManageStudentRowsHtml,
    buildGroupManagePayload,
    isGroupManageDraftDirty,
    applyGroupManageDraftToStudents,
  };
})(window);
