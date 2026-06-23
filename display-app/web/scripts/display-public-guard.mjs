import fs from 'node:fs';
import path from 'node:path';
import { assertDisplayCssOrder } from './display-css-bundle.mjs';
import { assertDisplayBridgeScriptOrder } from './display-js-bridge-bundle.mjs';

const REQUIRED_FILES = [
  'scripts/display-css-bundle.mjs',
  'scripts/display-js-bridge-bundle.mjs',
  'public/display/display.html',
  'public/display/scripts/display-runtime.js',
  'public/display/scripts/display-ui.js',
  'public/display/scripts/display-auth.js',
  'public/display/scripts/display-holiday-dates.js',
  'public/display/scripts/display-score.js',
  'public/display/scripts/display-realtime.js',
  'public/display/scripts/display-pet-catalog.js',
  'public/display/scripts/display-exchange.js',
  'public/display/scripts/display-leaderboard.js',
  'public/display/scripts/display-honor.js',
  'public/display/scripts/display-student-grid.js',
  'public/display/scripts/display-pet-profile.js',
  'public/display/scripts/display-deco.js',
  'public/display/scripts/display-academic.js',
  'public/display/scripts/display-audio.js',
  'public/display/scripts/display-call.js',
  'public/display/scripts/display-entry-effects.js',
  'public/display/scripts/display-group.js',
  'public/display/scripts/display-toolbox.js',
  'public/display/scripts/display-settings.js',
  'public/display/scripts/display-app.js',
  'public/display/scripts/pet-colors.js',
  'public/display/styles/display.css',
  'public/display/styles/display-classroom-base.css',
  'public/display/styles/display-holiday.css',
  'public/display/styles/display-classroom-shell.css',
  'public/display/styles/display-student-card.css',
  'public/display/styles/display-modal-core.css',
  'public/display/styles/display-sidebar.css',
  'public/display/styles/display-classroom-effects.css',
  'public/display/styles/display-performance.css',
  'public/display/styles/display-entry-transition.css',
  'public/display/styles/display-honor.css',
  'public/display/styles/display-setup-login.css',
  'public/display/styles/display-pet-profile.css',
  'public/display/styles/display-pet-pk.css',
  'public/display/styles/display-group.css',
  'public/display/styles/display-adopt.css',
  'public/display/styles/display-academic.css',
  'public/display/styles/display-exchange.css',
  'public/display/styles/display-leaderboard.css',
  'public/display/styles/display-point-modal.css',
  'public/display/styles/display-classroom-settings.css',
  'public/display/styles/display-toolbox.css',
  'public/display/styles/display-pet-fullview.css',
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
  'scripts/display-auth.js',
  'scripts/display-holiday-dates.js',
  'scripts/display-score.js',
  'scripts/display-realtime.js',
  'scripts/display-pet-catalog.js',
  'scripts/display-exchange.js',
  'scripts/display-leaderboard.js',
  'scripts/display-honor.js',
  'scripts/display-student-grid.js',
  'scripts/display-pet-profile.js',
  'scripts/display-deco.js',
  'scripts/display-academic.js',
  'scripts/display-audio.js',
  'scripts/display-call.js',
  'scripts/display-entry-effects.js',
  'scripts/display-group.js',
  'scripts/display-toolbox.js',
  'scripts/display-settings.js',
  'scripts/display-app.js',
];

const REQUIRED_HOLIDAY_DATES_API = [
  'DRAGON_BOAT_FESTIVAL_YMD_BY_YEAR',
  'DRAGON_BOAT_FESTIVAL_RANGES',
  'DISPLAY_HOLIDAY_PRESENTATION',
  'DISPLAY_HOLIDAY_CONFIGS',
  'formatChinaYmd',
  'matchDragonBoatFestival',
  'parseDisplayHolidayDate',
  'getDisplayHolidayEvaluationDate',
  'resolveDisplayHoliday',
  'getDisplayHolidayPresentation',
  'applyHolidayPresentation',
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
  'hasHolidayExperiencePlayed',
  'markHolidayExperiencePlayed',
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
  'renderLockMeta',
  'renderLockOverlay',
  'closeConfirmModal',
  'showConfirmModal',
  'showDisplayAlert',
  'showToast',
  'renderSavedLoginAccounts',
  'hydrateLoginUsername',
  'clearDisplayPasswordInputs',
  'suppressPasswordManagerPrompts',
  'fillLoginCredentials',
  'getSelectedSavedLoginUsername',
  'setSavedLoginDeleteDisabled',
  'clearLoginCredentialsIfUsername',
  'setSetupMessage',
  'goSetupStep',
  'renderSetupMode',
];

