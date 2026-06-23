(function initDisplayEntryEffects(global) {
  const ENTRY_STARFIELD_LAYERS_HTML =
    '<span class="star-layer star-layer-far"></span>' +
    '<span class="star-layer star-layer-mid"></span>' +
    '<span class="star-layer star-layer-near"></span>';

  const ENTRY_SHOOTING_STARS_HTML =
    '<span class="shooting-star meteor-1"></span>' +
    '<span class="shooting-star meteor-2"></span>' +
    '<span class="shooting-star meteor-3"></span>';

  function ensureEntryStarfield(pageEl, helpers = {}) {
    const isLowSpecMode = helpers.isLowSpecMode || (() => false);
    if (!pageEl) return;
    const starfield = pageEl.querySelector(".entry-starfield");
    if (!starfield) return;

    if (!starfield.querySelector(".star-layer-far")) {
      starfield.innerHTML = ENTRY_STARFIELD_LAYERS_HTML;
    }
    starfield.classList.remove("entry-starfield-suspended");

    if (isLowSpecMode()) {
      starfield
        .querySelectorAll(".shooting-star")
        .forEach((star) => star.remove());
      return;
    }

    if (!starfield.querySelector(".shooting-star")) {
      starfield.insertAdjacentHTML("beforeend", ENTRY_SHOOTING_STARS_HTML);
    }
    restartEntryShootingStars(pageEl, helpers);
  }

  function restartEntryShootingStars(pageEl, helpers = {}) {
    const isLowSpecMode = helpers.isLowSpecMode || (() => false);
    if (!pageEl || isLowSpecMode()) return;
    const starfield = pageEl.querySelector(".entry-starfield");
    if (!starfield) return;
    starfield.querySelectorAll(".shooting-star").forEach((star) => {
      star.replaceWith(star.cloneNode(true));
    });
  }

  function unloadEntryAnimations() {
    document.querySelectorAll(".entry-starfield").forEach((el) => {
      el.classList.add("entry-starfield-suspended");
      el.querySelectorAll(".shooting-star").forEach((star) => star.remove());
    });
  }

  function spawnCssParticles(cx, cy, petH) {
    const container = document.getElementById("petUpgradeOverlay");
    if (!container) return;
    const count = 8;
    const baseHue = petH !== null ? petH : 42;

    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "css-particle";
      const hue = baseHue + (Math.random() - 0.5) * 18;
      const lightness = 58 + Math.random() * 14;
      el.style.backgroundColor = `hsl(${hue}, 88%, ${lightness}%)`;
      el.style.boxShadow = `0 0 8px hsla(${hue}, 88%, ${lightness + 10}%, 0.75)`;
      const size = 7 + Math.random() * 7;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = "0px";
      el.style.top = "0px";
      el.style.setProperty("--x", `${cx}px`);
      el.style.setProperty("--y", `${cy}px`);

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
      const distance = 90 + Math.random() * 110;
      el.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      el.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);

      container.appendChild(el);
      global.setTimeout(() => el.remove(), 900);
    }
  }

  global.DisplayEntryEffects = {
    ensureEntryStarfield,
    restartEntryShootingStars,
    unloadEntryAnimations,
    spawnCssParticles,
  };
})(window);
