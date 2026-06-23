(function initDisplaySettings(global) {
  function toggleSettingsMenu(event, menuId = "settingsMenu") {
    event?.stopPropagation?.();
    const menu = document.getElementById(menuId);
    if (!menu) return false;
    menu.classList.toggle("active");
    return menu.classList.contains("active");
  }

  function syncToggle(inputId, enabled) {
    const input = document.getElementById(inputId);
    if (input) input.checked = Boolean(enabled);
  }

  function initNoNativeTooltips(root = document) {
    root.querySelectorAll("[title]").forEach((el) => {
      el.dataset.nativeTitle = el.getAttribute("title") || "";
      el.removeAttribute("title");
    });
  }

  function applyLowSpecBodyState(enabled) {
    document.body.classList.toggle("low-spec", Boolean(enabled));
  }

  global.DisplaySettings = {
    toggleSettingsMenu,
    syncToggle,
    initNoNativeTooltips,
    applyLowSpecBodyState,
  };
})(window);
