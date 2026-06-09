const { contextBridge, ipcRenderer } = require('electron');

function getArgumentValue(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

const displayApiBaseUrl = getArgumentValue('display-api-base-url');
const displayRealtimeUrl = getArgumentValue('display-realtime-url');
let desktopInlineBubbleVisible = true;
let desktopUpdateToastTimer = null;

if (displayApiBaseUrl) {
  contextBridge.exposeInMainWorld('__DISPLAY_API_BASE_URL__', displayApiBaseUrl);
}
if (displayRealtimeUrl) {
  contextBridge.exposeInMainWorld('__DISPLAY_REALTIME_URL__', displayRealtimeUrl);
}

function invokeDesktopAction(channel, ...args) {
  return ipcRenderer.invoke(channel, ...args);
}

function setDesktopInlineBubbleVisible(visible) {
  desktopInlineBubbleVisible = Boolean(visible);
  const root = document.getElementById('displayDesktopInlineBubble');
  if (!root) {
    return;
  }
  root.classList.toggle('is-hidden', !desktopInlineBubbleVisible);
  if (!desktopInlineBubbleVisible) {
    root.classList.remove('is-expanded');
  }
}

function createDesktopInlineBubble() {
  if (document.getElementById('displayDesktopInlineBubble') || !document.body) {
    return;
  }

  const root = document.createElement('div');
  root.id = 'displayDesktopInlineBubble';
  root.innerHTML = `
    <div class="desktop-inline-actions" aria-label="窗口控制">
      <button class="desktop-inline-action" type="button" data-action="minimize" title="最小化">−</button>
      <button class="desktop-inline-action" type="button" data-action="maximize" title="最大化/还原">□</button>
      <button class="desktop-inline-action" type="button" data-action="fullscreen" title="全屏/窗口">⛶</button>
      <button class="desktop-inline-action" type="button" data-action="lock" title="锁定" aria-label="锁定">
        <svg class="desktop-inline-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8.5 10V8.25a3.5 3.5 0 1 1 7 0V10" />
          <rect x="6.5" y="10" width="11" height="9" rx="2.5" />
          <path d="M12 13.1v2.8" />
        </svg>
      </button>
      <button class="desktop-inline-action" type="button" data-action="logout" title="退出登录" aria-label="退出登录">
        <svg class="desktop-inline-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 7H7.75A2.75 2.75 0 0 0 5 9.75v4.5A2.75 2.75 0 0 0 7.75 17H10" />
          <path d="M13 8l4 4-4 4" />
          <path d="M9 12h8" />
        </svg>
      </button>
      <button class="desktop-inline-action desktop-inline-close" type="button" data-action="quit" title="退出">×</button>
    </div>
    <button class="desktop-inline-ball" type="button" title="窗口操作">
      <img class="desktop-inline-mark" src="images/logo.png" alt="" />
    </button>
  `;

  const setExpanded = (expanded) => {
    root.classList.toggle('is-expanded', expanded);
  };
  const toggleExpanded = () => {
    setExpanded(!root.classList.contains('is-expanded'));
  };
  const runAction = async (action) => {
    setExpanded(false);
    await action();
  };

  root.querySelector('.desktop-inline-ball').addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleExpanded();
  });

  root.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const action = button.getAttribute('data-action');
      if (action === 'minimize') {
        runAction(() => invokeDesktopAction('display-app:minimize'));
      } else if (action === 'maximize') {
        runAction(() => invokeDesktopAction('display-app:toggle-maximize'));
      } else if (action === 'fullscreen') {
        runAction(() => invokeDesktopAction('display-app:toggle-fullscreen'));
      } else if (action === 'lock') {
        runAction(async () => {
          window.dispatchEvent(
            new CustomEvent('display-desktop-command', {
              detail: { action: 'lock' },
            }),
          );
        });
      } else if (action === 'logout') {
        runAction(async () => {
          window.dispatchEvent(
            new CustomEvent('display-desktop-command', {
              detail: { action: 'logout' },
            }),
          );
        });
      } else if (action === 'quit') {
        runAction(() => invokeDesktopAction('display-app:quit'));
      }
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!root.contains(event.target)) {
      setExpanded(false);
    }
  });

  document.body.appendChild(root);
  setDesktopInlineBubbleVisible(desktopInlineBubbleVisible);
}