const REQUIRED_DISPLAY_UI_DELEGATES = [
  ['showDisplayToast', 'showDisplayToast'],
  ['setRealtimeConnectionStatus', 'setRealtimeStatus'],
  ['updateLockMeta', 'renderLockMeta'],
  ['closeConfirmModal', 'closeConfirmModal'],
  ['showConfirmModal', 'showConfirmModal'],
  ['showDisplayAlert', 'showDisplayAlert'],
  ['showToast', 'showToast'],
  ['renderSavedLoginAccounts', 'renderSavedLoginAccounts'],
  ['clearDisplayPasswordInputs', 'clearDisplayPasswordInputs'],
  ['suppressPasswordManagerPrompts', 'suppressPasswordManagerPrompts'],
  ['fillLoginCredentials', 'fillLoginCredentials'],
  ['setSetupMessage', 'setSetupMessage'],
  ['goSetupStep', 'goSetupStep'],
];

const REQUIRED_AUTH_API = [
  'isDisplayAdminRole',
  'canInitializeDisplayTerminalRole',
  'canOverrideClassDisplayBinding',
  'getClassScopeIds',
  'canAccessClass',
  'isHomeroomOfClass',
  'canAdoptPet',
  'shouldAutoRenewUnlock',
  'shouldRenewUnlockSoon',
  'getOperationLockedAlertCopy',
  'getHomeroomOnlyAlertCopy',
  'createLockOverlayViewModel',
  'getSetupModeTextMap',
  'getClassBindingsByClassId',
  'isSetupClassSelectable',
  'getSetupClassBindingHint',
  'normalizeGradeName',
  'getSetupGradeNames',
  'getFilteredSetupClasses',
  'createDisplayTerminalPayload',
  'createActiveUnlockPatch',
  'createLockedPatch',
];

const REQUIRED_DISPLAY_AUTH_DELEGATES = [
  ['shouldAutoRenewUnlock', 'shouldAutoRenewUnlock'],
  ['shouldRenewUnlockSoon', 'shouldRenewUnlockSoon'],
  ['getClassScopeIds', 'getClassScopeIds'],
  ['isDisplayAdminRole', 'isDisplayAdminRole'],
  ['canInitializeDisplayTerminalRole', 'canInitializeDisplayTerminalRole'],
  ['canOverrideClassDisplayBinding', 'canOverrideClassDisplayBinding'],
  ['canCurrentUserAccessClass', 'canAccessClass'],
  ['isHomeroomOfCurrentClass', 'isHomeroomOfClass'],
  ['canAdoptPet', 'canAdoptPet'],
  ['getOperationLockedAlertCopy', 'getOperationLockedAlertCopy'],
  ['getHomeroomOnlyAlertCopy', 'getHomeroomOnlyAlertCopy'],
  ['getClassBindingsByClassId', 'getClassBindingsByClassId'],
  ['isSetupClassSelectable', 'isSetupClassSelectable'],
  ['getSetupClassBindingHint', 'getSetupClassBindingHint'],
  ['normalizeGradeName', 'normalizeGradeName'],
  ['getSetupGradeNames', 'getSetupGradeNames'],
  ['getFilteredSetupClasses', 'getFilteredSetupClasses'],
];

const REQUIRED_SCORE_API = [
  'createEmptyScoreEffectsBucket',
  'shouldSuppressScoreSoundForPayload',
  'accumulateScoreEffects',
  'scoreEffectsToRows',
  'computeScoreAnimDuration',
  'getRemoteScoreAnimCount',
  'selectRemoteScoreRows',
  'upgradesFromBucket',
];

const REQUIRED_DISPLAY_SCORE_DELEGATES = [
  ['createEmptyScoreEffectsBucket', 'createEmptyScoreEffectsBucket'],
  ['shouldSuppressScoreSoundForPayload', 'shouldSuppressScoreSoundForPayload'],
  ['accumulateScoreEffects', 'accumulateScoreEffects'],
  ['scoreEffectsToRows', 'scoreEffectsToRows'],
  ['computeScoreAnimDuration', 'computeScoreAnimDuration'],
];

const REQUIRED_REALTIME_API = [
  'shouldAcceptClassPayload',
  'shouldAcceptDisplayPayload',
  'bindSocketEvents',
  'syncRoomSubscriptions',
];

const REQUIRED_PET_CATALOG_API = [
  'PET_STAGE_COUNT',
  'STAR_SEED_IMAGE_URL',
  'getDefaultPetCatalog',
  'getAdoptOrbitPosition',
  'resolvePetCategoryMeta',
  'resolvePetFamily',
  'resolvePetFamilyLabel',
  'resolvePetCategoryLabel',
  'resolvePetTheme',
  'normalizePetStage',
  'normalizePetCatalogItem',
  'normalizePetCatalog',
  'getAdoptCatalog',
  'getFilteredAdoptCatalog',
  'getVisibleAdoptFamilyOptions',
  'normalizeAdoptFamilySelection',
  'getSelectedAdoptPet',
  'setAdoptPetFamily',
  'previewAdoptPet',
  'openAdoptPetDetailModal',
  'closeAdoptPetDetailModal',
  'getPetPreviewImage',
  'getAdoptStageContext',
  'updateAdoptPetDetailStage',
  'renderAdoptFamilyTabs',
  'renderAdoptPetGrid',
  'renderAdoptPetDetail',
  'renderAdoptPetModal',
];

