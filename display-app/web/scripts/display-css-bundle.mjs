import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DISPLAY_CSS_ORDER = [
  'display.css',
  'display-classroom-base.css',
  'display-holiday.css',
  'display-classroom-shell.css',
  'display-student-card.css',
  'display-modal-core.css',
  'display-sidebar.css',
  'display-classroom-effects.css',
  'display-performance.css',
  'display-entry-transition.css',
  'display-honor.css',
  'display-point-modal.css',
  'display-pet-profile.css',
  'display-pet-pk.css',
  'display-group.css',
  'display-adopt.css',
  'display-academic.css',
  'display-exchange.css',
  'display-leaderboard.css',
  'display-classroom-settings.css',
  'display-setup-login.css',
  'display-toolbox.css',
  'display-pet-fullview.css',
];

const DISPLAY_CSS_HREFS = new Set(
  DISPLAY_CSS_ORDER.map((file) => `./styles/${file}`),
);

function stripQuery(value) {
  return String(value || '').split(/[?#]/)[0];
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractDisplayStylesheetHrefs(html) {
  const hrefs = [];
  const linkPattern = /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/g;
  for (const match of html.matchAll(linkPattern)) {
    const href = stripQuery(match[1]);
    if (DISPLAY_CSS_HREFS.has(href)) hrefs.push(href);
  }
  return hrefs;
}

export function assertDisplayCssOrder(html) {
  const actual = extractDisplayStylesheetHrefs(html).map((href) =>
    href.replace('./styles/', ''),
  );
  const expected = DISPLAY_CSS_ORDER;
  const missing = expected.filter((file) => !actual.includes(file));
  const extra = actual.filter((file) => !expected.includes(file));
  const sameLength = actual.length === expected.length;
  const sameOrder =
    sameLength && expected.every((file, index) => actual[index] === file);
  if (missing.length || extra.length || !sameOrder) {
    throw new Error(
      [
        'Display CSS 加载顺序与 Vite bundle 配置不一致。',
        missing.length ? `缺少：${missing.join(', ')}` : '',
        extra.length ? `多余：${extra.join(', ')}` : '',
        !sameOrder ? `当前顺序：${actual.join(' -> ')}` : '',
        `期望顺序：${expected.join(' -> ')}`,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }
}

function removeDisplayCssLinks(html) {
  return html.replace(
    /\s*<link\b(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>\s*/g,
    (full, href) => {
      const normalizedHref = stripQuery(href);
      return DISPLAY_CSS_HREFS.has(normalizedHref) ? '\n' : full;
    },
  );
}

function injectDisplayCssBundle(html, bundleHref) {
  const preloadTag = `    <link rel="preload" href="${bundleHref}" as="style" />\n`;
  const stylesheetTag = `    <link rel="stylesheet" href="${bundleHref}" />\n`;
  let nextHtml = html;
  nextHtml = nextHtml.replace(
    /(<link rel="stylesheet" href="\.\/vendor\/fontawesome\/css\/all\.min\.css" \/>\n)/,
    `$1${preloadTag}`,
  );
  nextHtml = nextHtml.replace(
    /(<script src="\.\/vendor\/morphdom\/morphdom-umd\.min\.js"><\/script>\n)/,
    `$1${stylesheetTag}`,
  );
  if (!nextHtml.includes(preloadTag.trim())) {
    throw new Error('Display CSS bundle preload 注入失败');
  }
  if (!nextHtml.includes(stylesheetTag.trim())) {
    throw new Error('Display CSS bundle stylesheet 注入失败');
  }
  return nextHtml.replace(/\n{3,}/g, '\n\n');
}

export function bundleDisplayCss({
  root = process.cwd(),
  outDir = path.join(root, 'dist'),
} = {}) {
  const sourceDisplayRoot = path.join(root, 'public/display');
  const sourceStylesDir = path.join(sourceDisplayRoot, 'styles');
  const distDisplayRoot = path.join(outDir, 'display');
  const distStylesDir = path.join(distDisplayRoot, 'styles');
  const distHtmlPath = path.join(distDisplayRoot, 'display.html');
  if (!fs.existsSync(distHtmlPath)) {
    throw new Error(`Display CSS bundle 找不到构建后的 display.html：${distHtmlPath}`);
  }

  const sourceHtml = readText(path.join(sourceDisplayRoot, 'display.html'));
  assertDisplayCssOrder(sourceHtml);

  const sections = DISPLAY_CSS_ORDER.map((file) => {
    const cssPath = path.join(sourceStylesDir, file);
    if (!fs.existsSync(cssPath)) {
      throw new Error(`Display CSS bundle 缺少源文件：${cssPath}`);
    }
    return `/* ===== ${file} ===== */\n${readText(cssPath).trim()}\n`;
  });
  const bundleCss = `@charset "UTF-8";\n${sections.join('\n')}\n`;
  const hash = crypto
    .createHash('sha256')
    .update(bundleCss)
    .digest('hex')
    .slice(0, 12);
  const bundleFile = `display-bundle.${hash}.css`;
  const bundleHref = `./styles/${bundleFile}`;
  fs.mkdirSync(distStylesDir, { recursive: true });
  for (const file of fs.readdirSync(distStylesDir)) {
    if (/^display-bundle\.[a-f0-9]{12}\.css$/.test(file)) {
      fs.rmSync(path.join(distStylesDir, file));
    }
  }
  fs.writeFileSync(path.join(distStylesDir, bundleFile), bundleCss);

  const distHtml = readText(distHtmlPath);
  const rewrittenHtml = injectDisplayCssBundle(
    removeDisplayCssLinks(distHtml),
    bundleHref,
  );
  fs.writeFileSync(distHtmlPath, rewrittenHtml);
  return {
    file: bundleFile,
    href: bundleHref,
    cssCount: DISPLAY_CSS_ORDER.length,
    bytes: Buffer.byteLength(bundleCss),
  };
}
