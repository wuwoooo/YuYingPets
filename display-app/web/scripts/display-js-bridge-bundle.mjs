import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DISPLAY_BRIDGE_SCRIPT_ORDER = [
  'pet-colors.js',
  'display-runtime.js',
  'display-ui.js',
  'display-auth.js',
  'display-holiday-dates.js',
  'display-score.js',
  'display-realtime.js',
  'display-pet-catalog.js',
  'display-exchange.js',
  'display-leaderboard.js',
  'display-honor.js',
  'display-student-grid.js',
  'display-pet-profile.js',
  'display-deco.js',
  'display-academic.js',
  'display-audio.js',
  'display-call.js',
  'display-entry-effects.js',
  'display-group.js',
  'display-toolbox.js',
  'display-settings.js',
];

const DISPLAY_BRIDGE_SCRIPT_SRCS = new Set(
  DISPLAY_BRIDGE_SCRIPT_ORDER.map((file) => `./scripts/${file}`),
);

function stripQuery(value) {
  return String(value || '').split(/[?#]/)[0];
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractScriptSrcs(html) {
  const srcs = [];
  const scriptPattern = /<script\b(?=[^>]*\bsrc=["']([^"']+)["'])[^>]*><\/script>/g;
  for (const match of html.matchAll(scriptPattern)) {
    srcs.push(stripQuery(match[1]));
  }
  return srcs;
}

export function assertDisplayBridgeScriptOrder(html) {
  const srcs = extractScriptSrcs(html);
  const actual = srcs
    .filter((src) => DISPLAY_BRIDGE_SCRIPT_SRCS.has(src))
    .map((src) => src.replace('./scripts/', ''));
  const missing = DISPLAY_BRIDGE_SCRIPT_ORDER.filter(
    (file) => !actual.includes(file),
  );
  const extra = actual.filter((file) => !DISPLAY_BRIDGE_SCRIPT_ORDER.includes(file));
  const sameLength = actual.length === DISPLAY_BRIDGE_SCRIPT_ORDER.length;
  const sameOrder =
    sameLength &&
    DISPLAY_BRIDGE_SCRIPT_ORDER.every((file, index) => actual[index] === file);
  const mainScriptIndex = srcs.indexOf('./scripts/display-app.js');
  const lastBridgeIndex = Math.max(
    ...DISPLAY_BRIDGE_SCRIPT_ORDER.map((file) =>
      srcs.indexOf(`./scripts/${file}`),
    ),
  );
  const mainAfterBridge = mainScriptIndex > lastBridgeIndex;
  if (missing.length || extra.length || !sameOrder || !mainAfterBridge) {
    throw new Error(
      [
        'Display bridge/helper 脚本顺序与 Vite bundle 配置不一致。',
        missing.length ? `缺少：${missing.join(', ')}` : '',
        extra.length ? `多余：${extra.join(', ')}` : '',
        !sameOrder ? `当前顺序：${actual.join(' -> ')}` : '',
        !mainAfterBridge ? 'display-app.js 必须在 bridge/helper 之后加载。' : '',
        `期望顺序：${DISPLAY_BRIDGE_SCRIPT_ORDER.join(' -> ')}`,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }
}

function removeDisplayBridgeScripts(html) {
  return html.replace(
    /\s*<script\b(?=[^>]*\bsrc=["']([^"']+)["'])[^>]*><\/script>\s*/g,
    (full, src) => {
      const normalizedSrc = stripQuery(src);
      return DISPLAY_BRIDGE_SCRIPT_SRCS.has(normalizedSrc) ? '\n' : full;
    },
  );
}

function injectDisplayBridgeBundle(html, bundleSrc) {
  const bundleTag = `    <script src="${bundleSrc}" charset="UTF-8"></script>\n`;
  const nextHtml = html.replace(
    /(\s*<script src="\.\/scripts\/display-app\.js(?:\?v=[^"]*)?"><\/script>\n)/,
    `\n${bundleTag}$1`,
  );
  if (!nextHtml.includes(bundleTag.trim())) {
    throw new Error('Display bridge/helper bundle 注入失败');
  }
  return nextHtml.replace(/\n{3,}/g, '\n\n');
}

export function bundleDisplayBridgeScripts({
  root = process.cwd(),
  outDir = path.join(root, 'dist'),
} = {}) {
  const sourceDisplayRoot = path.join(root, 'public/display');
  const sourceScriptsDir = path.join(sourceDisplayRoot, 'scripts');
  const distDisplayRoot = path.join(outDir, 'display');
  const distScriptsDir = path.join(distDisplayRoot, 'scripts');
  const distHtmlPath = path.join(distDisplayRoot, 'display.html');
  if (!fs.existsSync(distHtmlPath)) {
    throw new Error(
      `Display bridge/helper bundle 找不到构建后的 display.html：${distHtmlPath}`,
    );
  }

  const sourceHtml = readText(path.join(sourceDisplayRoot, 'display.html'));
  assertDisplayBridgeScriptOrder(sourceHtml);

  const sections = DISPLAY_BRIDGE_SCRIPT_ORDER.map((file) => {
    const scriptPath = path.join(sourceScriptsDir, file);
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Display bridge/helper bundle 缺少源文件：${scriptPath}`);
    }
    return `/* ===== ${file} ===== */\n${readText(scriptPath).trim()}\n`;
  });
  const bundleJs = `\uFEFF${sections.join('\n;\n')}\n`;
  const hash = crypto
    .createHash('sha256')
    .update(bundleJs)
    .digest('hex')
    .slice(0, 12);
  const bundleFile = `display-bridge-bundle.${hash}.js`;
  const bundleSrc = `./scripts/${bundleFile}`;
  fs.mkdirSync(distScriptsDir, { recursive: true });
  for (const file of fs.readdirSync(distScriptsDir)) {
    if (/^display-bridge-bundle\.[a-f0-9]{12}\.js$/.test(file)) {
      fs.rmSync(path.join(distScriptsDir, file));
    }
  }
  fs.writeFileSync(path.join(distScriptsDir, bundleFile), bundleJs);

  const distHtml = readText(distHtmlPath);
  const rewrittenHtml = injectDisplayBridgeBundle(
    removeDisplayBridgeScripts(distHtml),
    bundleSrc,
  );
  fs.writeFileSync(distHtmlPath, rewrittenHtml);
  return {
    file: bundleFile,
    src: bundleSrc,
    scriptCount: DISPLAY_BRIDGE_SCRIPT_ORDER.length,
    bytes: Buffer.byteLength(bundleJs),
  };
}
