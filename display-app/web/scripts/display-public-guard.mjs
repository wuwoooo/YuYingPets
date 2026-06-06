import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_FILES = [
  'public/display/display.html',
  'public/display/scripts/display-runtime.js',
  'public/display/scripts/display-ui.js',
  'public/display/scripts/display-app.js',
  'public/display/scripts/pet-colors.js',
  'public/display/styles/display.css',
];

const IGNORED_CALLS = new Set([
  'Array',
  'Boolean',
  'Date',
  'Math',
  'Number',
  'Object',
  'Promise',
  'String',
  'cancelAnimationFrame',
  'clearInterval',
  'clearTimeout',
  'decodeURIComponent',
  'encodeURIComponent',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'requestAnimationFrame',
  'setInterval',
  'setTimeout',
]);

const REQUIRED_SCRIPT_ORDER = [
  'scripts/pet-colors.js',
  'scripts/display-runtime.js',
  'scripts/display-ui.js',
  'scripts/display-app.js',
];

const REQUIRED_RUNTIME_API = [
  'getStorageItem',
  'setStorageItem',
  'removeStorageItem',
  'getStoredLoginCredentials',
  'getStoredLoginAccounts',
  'setStoredLoginCredentials',
  'removeStoredLoginAccount',
  'getStoredSetupUsername',
  'setStoredSetupUsername',
  'getPersistentToken',
  'setPersistentToken',
  'setDisplayClassId',
  'clearDisplayClassId',
  'setTerminalName',
  'hasHolidaySplashPlayed',
  'markHolidaySplashPlayed',
  'readLowSpecModeEnabled',
  'writeLowSpecModeEnabled',
  'readGridDensity',
  'writeGridDensity',
  'readSidebarCollapsed',
  'writeSidebarCollapsed',
  'getDisplayPerformanceTier',
  'isStandardDisplay',
  'isHighQualityDisplay',
  'isLowSpecMode',
  'getDisplayEffectBudget',
  'createTerminalCode',
  'resolveRuntimeParams',
  'getApiBase',
  'getAssetBase',
  'resolveAssetUrl',
  'giftImageVariant',
  'resolveDisplayImageUrl',
  'resolveDecoAssetUrl',
  'resolvePetAssetVariantUrl',
  'getSocketBase',
  'fetchApiJson',
  'requestFullscreen',
  'getFullscreenElement',
  'syncFullscreenButton',
  'exitFullscreen',
  'isDesktopRuntime',
  'minimizeDesktopWindow',
];

const REQUIRED_DISPLAY_RUNTIME_DELEGATES = [
  ['getDisplayPerformanceTier', 'getDisplayPerformanceTier'],
  ['isStandardDisplay', 'isStandardDisplay'],
  ['isHighQualityDisplay', 'isHighQualityDisplay'],
  ['isLowSpecMode', 'isLowSpecMode'],
  ['getDisplayEffectBudget', 'getDisplayEffectBudget'],
];

const REQUIRED_UI_API = [
  'configure',
  'activatePage',
  'showDisplayToast',
  'setRealtimeStatus',
  'closeConfirmModal',
  'showConfirmModal',
  'showDisplayAlert',
  'showToast',
];

const REQUIRED_DISPLAY_UI_DELEGATES = [
  ['showDisplayToast', 'showDisplayToast'],
  ['setRealtimeConnectionStatus', 'setRealtimeStatus'],
  ['closeConfirmModal', 'closeConfirmModal'],
  ['showConfirmModal', 'showConfirmModal'],
  ['showDisplayAlert', 'showDisplayAlert'],
  ['showToast', 'showToast'],
];

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertFileExists(filePath, label = filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Display 构建校验失败：缺少文件 ${label}`);
  }
}

function assertBrowserScriptSyntax(filePath, label) {
  const source = readText(filePath);
  try {
    // display-app.js 仍以非模块脚本运行。这里仅做语法解析，不执行代码。
    new Function(source);
  } catch (error) {
    throw new Error(`Display 构建校验失败：${label} 存在 JS 语法错误：${error.message}`);
  }
}

function collectRelativeAssetRefs(displayHtml) {
  const refs = new Set();
  const attrPattern = /\b(?:src|href)=["']\.\/([^"'?#]+)(?:[?#][^"']*)?["']/g;
  for (const match of displayHtml.matchAll(attrPattern)) {
    refs.add(match[1]);
  }
  return refs;
}

function assertHtmlAssetRefs(displayRoot, displayHtml) {
  const missing = [];
  for (const ref of collectRelativeAssetRefs(displayHtml)) {
    const target = path.join(displayRoot, ref);
    if (!fs.existsSync(target)) {
      missing.push(ref);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：display.html 引用了不存在的资源：${missing.join(', ')}`,
    );
  }
}

