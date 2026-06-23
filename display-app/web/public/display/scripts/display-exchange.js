(function initDisplayExchange(global) {
  function createInitialState() {
    return {
      currentExchangeRewardId: null,
      currentExchangeItem: null,
      currentExchangeCost: 0,
      exchangeConfirmInFlight: false,
    };
  }

  function beginExchange(state = {}, rewardId, itemName, cost) {
    if (state.exchangeConfirmInFlight) return state;
    return {
      ...state,
      currentExchangeRewardId: rewardId,
      currentExchangeItem: itemName,
      currentExchangeCost: parseInt(cost, 10) || 0,
    };
  }

  function findEligibleStudent(students = [], studentName, cost = 0) {
    const student = students.find((item) => item.name === studentName);
    if (!student || Number(student.pts || 0) < Number(cost || 0)) return null;
    return student;
  }

  function renderStudentOptions(students = [], cost = 0, helpers = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    const petImg = helpers.petImg || (() => "images/logo.svg");
    return students
      .map((student) => {
        const hasEnough = Number(student.pts || 0) >= Number(cost || 0);
        const quotedName = String(student.name || "").replace(/'/g, "\\'");
        return `
      <div class="student-select-item ${hasEnough ? "" : "disabled"}" onclick="confirmExchange('${quotedName}')">
        <img src="${petImg(student)}" class="student-select-avatar" alt="">
        <div class="student-select-name">${escapeHtml(student.name)}</div>
        <div class="student-select-pts ${hasEnough ? "" : "insufficient"}">现有: ${student.pts}</div>
      </div>
    `;
      })
      .join("");
  }

  function createConfirmCopy(studentName, itemName, cost) {
    return {
      tone: "warn",
      badge: "兑换确认",
      icon: "fa-gift",
      title: "确认兑换该礼品吗？",
      description: `${studentName} 将兑换「${itemName}」。\n本次将扣除 ${cost} 积分。`,
      confirmText: "确认兑换",
    };
  }

  function createRewardOrderPayload(context = {}) {
    return {
      classId: context.classId,
      studentId: context.studentId,
      rewardId: context.rewardId,
      sourceTerminal: "display",
    };
  }

  function applyLocalPointDeduction(student, cost) {
    if (!student) return student;
    student.pts = Math.max(0, Number(student.pts || 0) - Number(cost || 0));
    return student;
  }

  function renderSuccessMessage(itemName, studentName, cost) {
    if (studentName) {
      return `成功扣除 <span style="font-weight:700;">${studentName}</span> 的 ${cost} 积分。<br>兑换了：<span style="font-weight:700;color:var(--brand-red);">${itemName}</span>，快去找老师领取实物吧！`;
    }
    return `此操作仅在展示端模拟反馈体验。<br>（您选择了：<span style="font-weight:700;color:var(--brand-red);">${itemName}</span>）`;
  }

  global.DisplayExchange = {
    createInitialState,
    beginExchange,
    findEligibleStudent,
    renderStudentOptions,
    createConfirmCopy,
    createRewardOrderPayload,
    applyLocalPointDeduction,
    renderSuccessMessage,
  };
})(window);