const REQUIRED_DISPLAY_PET_CATALOG_DELEGATES = [
  ['getAdoptCatalog', 'getAdoptCatalog'],
  ['getFilteredAdoptCatalog', 'getFilteredAdoptCatalog'],
  ['setAdoptPetFamily', 'setAdoptPetFamily'],
  ['previewAdoptPet', 'previewAdoptPet'],
  ['openAdoptPetDetailModal', 'openAdoptPetDetailModal'],
  ['closeAdoptPetDetailModal', 'closeAdoptPetDetailModal'],
  ['renderAdoptPetModal', 'renderAdoptPetModal'],
];

const EXTRA_DISPLAY_MODULES = [
  {
    label: 'DisplayExchange',
    file: 'display-exchange.js',
    api: [
      'createInitialState',
      'beginExchange',
      'findEligibleStudent',
      'renderStudentOptions',
      'createConfirmCopy',
      'createRewardOrderPayload',
      'applyLocalPointDeduction',
      'renderSuccessMessage',
    ],
  },
  {
    label: 'DisplayLeaderboard',
    file: 'display-leaderboard.js',
    api: [
      'resolveLeaderboardMetric',
      'renderLeaderboardRow',
      'renderLeaderboardListHtml',
      'applyLeaderboardTop3',
    ],
  },
  {
    label: 'DisplayHonor',
    file: 'display-honor.js',
    api: [
      'CLASS_HONOR_BADGE_LIMIT',
      'formatHonorGrantedTime',
      'normalizeHonorRecord',
      'mergeRecentHonors',
      'mergeClassHonors',
      'renderClassHonorBadgeHtml',
      'renderClassHonorBadgesHtml',
      'buildHonorMarqueeLine',
      'renderHonorBadgeIcon',
      'renderHonorFeedHtml',
    ],
  },
  {
    label: 'DisplayStudentGrid',
    file: 'display-student-grid.js',
    api: [
      'sortStudents',
      'getVisibleStudentIndices',
      'createRenderSignature',
      'toggleSelectedName',
      'selectAllVisible',
      'getBatchCountText',
      'lvCategory',
      'studentCardDomKey',
      'buildStudentCardTopRightHtml',
      'applyStudentCardRank',
      'buildStudentCardHtml',
      'buildStudentGridHtml',
    ],
  },
  {
    label: 'DisplayPetProfile',
    file: 'display-pet-profile.js',
    api: [
      'resolvePetDisplayName',
      'resolveCardCustomName',
      'normalizePetNicknameInput',
      'resolveStudentPetId',
      'splitAcademicAiLines',
      'buildHistoryRows',
    ],
  },
  {
    label: 'DisplayDeco',
    file: 'display-deco.js',
    api: [
      'createNoneDeco',
      'isPetDecoNone',
      'normalizeDecoArrayPayload',
      'mergeDecorationCatalogWithKnownState',
      'formatLocalYmd',
      'isThemeFreeRuleActive',
      'sortDecorationsWithEquippedFirst',
      'sortThemesWithEquippedFirst',
      'resolveDecoCode',
      'buildAccessoryDecoAttrs',
      'extractPetSpeciesCode',
      'computeDecoTransform',
      'applyDecoOffset',
      'resolveDecoPreviewSize',
      'warmDecoAssetCache',
      'setDecoLayerElement',
      'syncAccessoryDecoElement',
      'buildCardDecoLayers',
    ],
  },
  {
    label: 'DisplayAcademic',
    file: 'display-academic.js',
    api: [
      'splitAcademicAiLines',
      'normalizeAcademicDimensions',
      'buildAcademicAiView',
      'buildAcademicAiBodyHtml',
    ],
  },
  {
    label: 'DisplaySettings',
    file: 'display-settings.js',
    api: [
      'toggleSettingsMenu',
      'syncToggle',
      'initNoNativeTooltips',
      'applyLowSpecBodyState',
    ],
  },
  {
    label: 'DisplayAudio',
    file: 'display-audio.js',
    api: [
      'bindAudioUnlock',
      'playScoreSound',
      'playMelodicChime',
      'startAlertSound',
      'stopAlertSound',
    ],
  },
  {
    label: 'DisplayCall',
    file: 'display-call.js',
    api: [
      'formatCallTitle',
      'renderCalledStudentTags',
      'createCallOverlayActionState',
    ],
  },
  {
    label: 'DisplayEntryEffects',
    file: 'display-entry-effects.js',
    api: [
      'ensureEntryStarfield',
      'restartEntryShootingStars',
      'unloadEntryAnimations',
      'spawnCssParticles',
    ],
  },
  {
    label: 'DisplayGroup',
    file: 'display-group.js',
    api: [
      'getStudentDraftKey',
      'createGroupManageDraft',
      'getGroupScoreRankingRows',
      'formatGroupScoreRecordTime',
      'renderGroupScoreRankingHtml',
      'renderGroupScoreRecordsListHtml',
      'buildGroupOptionsHtml',
      'renderGroupManageListHtml',
      'renderGroupManageStudentRowsHtml',
      'buildGroupManagePayload',
      'isGroupManageDraftDirty',
      'applyGroupManageDraftToStudents',
    ],
  },
  {
    label: 'DisplayToolbox',
    file: 'display-toolbox.js',
    api: [
      'TOOLBOX_CONFIG',
      'TOOLBOX_MODE_ASSETS',
      'createDefaultSettings',
      'preloadToolboxModeAssets',
      'setText',
      'setBackground',
      'isAudioTool',
      'isAudioRunning',
      'getGroupOptions',
      'getStudentsByScope',
      'luckyStudentKey',
      'luckyStudentKeyForInlineHandler',
      'isLuckyStudentExcluded',
      'getLuckyExcludedCountInScope',
      'formatStatsTime',
      'resolveEnergyLevel',
      'getGardenThresholdLabel',
      'resolveGardenLevel',
      'formatTimerMs',
      'setResult',
    ],
  },
];

