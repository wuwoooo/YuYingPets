type ProbeElementSummary = {
  selector: string;
  tag: string;
  id: string;
  className: string;
  text: string;
  position: string;
  zIndex: string;
  pointerEvents: string;
  opacity: string;
  visibility: string;
  display: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type MaskProbeSnapshot = {
  ts: string;
  reason: string;
  url: string;
  title: string;
  hasFocus: boolean;
  fullscreen: boolean;
  activeElement: string | null;
  body: {
    className: string;
    style: string;
    pointerEvents: string;
    overflow: string;
  };
  html: {
    className: string;
    style: string;
    pointerEvents: string;
    overflow: string;
  };
  centerStack: ProbeElementSummary[];
  viewportBlockers: ProbeElementSummary[];
  activeLayers: ProbeElementSummary[];
  storageKeys: {
    localStorage: string[];
    sessionStorage: string[];
  };
};

declare global {
  interface Window {
    __yypMaskProbeLogs?: MaskProbeSnapshot[];
    __yypMaskProbe?: (reason?: string) => MaskProbeSnapshot | null;
  }
}

function isProbeEnabled() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return import.meta.env.DEV || host === 'localhost' || host === '127.0.0.1';
}

function cssPath(element: Element | null) {
  if (!element) return '';
  if (element.id) return `#${CSS.escape(element.id)}`;

  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== document.body) {
    let part = current.tagName.toLowerCase();
    const classNames = Array.from(current.classList).slice(0, 3);
    if (classNames.length) {
      part += `.${classNames.map((item) => CSS.escape(item)).join('.')}`;
    }
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((item) => item.tagName === current?.tagName);
      if (siblings.length > 1) {
        part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
    }
    parts.unshift(part);
    current = current.parentElement;
  }
  return `body > ${parts.join(' > ')}`;
}

function summarizeElement(element: Element): ProbeElementSummary {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    selector: cssPath(element),
    tag: element.tagName.toLowerCase(),
    id: element.id || '',
    className: element.className.toString().slice(0, 180),
    text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
    position: style.position,
    zIndex: style.zIndex,
    pointerEvents: style.pointerEvents,
    opacity: style.opacity,
    visibility: style.visibility,
    display: style.display,
    rect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
  };
}

function isViewportBlocker(element: Element) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    ['fixed', 'absolute', 'sticky'].includes(style.position) &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.pointerEvents !== 'none' &&
    rect.width >= window.innerWidth * 0.9 &&
    rect.height >= window.innerHeight * 0.9
  );
}

function isActiveLayer(element: Element) {
  const className = element.className.toString();
  return (
    element.getAttribute('aria-modal') === 'true' ||
    element.getAttribute('role') === 'dialog' ||
    className.includes('active') ||
    /modal|mask|overlay|popover|drawer|backdrop|loading/i.test(className)
  );
}

function storageKeys(storage: Storage) {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key) keys.push(key);
  }
  return keys.sort();
}

export function captureMaskProbe(reason = 'manual'): MaskProbeSnapshot | null {
  if (!isProbeEnabled()) return null;

  const bodyStyle = window.getComputedStyle(document.body);
  const htmlStyle = window.getComputedStyle(document.documentElement);
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const centerStack = document.elementsFromPoint(centerX, centerY).map(summarizeElement);
  const allElements = Array.from(document.querySelectorAll('body *'));
  const viewportBlockers = allElements
    .filter(isViewportBlocker)
    .map(summarizeElement)
    .sort((a, b) => (Number.parseInt(b.zIndex, 10) || 0) - (Number.parseInt(a.zIndex, 10) || 0));
  const activeLayers = allElements.filter(isActiveLayer).map(summarizeElement);

  const snapshot: MaskProbeSnapshot = {
    ts: new Date().toISOString(),
    reason,
    url: window.location.href,
    title: document.title,
    hasFocus: document.hasFocus(),
    fullscreen: Boolean(document.fullscreenElement),
    activeElement: document.activeElement ? document.activeElement.outerHTML.slice(0, 400) : null,
    body: {
      className: document.body.className,
      style: document.body.getAttribute('style') || '',
      pointerEvents: bodyStyle.pointerEvents,
      overflow: bodyStyle.overflow,
    },
    html: {
      className: document.documentElement.className,
      style: document.documentElement.getAttribute('style') || '',
      pointerEvents: htmlStyle.pointerEvents,
      overflow: htmlStyle.overflow,
    },
    centerStack,
    viewportBlockers,
    activeLayers,
    storageKeys: {
      localStorage: storageKeys(window.localStorage),
      sessionStorage: storageKeys(window.sessionStorage),
    },
  };

  const logs = (window.__yypMaskProbeLogs ??= []);
  logs.push(snapshot);
  if (logs.length > 40) logs.splice(0, logs.length - 40);

  window.__yypMaskProbe = captureMaskProbe;
  const level = viewportBlockers.length > 0 ? 'warn' : 'info';
  console[level]('[yyp-mask-probe]', reason, snapshot);
  return snapshot;
}

export function scheduleMaskProbe(reason: string, delay = 1200) {
  if (!isProbeEnabled()) return;
  window.__yypMaskProbe = captureMaskProbe;
  window.setTimeout(() => captureMaskProbe(reason), delay);
}