function collectScriptRefs(displayHtml) {
  const refs = [];
  const scriptPattern = /<script\b[^>]*\bsrc=["']\.\/([^"'?#]+)(?:[?#][^"']*)?["'][^>]*>/g;
  for (const match of displayHtml.matchAll(scriptPattern)) {
    refs.push(match[1]);
  }
  return refs;
}

function assertScriptLoadOrder(displayHtml) {
  const refs = collectScriptRefs(displayHtml);
  let previousIndex = -1;
  for (const requiredRef of REQUIRED_SCRIPT_ORDER) {
    const index = refs.indexOf(requiredRef);
    if (index === -1) {
      throw new Error(`Display 构建校验失败：display.html 未加载 ${requiredRef}`);
    }
    if (index <= previousIndex) {
      throw new Error(
        `Display 构建校验失败：脚本加载顺序错误，应按 ${REQUIRED_SCRIPT_ORDER.join(' -> ')} 加载`,
      );
    }
    previousIndex = index;
  }
}

function collectInlineOnclickCalls(displayHtml) {
  const calls = new Set();
  const onclickPattern = /\bonclick=["']([^"']+)["']/g;
  const callPattern = /(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g;
  for (const onclickMatch of displayHtml.matchAll(onclickPattern)) {
    const handler = onclickMatch[1];
    for (const callMatch of handler.matchAll(callPattern)) {
      const name = callMatch[1];
      if (!IGNORED_CALLS.has(name)) {
        calls.add(name);
      }
    }
  }
  return calls;
}

function hasGlobalFunction(scriptSource, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    new RegExp(`\\bfunction\\s+${escaped}\\s*\\(`).test(scriptSource) ||
    new RegExp(`\\b(?:const|let|var)\\s+${escaped}\\s*=`).test(scriptSource) ||
    new RegExp(`\\bwindow\\.${escaped}\\s*=`).test(scriptSource) ||
    new RegExp(`(?:^|[^.\\w$])${escaped}\\s*=\\s*(?:async\\s*)?function\\b`).test(scriptSource)
  );
}

function assertInlineHandlersHaveGlobals(displayHtml, displayScript) {
  const missing = [];
  for (const name of collectInlineOnclickCalls(displayHtml)) {
    if (!hasGlobalFunction(displayScript, name)) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：display.html 的 onclick 调用了未声明的全局函数：${missing.join(', ')}`,
    );
  }
}

function assertRuntimeApiContract(displayRuntime) {
  const missing = [];
  for (const name of REQUIRED_RUNTIME_API) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\b${escaped}\\s*[,}]`).test(displayRuntime)) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：DisplayRuntime 缺少主脚本依赖的方法：${missing.join(', ')}`,
    );
  }
}

function assertDisplayUiContract(displayUi) {
  const missing = [];
  for (const name of REQUIRED_UI_API) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\b${escaped}\\s*[,}]`).test(displayUi)) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：DisplayUI 缺少主脚本依赖的方法：${missing.join(', ')}`,
    );
  }
}

function assertDisplayRuntimeDelegates(displayScript) {
  const missing = [];
  for (const [globalName, runtimeName] of REQUIRED_DISPLAY_RUNTIME_DELEGATES) {
    const escapedGlobal = globalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedRuntime = runtimeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const delegatePattern = new RegExp(
      `\\bfunction\\s+${escapedGlobal}\\s*\\([^)]*\\)\\s*{[\\s\\S]{0,300}\\bDisplayRuntime\\.${escapedRuntime}\\s*\\(`,
    );
    if (!delegatePattern.test(displayScript)) {
      missing.push(`${globalName}->DisplayRuntime.${runtimeName}`);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：主脚本性能策略必须委托给 DisplayRuntime：${missing.join(', ')}`,
    );
  }
}