const ALLOWED_DUPLICATE_GLOBAL_FUNCTIONS = new Set();

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

function assertDisplayAuthContract(displayAuth) {
  const missing = [];
  for (const name of REQUIRED_AUTH_API) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\b${escaped}\\s*[,}]`).test(displayAuth)) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：DisplayAuth 缺少主脚本依赖的方法：${missing.join(', ')}`,
    );
  }
}

function assertDisplayScoreContract(displayScore) {
  const missing = [];
  for (const name of REQUIRED_SCORE_API) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\b${escaped}\\s*[,}]`).test(displayScore)) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：DisplayScore 缺少主脚本依赖的方法：${missing.join(', ')}`,
    );
  }
}

function assertDisplayRealtimeContract(displayRealtime) {
  const missing = [];
  for (const name of REQUIRED_REALTIME_API) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\b${escaped}\\s*[,}]`).test(displayRealtime)) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：DisplayRealtime 缺少主脚本依赖的方法：${missing.join(', ')}`,
    );
  }
}

function assertDisplayPetCatalogContract(displayPetCatalog) {
  const missing = [];
  for (const name of REQUIRED_PET_CATALOG_API) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\b${escaped}\\s*[,}]`).test(displayPetCatalog)) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：DisplayPetCatalog 缺少主脚本依赖的方法：${missing.join(', ')}`,
    );
  }
}

