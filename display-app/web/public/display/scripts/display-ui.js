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

  function renderLockMeta(lines = []) {
    const meta = document.getElementById("displayLockMeta");
    if (!meta) return;
    meta.replaceChildren();
    lines.forEach((line, index) => {
      if (index > 0) {
        meta.appendChild(document.createElement("br"));
      }
      meta.appendChild(document.createTextNode(String(line || "")));
    });
  }

  function renderLockOverlay(viewModel = {}) {
    const overlay = document.getElementById("displayLockOverlay");
    const badge = document.getElementById("displayLockBadgeText");
    const title = document.getElementById("displayLockTitle");
    const desc = document.getElementById("displayLockDesc");
    const primaryBtn = document.getElementById("displayLockPrimaryBtn");
    const secondaryBtn = document.getElementById("displayLockSecondaryBtn");
    const opBar = document.getElementById("displayOpBar");
    const opTitle = document.getElementById("displayOpTitle");
    const opSubtitle = document.getElementById("displayOpSubtitle");
    const opPrimaryBtn = document.getElementById("displayOpPrimaryBtn");
    const opSecondaryBtn = document.getElementById("displayOpSecondaryBtn");
    const topActionBtn = document.getElementById("displayTopActionBtn");
    const topActionIcon = document.getElementById("displayTopActionIcon");
    if (!overlay || !badge || !title || !desc || !primaryBtn || !secondaryBtn) {
      return false;
    }

    overlay.classList.toggle("active", Boolean(viewModel.shouldShow));
    opBar?.classList.add("hidden");
    badge.textContent = viewModel.badge || "";
    title.textContent = viewModel.title || "";
    desc.textContent = viewModel.description || "";
    primaryBtn.textContent = viewModel.primaryText || "";
    secondaryBtn.textContent = viewModel.secondaryText || "";
    if (opTitle) opTitle.textContent = viewModel.opTitle || "";
    if (opSubtitle) opSubtitle.textContent = viewModel.opSubtitle || "";
    if (opPrimaryBtn) opPrimaryBtn.textContent = viewModel.opPrimaryText || "";
    if (opSecondaryBtn) {
      opSecondaryBtn.textContent = viewModel.opSecondaryText || "";
    }
    if (topActionBtn) {
      topActionBtn.classList.toggle(
        "unlocked",
        Boolean(viewModel.topActionUnlocked),
      );
    }
    if (topActionIcon && viewModel.topActionIcon) {
      topActionIcon.className = viewModel.topActionIcon;
    }
    renderLockMeta(viewModel.metaLines || []);
    return true;
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
      if (!isOverlayBackdropClick(overlay, event)) return;
      closeConfirmModal(alertOnly ? true : false);
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

  function isOverlayVisible(overlay) {
    if (!overlay) return false;
    if (overlay.hidden) return false;
    if (overlay.classList.contains("active")) return true;
    const style = global.getComputedStyle(overlay);
    if (style.display === "none") return false;
    if (style.visibility === "hidden") return false;
    if (Number(style.opacity || "1") <= 0) return false;
    return style.display === "flex" || style.display === "block";
  }

  const MODAL_PANEL_SELECTOR =
    ".point-modal, .modal-panel, .ex-modal-content, .confirm-modal, .toolbox-settings-panel, .toolbox-result-panel, .academic-ai-modal, .pet-deco-panel, .pet-profile-modal, .pet-fullview-stage, .pet-fullview-back-btn, .pm-all-history-modal";

  function isOverlayBackdropClick(overlay, event) {
    if (!overlay || !event?.target) return false;
    if (event.target === overlay) return true;
    if (!overlay.contains(event.target)) return false;
    const panel = overlay.querySelector(MODAL_PANEL_SELECTOR);
    if (!panel) return false;
    return !panel.contains(event.target);
  }

  /** 点击遮罩层关闭弹窗（仅点击面板外区域时触发） */
  function bindOverlayBackdropDismiss(registrations = []) {
    registrations.forEach(({ id, onClose, isVisible }) => {
      const overlay = document.getElementById(id);
      if (!overlay || overlay.dataset.backdropDismissBound === "1") return;
      overlay.dataset.backdropDismissBound = "1";

      let lastDismissAt = 0;
      const tryDismiss = (event) => {
        if (!isOverlayBackdropClick(overlay, event)) return;
        const visible =
          typeof isVisible === "function"
            ? isVisible(overlay)
            : isOverlayVisible(overlay);
        if (!visible) return;
        const now = Date.now();
        if (now - lastDismissAt < 320) return;
        lastDismissAt = now;
        event.preventDefault();
        event.stopPropagation();
        onClose(event);
      };

      overlay.addEventListener("pointerup", tryDismiss);
      overlay.addEventListener("click", tryDismiss);
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
    renderLockMeta,
    renderLockOverlay,
    closeConfirmModal,
    showConfirmModal,
    showDisplayAlert,
    bindOverlayBackdropDismiss,
    showToast,
  };
})(window);