function assertDisplayUiDelegates(displayScript) {
  const missing = [];
  for (const [globalName, uiName] of REQUIRED_DISPLAY_UI_DELEGATES) {
    const escapedGlobal = globalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedUi = uiName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const delegatePattern = new RegExp(
      `\\bfunction\\s+${escapedGlobal}\\s*\\([^)]*\\)\\s*{[\\s\\S]{0,220}\\bDisplayUI\\.${escapedUi}\\s*\\(`,
    );
    if (!delegatePattern.test(displayScript)) {
      missing.push(`${globalName}->DisplayUI.${uiName}`);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：主脚本基础 UI 必须委托给 DisplayUI：${missing.join(', ')}`,
    );
  }
}

function assertApiFetchUsesRuntime(displayScript) {
  const apiFetchWithTokenPattern =
    /\basync\s+function\s+apiFetchWithToken\s*\([^)]*\)\s*{[\s\S]{0,1800}\bDisplayRuntime\.fetchApiJson\s*\(/;
  if (!apiFetchWithTokenPattern.test(displayScript)) {
    throw new Error(
      'Display 构建校验失败：apiFetchWithToken 必须委托 DisplayRuntime.fetchApiJson 处理 HTTP JSON 请求',
    );
  }
}

function assertNavigateUsesDisplayUi(displayScript) {
  const navigatePattern =
    /\bfunction\s+navigateTo\s*\([^)]*\)\s*{[\s\S]{0,500}\bDisplayUI\.activatePage\s*\(/;
  if (!navigatePattern.test(displayScript)) {
    throw new Error(
      'Display 构建校验失败：navigateTo 必须委托 DisplayUI.activatePage 处理页面激活',
    );
  }
}

function countMatches(source, pattern) {
  return Array.from(source.matchAll(pattern)).length;
}

export function collectDisplayPublicMetrics({ root = process.cwd() } = {}) {
  const displayHtmlPath = path.join(root, 'public/display/display.html');
  const displayScriptPath = path.join(root, 'public/display/scripts/display-app.js');
  const displayRuntimePath = path.join(root, 'public/display/scripts/display-runtime.js');
  const displayUiPath = path.join(root, 'public/display/scripts/display-ui.js');
  const displayCssPath = path.join(root, 'public/display/styles/display.css');
  const displayHtml = readText(displayHtmlPath);
  const displayScript = readText(displayScriptPath);
  const displayRuntime = readText(displayRuntimePath);
  const displayUi = readText(displayUiPath);
  const displayCss = readText(displayCssPath);

  return {
    htmlLines: displayHtml.split('\n').length,
    scriptLines: displayScript.split('\n').length,
    runtimeLines: displayRuntime.split('\n').length,
    uiLines: displayUi.split('\n').length,
    cssLines: displayCss.split('\n').length,
    inlineOnclickCount: countMatches(displayHtml, /\bonclick=/g),
    scriptFunctionCount: countMatches(displayScript, /^\s*(?:async\s+)?function\s+/gm),
    scriptInnerHtmlCount: countMatches(displayScript, /\binnerHTML\b/g),
    scriptDomLookupCount: countMatches(displayScript, /\bgetElementById\b|\bquerySelector\b/g),
    scriptStorageAccessCount: countMatches(displayScript, /\blocalStorage\.(?:getItem|setItem|removeItem)\b/g),
  };
}

export function validateDisplayPublic({ root = process.cwd(), silent = false } = {}) {
  for (const relativePath of REQUIRED_FILES) {
    assertFileExists(path.join(root, relativePath), relativePath);
  }

  const displayRoot = path.join(root, 'public/display');
  const displayHtmlPath = path.join(displayRoot, 'display.html');
  const displayScriptPath = path.join(displayRoot, 'scripts/display-app.js');
  const displayRuntimePath = path.join(displayRoot, 'scripts/display-runtime.js');
  const displayUiPath = path.join(displayRoot, 'scripts/display-ui.js');
  const petColorsPath = path.join(displayRoot, 'scripts/pet-colors.js');
  const displayHtml = readText(displayHtmlPath);
  const displayScript = readText(displayScriptPath);
  const displayRuntime = readText(displayRuntimePath);
  const displayUi = readText(displayUiPath);

  assertBrowserScriptSyntax(displayRuntimePath, 'scripts/display-runtime.js');
  assertBrowserScriptSyntax(displayUiPath, 'scripts/display-ui.js');
  assertBrowserScriptSyntax(displayScriptPath, 'scripts/display-app.js');
  assertBrowserScriptSyntax(petColorsPath, 'scripts/pet-colors.js');
  assertHtmlAssetRefs(displayRoot, displayHtml);
  assertScriptLoadOrder(displayHtml);
  assertRuntimeApiContract(displayRuntime);
  assertDisplayUiContract(displayUi);
  assertDisplayRuntimeDelegates(displayScript);
  assertDisplayUiDelegates(displayScript);
  assertApiFetchUsesRuntime(displayScript);
  assertNavigateUsesDisplayUi(displayScript);
  assertInlineHandlersHaveGlobals(displayHtml, displayScript);

  const metrics = collectDisplayPublicMetrics({ root });
  if (!silent) {
    console.log(
      [
        '[display-public-guard] ok',
        `html=${metrics.htmlLines}行`,
        `runtime=${metrics.runtimeLines}行`,
        `ui=${metrics.uiLines}行`,
        `js=${metrics.scriptLines}行`,
        `css=${metrics.cssLines}行`,
        `onclick=${metrics.inlineOnclickCount}`,
        `functions=${metrics.scriptFunctionCount}`,
        `storage=${metrics.scriptStorageAccessCount}`,
      ].join(' '),
    );
  }
  return metrics;
}