function createDesktopUpdateToast() {
  if (document.getElementById('displayDesktopUpdateToast') || !document.body) {
    return;
  }

  const toast = document.createElement('div');
  toast.id = 'displayDesktopUpdateToast';
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <div class="desktop-update-toast-title" id="displayDesktopUpdateToastTitle"></div>
    <div class="desktop-update-toast-message" id="displayDesktopUpdateToastMessage"></div>
  `;
  document.body.appendChild(toast);
}

function showDesktopUpdateToast(payload) {
  createDesktopUpdateToast();
  const toast = document.getElementById('displayDesktopUpdateToast');
  const title = document.getElementById('displayDesktopUpdateToastTitle');
  const message = document.getElementById('displayDesktopUpdateToastMessage');
  if (!toast || !title || !message || !payload) {
    return;
  }

  title.textContent = String(payload.title || '应用更新');
  message.textContent = String(payload.message || '');
  toast.dataset.tone = String(payload.tone || 'info');
  toast.classList.add('is-visible');

  if (desktopUpdateToastTimer) {
    clearTimeout(desktopUpdateToastTimer);
    desktopUpdateToastTimer = null;
  }

  if (payload.sticky) {
    return;
  }

  desktopUpdateToastTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
    desktopUpdateToastTimer = null;
  }, 3200);
}

function injectDesktopRuntimeStyles() {
  if (document.getElementById('displayDesktopRuntimeStyles')) {
    createDesktopInlineBubble();
    return;
  }

  const style = document.createElement('style');
  style.id = 'displayDesktopRuntimeStyles';
  style.textContent = `
    #displayFullscreenBtn {
      display: none !important;
    }

    .display-beian {
      display: none !important;
    }

    #displayDesktopInlineBubble {
      position: fixed;
      right: max(18px, env(safe-area-inset-right));
      bottom: max(18px, env(safe-area-inset-bottom));
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
      user-select: none;
    }

    #displayDesktopInlineBubble.is-hidden {
      display: none !important;
    }

    .desktop-inline-ball {
      width: 64px;
      height: 64px;
      border: 0;
      border-radius: 50%;
      padding: 0;
      display: grid;
      place-items: center;
      cursor: pointer;
      pointer-events: auto;
      background:
        radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.96) 0 8px, rgba(255, 255, 255, 0.35) 9px, transparent 18px),
        radial-gradient(circle at 64% 72%, rgba(20, 92, 166, 0.44), transparent 42px),
        linear-gradient(145deg, rgba(255, 255, 255, 0.93), rgba(222, 242, 255, 0.74) 42%, rgba(255, 255, 255, 0.88));
      box-shadow:
        0 6px 16px rgba(8, 31, 62, 0.16),
        0 0 0 1px rgba(255, 255, 255, 0.92),
        inset 0 1px 2px rgba(255, 255, 255, 0.95),
        inset 0 -8px 14px rgba(6, 58, 91, 0.08),
        inset 0 0 0 1px rgba(255, 255, 255, 0.68);
      outline: none;
      position: relative;
    }

    .desktop-inline-ball:hover {
      transform: translateY(-1px);
    }

    .desktop-inline-ball:active {
      transform: translateY(1px) scale(0.98);
    }

    .desktop-inline-ball::after {
      content: "";
      position: absolute;
      inset: 5px 9px auto 12px;
      height: 22px;
      border-radius: 50%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0));
      pointer-events: none;
    }

    .desktop-inline-mark {
      width: 44px;
      height: 44px;
      display: block;
      object-fit: contain;
      filter: drop-shadow(0 2px 3px rgba(6, 58, 91, 0.25));
      position: relative;
      z-index: 1;
    }

    .desktop-inline-actions {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: 0;
      opacity: 0;
      overflow: hidden;
      transform: translateX(12px) scale(0.92);
      pointer-events: none;
      transition: width 180ms ease, opacity 180ms ease, transform 180ms ease;
    }

    #displayDesktopInlineBubble.is-expanded .desktop-inline-actions {
      width: 258px;
      opacity: 1;
      transform: translateX(0) scale(1);
      pointer-events: auto;
    }

    .desktop-inline-action {
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 50%;
      display: inline-grid;
      place-items: center;
      color: #fff;
      background: rgba(8, 22, 45, 0.64);
      box-shadow: 0 8px 18px rgba(8, 31, 62, 0.22);
      font: 700 18px/1 "Microsoft YaHei", Arial, sans-serif;
      cursor: pointer;
      padding: 0;
      pointer-events: auto;
    }

    .desktop-inline-icon {
      width: 17px;
      height: 17px;
      stroke: currentColor;
      stroke-width: 1.9;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      display: block;
    }

    .desktop-inline-action:hover {
      background: rgba(20, 92, 166, 0.84);
    }

    .desktop-inline-close:hover {
      background: rgba(207, 31, 46, 0.94);
    }

    #displayDesktopUpdateToast {
      position: fixed;
      top: max(18px, env(safe-area-inset-top));
      right: max(18px, env(safe-area-inset-right));
      z-index: 2147483647;
      min-width: 220px;
      max-width: min(360px, calc(100vw - 36px));
      padding: 12px 14px;
      border-radius: 12px;
      color: #fff;
      background: rgba(8, 22, 45, 0.84);
      box-shadow: 0 14px 30px rgba(8, 31, 62, 0.26);
      backdrop-filter: blur(8px);
      pointer-events: none;
      opacity: 0;
      transform: translateY(-8px);
      transition: opacity 180ms ease, transform 180ms ease;
    }

    #displayDesktopUpdateToast.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    #displayDesktopUpdateToast[data-tone="success"] {
      background: rgba(16, 107, 66, 0.88);
    }

    .desktop-update-toast-title {
      font: 700 14px/1.3 "Microsoft YaHei", Arial, sans-serif;
    }

    .desktop-update-toast-message {
      margin-top: 4px;
      font: 500 12px/1.4 "Microsoft YaHei", Arial, sans-serif;
      color: rgba(255, 255, 255, 0.84);
    }
  `;
  document.head.appendChild(style);
  createDesktopInlineBubble();
  createDesktopUpdateToast();
}

window.addEventListener('DOMContentLoaded', injectDesktopRuntimeStyles);

ipcRenderer.on('display-app:inline-bubble-visible', (_event, visible) => {
  setDesktopInlineBubbleVisible(visible);
});

ipcRenderer.on('display-app:auto-update-status', (_event, payload) => {
  showDesktopUpdateToast(payload);
});

contextBridge.exposeInMainWorld('displayDesktop', {
  isDesktop: true,
  apiBaseUrl: displayApiBaseUrl,
  realtimeUrl: displayRealtimeUrl,
  setFloatingBallStatus(payload) {
    return invokeDesktopAction('display-app:set-floating-ball-status', payload);
  },
  minimizeWindow() {
    return invokeDesktopAction('display-app:minimize');
  },
  toggleMaximizeWindow() {
    return invokeDesktopAction('display-app:toggle-maximize');
  },
  toggleFullscreenWindow() {
    return invokeDesktopAction('display-app:toggle-fullscreen');
  },
  quitApp() {
    return invokeDesktopAction('display-app:quit');
  },
});