function assertNamedApiContract(source, apiNames, label) {
  const missing = [];
  for (const name of apiNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\b${escaped}\\s*[,}]`).test(source)) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：${label} 缺少主脚本依赖的方法：${missing.join(', ')}`,
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

function assertDisplayAuthDelegates(displayScript) {
  const missing = [];
  for (const [globalName, authName] of REQUIRED_DISPLAY_AUTH_DELEGATES) {
    const escapedGlobal = globalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedAuth = authName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const delegatePattern = new RegExp(
      `\\bfunction\\s+${escapedGlobal}\\s*\\([^)]*\\)\\s*{[\\s\\S]{0,900}\\bDisplayAuth\\.${escapedAuth}\\s*\\(`,
    );
    if (!delegatePattern.test(displayScript)) {
      missing.push(`${globalName}->DisplayAuth.${authName}`);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：主脚本认证权限判断必须委托给 DisplayAuth：${missing.join(', ')}`,
    );
  }
}

function assertDisplayScoreDelegates(displayScript) {
  const missing = [];
  for (const [globalName, scoreName] of REQUIRED_DISPLAY_SCORE_DELEGATES) {
    const escapedGlobal = globalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedScore = scoreName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const delegatePattern = new RegExp(
      `\\bfunction\\s+${escapedGlobal}\\s*\\([^)]*\\)\\s*{[\\s\\S]{0,500}\\bDisplayScore\\.${escapedScore}\\s*\\(`,
    );
    if (!delegatePattern.test(displayScript)) {
      missing.push(`${globalName}->DisplayScore.${scoreName}`);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：主脚本积分动画纯逻辑必须委托给 DisplayScore：${missing.join(', ')}`,
    );
  }
}

function assertDisplayPetCatalogDelegates(displayScript) {
  const missing = [];
  for (const [globalName, petCatalogName] of REQUIRED_DISPLAY_PET_CATALOG_DELEGATES) {
    const escapedGlobal = globalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedPetCatalog = petCatalogName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const delegatePattern = new RegExp(
      `\\bfunction\\s+${escapedGlobal}\\s*\\([^)]*\\)\\s*{[\\s\\S]{0,900}\\bDisplayPetCatalog\\.${escapedPetCatalog}\\s*\\(`,
    );
    if (!delegatePattern.test(displayScript)) {
      missing.push(`${globalName}->DisplayPetCatalog.${petCatalogName}`);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Display 构建校验失败：主脚本萌宠图鉴/领养逻辑必须委托给 DisplayPetCatalog：${missing.join(', ')}`,
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

function assertLockOverlayUsesBridges(displayScript) {
  const applyLockOverlayPattern =
    /\bfunction\s+applyLockOverlay\s*\([^)]*\)\s*{[\s\S]{0,1200}\bDisplayUI\.renderLockOverlay\s*\([\s\S]{0,900}\bDisplayAuth\.createLockOverlayViewModel\s*\(/;
  if (!applyLockOverlayPattern.test(displayScript)) {
    throw new Error(
      'Display 构建校验失败：applyLockOverlay 必须委托 DisplayAuth.createLockOverlayViewModel 和 DisplayUI.renderLockOverlay',
    );
  }
}

function assertLoginSetupUsesBridges(displayScript) {
  const requiredPatterns = [
    [
      /\bfunction\s+hydrateLoginCredentials\s*\([^)]*\)\s*{[\s\S]{0,500}\bDisplayUI\.hydrateLoginUsername\s*\(/,
      'hydrateLoginCredentials 必须委托 DisplayUI.hydrateLoginUsername',
    ],
    [
      /\bfunction\s+syncSetupMode\s*\([^)]*\)\s*{[\s\S]{0,700}\bDisplayAuth\.getSetupModeTextMap\s*\([\s\S]{0,700}\bDisplayUI\.renderSetupMode\s*\(/,
      'syncSetupMode 必须委托 DisplayAuth.getSetupModeTextMap 和 DisplayUI.renderSetupMode',
    ],
  ];
  const missing = requiredPatterns
    .filter(([pattern]) => !pattern.test(displayScript))
    .map(([, message]) => message);
  if (missing.length > 0) {
    throw new Error(`Display 构建校验失败：${missing.join('；')}`);
  }
}

function assertUnlockLockUsesAuthBridge(displayScript) {
  const requiredPatterns = [
    [
      /\basync\s+function\s+renewDisplayUnlockSession\s*\([^)]*\)\s*{[\s\S]{0,2200}\bDisplayAuth\.createDisplayTerminalPayload\s*\([\s\S]{0,2500}\bDisplayAuth\.createActiveUnlockPatch\s*\(/,
      'renewDisplayUnlockSession 必须通过 DisplayAuth 构造终端 payload 和 active unlock patch',
    ],
    [
      /\basync\s+function\s+unlockDisplay\s*\([^)]*\)\s*{[\s\S]{0,2200}\bDisplayAuth\.createDisplayTerminalPayload\s*\([\s\S]{0,2200}\bDisplayAuth\.createActiveUnlockPatch\s*\(/,
      'unlockDisplay 必须通过 DisplayAuth 构造终端 payload 和 active unlock patch',
    ],
    [
      /\basync\s+function\s+lockDisplay\s*\([^)]*\)\s*{[\s\S]{0,1600}\bDisplayAuth\.createDisplayTerminalPayload\s*\(/,
      'lockDisplay 必须通过 DisplayAuth 构造终端 payload',
    ],
  ];
  const missing = requiredPatterns
    .filter(([pattern]) => !pattern.test(displayScript))
    .map(([, message]) => message);
  if (missing.length > 0) {
    throw new Error(`Display 构建校验失败：${missing.join('；')}`);
  }
}

function assertRealtimeUsesBridge(displayScript) {
  const requiredPatterns = [
    [
      /\bfunction\s+connectRealtime\s*\([^)]*\)\s*{[\s\S]{0,9000}\bDisplayRealtime\.bindSocketEvents\s*\(/,
      'connectRealtime 必须委托 DisplayRealtime.bindSocketEvents 注册事件',
    ],
    [
      /\bfunction\s+subscribeRealtimeRooms\s*\([^)]*\)\s*{[\s\S]{0,1400}\bDisplayRealtime\.syncRoomSubscriptions\s*\(/,
      'subscribeRealtimeRooms 必须委托 DisplayRealtime.syncRoomSubscriptions 同步订阅',
    ],
  ];
  const missing = requiredPatterns
    .filter(([pattern]) => !pattern.test(displayScript))
    .map(([, message]) => message);
  if (missing.length > 0) {
    throw new Error(`Display 构建校验失败：${missing.join('；')}`);
  }
}

function assertScoreQueuesUseBridge(displayScript) {
  const requiredPatterns = [
    [
      /\bfunction\s+playRemoteScoreAnimations\s*\([^)]*\)\s*{[\s\S]{0,1800}\bDisplayScore\.selectRemoteScoreRows\s*\(/,
      'playRemoteScoreAnimations 必须委托 DisplayScore.selectRemoteScoreRows 选择动画行',
    ],
    [
      /\bfunction\s+queueScoreUpgradesFromBucket\s*\([^)]*\)\s*{[\s\S]{0,600}\bDisplayScore\.upgradesFromBucket\s*\(/,
      'queueScoreUpgradesFromBucket 必须委托 DisplayScore.upgradesFromBucket',
    ],
    [
      /\bfunction\s+flushClassroomScoreVisuals\s*\([^)]*\)\s*{[\s\S]{0,1400}\bDisplayScore\.getRemoteScoreAnimCount\s*\(/,
      'flushClassroomScoreVisuals 必须委托 DisplayScore.getRemoteScoreAnimCount',
    ],
  ];
  const missing = requiredPatterns
    .filter(([pattern]) => !pattern.test(displayScript))
    .map(([, message]) => message);
  if (missing.length > 0) {
    throw new Error(`Display 构建校验失败：${missing.join('；')}`);
  }
}

function assertNoUnexpectedDuplicateGlobalFunctions(displayScript) {
  const occurrences = new Map();
  const lines = displayScript.split('\n');
  lines.forEach((line, index) => {
    const match = line.match(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (!match) return;
    const list = occurrences.get(match[1]) || [];
    list.push(index + 1);
    occurrences.set(match[1], list);
  });
  const unexpected = [];
  for (const [name, locations] of occurrences.entries()) {
    if (locations.length <= 1) continue;
    if (!ALLOWED_DUPLICATE_GLOBAL_FUNCTIONS.has(name)) {
      unexpected.push(`${name}(${locations.join('/')})`);
    }
  }
  if (unexpected.length > 0) {
    throw new Error(
      `Display 构建校验失败：主脚本出现新的重复全局函数名：${unexpected.join(', ')}`,
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
  const displayAuthPath = path.join(root, 'public/display/scripts/display-auth.js');
  const displayHolidayDatesPath = path.join(root, 'public/display/scripts/display-holiday-dates.js');
  const displayScorePath = path.join(root, 'public/display/scripts/display-score.js');
  const displayRealtimePath = path.join(root, 'public/display/scripts/display-realtime.js');
  const displayPetCatalogPath = path.join(root, 'public/display/scripts/display-pet-catalog.js');
  const extraModulePaths = EXTRA_DISPLAY_MODULES.map((module) => ({
    ...module,
    path: path.join(root, `public/display/scripts/${module.file}`),
  }));
  const displayCssPath = path.join(root, 'public/display/styles/display.css');
  const displayClassroomBaseCssPath = path.join(
    root,
    'public/display/styles/display-classroom-base.css',
  );
  const displayHolidayCssPath = path.join(
    root,
    'public/display/styles/display-holiday.css',
  );
  const displayClassroomShellCssPath = path.join(
    root,
    'public/display/styles/display-classroom-shell.css',
  );
  const displayStudentCardCssPath = path.join(
    root,
    'public/display/styles/display-student-card.css',
  );
  const displayModalCoreCssPath = path.join(
    root,
    'public/display/styles/display-modal-core.css',
  );
  const displaySidebarCssPath = path.join(
    root,
    'public/display/styles/display-sidebar.css',
  );
  const displayClassroomEffectsCssPath = path.join(
    root,
    'public/display/styles/display-classroom-effects.css',
  );
  const displayPerformanceCssPath = path.join(
    root,
    'public/display/styles/display-performance.css',
  );
  const displayEntryTransitionCssPath = path.join(
    root,
    'public/display/styles/display-entry-transition.css',
  );
  const displayHonorCssPath = path.join(
    root,
    'public/display/styles/display-honor.css',
  );
  const displaySetupLoginCssPath = path.join(
    root,
    'public/display/styles/display-setup-login.css',
  );
  const displayPetProfileCssPath = path.join(
    root,
    'public/display/styles/display-pet-profile.css',
  );
  const displayPetPkCssPath = path.join(
    root,
    'public/display/styles/display-pet-pk.css',
  );
  const displayGroupCssPath = path.join(
    root,
    'public/display/styles/display-group.css',
  );
  const displayAdoptCssPath = path.join(
    root,
    'public/display/styles/display-adopt.css',
  );
  const displayAcademicCssPath = path.join(
    root,
    'public/display/styles/display-academic.css',
  );
  const displayExchangeCssPath = path.join(
    root,
    'public/display/styles/display-exchange.css',
  );
  const displayLeaderboardCssPath = path.join(
    root,
    'public/display/styles/display-leaderboard.css',
  );
  const displayPointModalCssPath = path.join(
    root,
    'public/display/styles/display-point-modal.css',
  );
  const displayClassroomSettingsCssPath = path.join(
    root,
    'public/display/styles/display-classroom-settings.css',
  );
  const displayToolboxCssPath = path.join(
    root,
    'public/display/styles/display-toolbox.css',
  );
  const displayPetFullviewCssPath = path.join(
    root,
    'public/display/styles/display-pet-fullview.css',
  );
  const displayHtml = readText(displayHtmlPath);
  const displayScript = readText(displayScriptPath);
  const displayRuntime = readText(displayRuntimePath);
  const displayUi = readText(displayUiPath);
  const displayAuth = readText(displayAuthPath);
  const displayHolidayDates = readText(displayHolidayDatesPath);
  const displayScore = readText(displayScorePath);
  const displayRealtime = readText(displayRealtimePath);
  const displayPetCatalog = readText(displayPetCatalogPath);
  const extraModules = extraModulePaths.map((module) => ({
    ...module,
    source: readText(module.path),
  }));
  const displayCss = readText(displayCssPath);
  const displayClassroomBaseCss = readText(displayClassroomBaseCssPath);
  const displayHolidayCss = readText(displayHolidayCssPath);
  const displayClassroomShellCss = readText(displayClassroomShellCssPath);
  const displayStudentCardCss = readText(displayStudentCardCssPath);
  const displayModalCoreCss = readText(displayModalCoreCssPath);
  const displaySidebarCss = readText(displaySidebarCssPath);
  const displayClassroomEffectsCss = readText(displayClassroomEffectsCssPath);
  const displayPerformanceCss = readText(displayPerformanceCssPath);
  const displayEntryTransitionCss = readText(displayEntryTransitionCssPath);
  const displayHonorCss = readText(displayHonorCssPath);
  const displaySetupLoginCss = readText(displaySetupLoginCssPath);
  const displayPetProfileCss = readText(displayPetProfileCssPath);
  const displayPetPkCss = readText(displayPetPkCssPath);
  const displayGroupCss = readText(displayGroupCssPath);
  const displayAdoptCss = readText(displayAdoptCssPath);
  const displayAcademicCss = readText(displayAcademicCssPath);
  const displayExchangeCss = readText(displayExchangeCssPath);
  const displayLeaderboardCss = readText(displayLeaderboardCssPath);
  const displayPointModalCss = readText(displayPointModalCssPath);
  const displayClassroomSettingsCss = readText(displayClassroomSettingsCssPath);
  const displayToolboxCss = readText(displayToolboxCssPath);
  const displayPetFullviewCss = readText(displayPetFullviewCssPath);

  return {
    htmlLines: displayHtml.split('\n').length,
    scriptLines: displayScript.split('\n').length,
    runtimeLines: displayRuntime.split('\n').length,
    uiLines: displayUi.split('\n').length,
    authLines: displayAuth.split('\n').length,
    holidayDatesLines: displayHolidayDates.split('\n').length,
    scoreLines: displayScore.split('\n').length,
    realtimeLines: displayRealtime.split('\n').length,
    petCatalogLines: displayPetCatalog.split('\n').length,
    extraModuleLines: Object.fromEntries(
      extraModules.map((module) => [
        module.label,
        module.source.split('\n').length,
      ]),
    ),
    cssLines: displayCss.split('\n').length,
    classroomBaseCssLines: displayClassroomBaseCss.split('\n').length,
    holidayCssLines: displayHolidayCss.split('\n').length,
    classroomShellCssLines: displayClassroomShellCss.split('\n').length,
    studentCardCssLines: displayStudentCardCss.split('\n').length,
    modalCoreCssLines: displayModalCoreCss.split('\n').length,
    sidebarCssLines: displaySidebarCss.split('\n').length,
    classroomEffectsCssLines: displayClassroomEffectsCss.split('\n').length,
    performanceCssLines: displayPerformanceCss.split('\n').length,
    entryTransitionCssLines: displayEntryTransitionCss.split('\n').length,
    honorCssLines: displayHonorCss.split('\n').length,
    setupLoginCssLines: displaySetupLoginCss.split('\n').length,
    petProfileCssLines: displayPetProfileCss.split('\n').length,
    petPkCssLines: displayPetPkCss.split('\n').length,
    groupCssLines: displayGroupCss.split('\n').length,
    adoptCssLines: displayAdoptCss.split('\n').length,
    academicCssLines: displayAcademicCss.split('\n').length,
    exchangeCssLines: displayExchangeCss.split('\n').length,
    leaderboardCssLines: displayLeaderboardCss.split('\n').length,
    pointModalCssLines: displayPointModalCss.split('\n').length,
    classroomSettingsCssLines: displayClassroomSettingsCss.split('\n').length,
    toolboxCssLines: displayToolboxCss.split('\n').length,
    petFullviewCssLines: displayPetFullviewCss.split('\n').length,
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
  const displayAuthPath = path.join(displayRoot, 'scripts/display-auth.js');
  const displayHolidayDatesPath = path.join(displayRoot, 'scripts/display-holiday-dates.js');
  const displayScorePath = path.join(displayRoot, 'scripts/display-score.js');
  const displayRealtimePath = path.join(displayRoot, 'scripts/display-realtime.js');
  const displayPetCatalogPath = path.join(displayRoot, 'scripts/display-pet-catalog.js');
  const extraModulePaths = EXTRA_DISPLAY_MODULES.map((module) => ({
    ...module,
    path: path.join(displayRoot, `scripts/${module.file}`),
  }));
  const petColorsPath = path.join(displayRoot, 'scripts/pet-colors.js');
  const displayHtml = readText(displayHtmlPath);
  const displayScript = readText(displayScriptPath);
  const displayRuntime = readText(displayRuntimePath);
  const displayUi = readText(displayUiPath);
  const displayAuth = readText(displayAuthPath);
  const displayHolidayDates = readText(displayHolidayDatesPath);
  const displayScore = readText(displayScorePath);
  const displayRealtime = readText(displayRealtimePath);
  const displayPetCatalog = readText(displayPetCatalogPath);
  const extraModules = extraModulePaths.map((module) => ({
    ...module,
    source: readText(module.path),
  }));

  assertBrowserScriptSyntax(displayRuntimePath, 'scripts/display-runtime.js');
  assertBrowserScriptSyntax(displayUiPath, 'scripts/display-ui.js');
  assertBrowserScriptSyntax(displayAuthPath, 'scripts/display-auth.js');
  assertBrowserScriptSyntax(displayHolidayDatesPath, 'scripts/display-holiday-dates.js');
  assertBrowserScriptSyntax(displayScorePath, 'scripts/display-score.js');
  assertBrowserScriptSyntax(displayRealtimePath, 'scripts/display-realtime.js');
  assertBrowserScriptSyntax(displayPetCatalogPath, 'scripts/display-pet-catalog.js');
  extraModulePaths.forEach((module) => {
    assertBrowserScriptSyntax(module.path, `scripts/${module.file}`);
  });
  assertBrowserScriptSyntax(displayScriptPath, 'scripts/display-app.js');
  assertBrowserScriptSyntax(petColorsPath, 'scripts/pet-colors.js');
  assertHtmlAssetRefs(displayRoot, displayHtml);
  assertScriptLoadOrder(displayHtml);
  assertDisplayBridgeScriptOrder(displayHtml);
  assertDisplayCssOrder(displayHtml);
  assertRuntimeApiContract(displayRuntime);
  assertDisplayUiContract(displayUi);
  assertDisplayAuthContract(displayAuth);
  assertNamedApiContract(
    displayHolidayDates,
    REQUIRED_HOLIDAY_DATES_API,
    'DisplayHolidayDates',
  );
  assertDisplayScoreContract(displayScore);
  assertDisplayRealtimeContract(displayRealtime);
  assertDisplayPetCatalogContract(displayPetCatalog);
  extraModules.forEach((module) => {
    assertNamedApiContract(module.source, module.api, module.label);
  });
  assertDisplayRuntimeDelegates(displayScript);
  assertDisplayUiDelegates(displayScript);
  assertDisplayAuthDelegates(displayScript);
  assertDisplayScoreDelegates(displayScript);
  assertDisplayPetCatalogDelegates(displayScript);
  assertApiFetchUsesRuntime(displayScript);
  assertNavigateUsesDisplayUi(displayScript);
  assertLockOverlayUsesBridges(displayScript);
  assertLoginSetupUsesBridges(displayScript);
  assertUnlockLockUsesAuthBridge(displayScript);
  assertRealtimeUsesBridge(displayScript);
  assertScoreQueuesUseBridge(displayScript);
  assertNoUnexpectedDuplicateGlobalFunctions(displayScript);
  assertInlineHandlersHaveGlobals(displayHtml, displayScript);

  const metrics = collectDisplayPublicMetrics({ root });
  if (!silent) {
    console.log(
      [
        '[display-public-guard] ok',
        `html=${metrics.htmlLines}行`,
        `runtime=${metrics.runtimeLines}行`,
        `ui=${metrics.uiLines}行`,
        `auth=${metrics.authLines}行`,
        `holiday=${metrics.holidayDatesLines}行`,
        `score=${metrics.scoreLines}行`,
        `realtime=${metrics.realtimeLines}行`,
        `petCatalog=${metrics.petCatalogLines}行`,
        ...Object.entries(metrics.extraModuleLines).map(
          ([label, lines]) => `${label.replace(/^Display/, '')}=${lines}行`,
        ),
        `js=${metrics.scriptLines}行`,
        `css=${metrics.cssLines}行`,
        `classroomBaseCss=${metrics.classroomBaseCssLines}行`,
        `holidayCss=${metrics.holidayCssLines}行`,
        `classroomShellCss=${metrics.classroomShellCssLines}行`,
        `studentCardCss=${metrics.studentCardCssLines}行`,
        `modalCoreCss=${metrics.modalCoreCssLines}行`,
        `sidebarCss=${metrics.sidebarCssLines}行`,
        `classroomEffectsCss=${metrics.classroomEffectsCssLines}行`,
        `performanceCss=${metrics.performanceCssLines}行`,
        `entryTransitionCss=${metrics.entryTransitionCssLines}行`,
        `honorCss=${metrics.honorCssLines}行`,
        `setupLoginCss=${metrics.setupLoginCssLines}行`,
        `petProfileCss=${metrics.petProfileCssLines}行`,
        `petPkCss=${metrics.petPkCssLines}行`,
        `groupCss=${metrics.groupCssLines}行`,
        `adoptCss=${metrics.adoptCssLines}行`,
        `academicCss=${metrics.academicCssLines}行`,
        `exchangeCss=${metrics.exchangeCssLines}行`,
        `leaderboardCss=${metrics.leaderboardCssLines}行`,
        `pointModalCss=${metrics.pointModalCssLines}行`,
        `classroomSettingsCss=${metrics.classroomSettingsCssLines}行`,
        `toolboxCss=${metrics.toolboxCssLines}行`,
        `petFullviewCss=${metrics.petFullviewCssLines}行`,
        `onclick=${metrics.inlineOnclickCount}`,
        `functions=${metrics.scriptFunctionCount}`,
        `storage=${metrics.scriptStorageAccessCount}`,
      ].join(' '),
    );
  }
  return metrics;
}
