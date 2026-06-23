(function initDisplayCall(global) {
  function formatCallTitle(callerName) {
    const name = String(callerName || "").trim();
    if (!name) return "老师正在叫号";
    return `${name.charAt(0)}老师正在叫号`;
  }

  function renderCalledStudentTags(container, calledStudents = []) {
    if (!container) return;
    container.innerHTML = "";
    calledStudents.forEach((student) => {
      const tag = document.createElement("div");
      tag.className = "co-student-tag";
      tag.textContent = student.name || "";
      container.appendChild(tag);
    });
  }

  function createCallOverlayActionState(activeCallId, terminalCode) {
    if (!activeCallId) {
      return {
        disabled: true,
        label: "等待老师叫号",
      };
    }
    if (terminalCode) {
      return {
        disabled: false,
        label: "我已收到，确认前往",
      };
    }
    return {
      disabled: true,
      label: "终端未就绪",
    };
  }

  global.DisplayCall = {
    formatCallTitle,
    renderCalledStudentTags,
    createCallOverlayActionState,
  };
})(window);
