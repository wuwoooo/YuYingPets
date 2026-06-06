(function initDisplayUi(global) {
  const DISPLAY_PAGE_MAP = {
    entry: "page-entry",
    setup: "page-setup",
    login: "page-login",
    transition: "page-transition",
    classroom: "page-classroom",
    academic: "page-academic",
    toolbox: "page-toolbox",
    leaderboard: "page-leaderboard",
    exchange: "page-exchange",
  };
  let displayToastTimer = null;
  let confirmModalResolver = null;
  let confirmModalSessionId = 0;
  let beginInputGuard = null;

  function configure(options = {}) {
    if (typeof options.beginInputGuard === "function") {
      beginInputGuard = options.beginInputGuard;
    }
  }

  function activatePage(key) {
    document
      .querySelectorAll(".page")
      .forEach((page) => page.classList.remove("active"));
    const target = document.getElementById(DISPLAY_PAGE_MAP[key]);
    if (target) {
      target.classList.add("active");
    }
    document.querySelectorAll(".bottom-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.target === key);
    });
    return target || null;
  }

  function showDisplayToast(message, options = {}) {
    const toast = document.getElementById("displayToast");
    if (!toast) return;
    const text = String(message || "").trim();
    if (!text) return;
    global.clearTimeout(displayToastTimer);
    toast.textContent = text;
    toast.hidden = false;
    global.requestAnimationFrame(() => toast.classList.add("active"));
    displayToastTimer = global.setTimeout(() => {
      toast.classList.remove("active");
      global.setTimeout(() => {
        if (!toast.classList.contains("active")) {
          toast.hidden = true;
        }
      }, 240);
    }, options.duration || 2800);
  }

  function setRealtimeStatus(mode, message, options = {}) {
    const bar = document.getElementById("displayRealtimeStatus");
    const text = document.getElementById("displayRealtimeStatusText");
    const icon = document.getElementById("displayRealtimeStatusIcon");
    if (!bar || !text) return;

    const effectiveMode =
      mode !== "hidden" && options.suppress ? "hidden" : mode;
    if (effectiveMode === "hidden") {
      bar.hidden = true;
      bar.classList.remove(
        "active",
        "connecting",
        "reconnecting",
        "disconnected",
      );
      return;
    }

    bar.hidden = false;
    bar.classList.add("active");
    bar.classList.toggle("connecting", effectiveMode === "connecting");
    bar.classList.toggle("reconnecting", effectiveMode === "reconnecting");
    bar.classList.toggle("disconnected", effectiveMode === "disconnected");
    text.textContent = message || "实时连接异常";
    if (icon) {
      icon.className =
        effectiveMode === "reconnecting"
          ? "fa-solid fa-arrows-rotate"
          : effectiveMode === "disconnected"
            ? "fa-solid fa-triangle-exclamation"
            : "fa-solid fa-wifi";
    }
  }

  function closeConfirmModal(confirmed = false) {
    const overlay = document.getElementById("confirmModal");
    overlay?.classList.remove("active");
    beginInputGuard?.();
    if (confirmModalResolver) {
      const resolver = confirmModalResolver;
      confirmModalResolver = null;
      resolver(confirmed);
    }
  }

  function bindConfirmModalButton(button, action) {
    if (!button) return;
    button.__displayConfirmAction = action;
    if (button.__displayConfirmBound) return;
    button.__displayConfirmBound = true;

    const activate = (event) => {
      if (button.disabled || button.__displayConfirmActivating) return;
      event.preventDefault();
      event.stopPropagation();
      button.__displayConfirmActivating = true;
      global.setTimeout(() => {
        button.__displayConfirmActivating = false;
      }, 450);
      button.__displayConfirmAction?.(event);
    };

    button.addEventListener("click", activate);
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
    const alertOnly = options.alertOnly === true;
    cancelBtn.textContent = options.cancelText || "取消";
    confirmBtn.textContent =
      options.confirmText || (alertOnly ? "我知道了" : "确认");
    cancelBtn.hidden = alertOnly;

    bindConfirmModalButton(cancelBtn, () => closeConfirmModal(false));
    bindConfirmModalButton(confirmBtn, () => closeConfirmModal(true));
    overlay.onclick = (event) => {
      if (event.target === overlay) {
        closeConfirmModal(alertOnly ? true : false);
      }
    };

    const sessionId = ++confirmModalSessionId;
    overlay.dataset.confirmSession = String(sessionId);
    overlay.classList.add("active");

    return new Promise((resolve) => {
      confirmModalResolver = (confirmed) => {
        if (Number(overlay.dataset.confirmSession || 0) !== sessionId) return;
        resolve(confirmed);
      };
    });
  }

  function showDisplayAlert(options = {}) {
    return showConfirmModal({
      tone: "warn",
      badge: "温馨提示",
      icon: "fa-circle-info",
      confirmText: "我知道了",
      alertOnly: true,
      ...options,
    });
  }

  function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.style.cssText =
        "position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    const colors = {
      success: "#1e8e5a",
      warn: "#d4a017",
      error: "#d64343",
      info: "#2980b9",
    };
    toast.style.cssText = `padding:12px 28px;border-radius:12px;background:${colors[type] || colors.info};color:#fff;font-size:15px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.18);opacity:0;transition:opacity 0.3s;pointer-events:auto;`;
    toast.textContent = message;
    container.appendChild(toast);
    global.requestAnimationFrame(() => {
      toast.style.opacity = "1";
    });
    global.setTimeout(() => {
      toast.style.opacity = "0";
      global.setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  global.DisplayUI = {
    configure,
    activatePage,
    showDisplayToast,
    setRealtimeStatus,
    closeConfirmModal,
    showConfirmModal,
    showDisplayAlert,
    showToast,
  };
})(window);
