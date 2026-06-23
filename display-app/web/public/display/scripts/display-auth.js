(function initDisplayAuth(global) {
  const DISPLAY_ADMIN_ROLES = [
    "super_admin",
    "school_admin",
    "academic_admin",
    "moral_admin",
  ];
  const DISPLAY_TERMINAL_INIT_ROLES = [
    ...DISPLAY_ADMIN_ROLES,
    "homeroom_teacher",
  ];
  const HOMEROOM_ASSIGNMENT_ROLES = ["homeroom", "co_homeroom"];

  function isDisplayAdminRole(roleCode) {
    return DISPLAY_ADMIN_ROLES.includes(roleCode || "");
  }

  function canInitializeDisplayTerminalRole(roleCode) {
    return DISPLAY_TERMINAL_INIT_ROLES.includes(roleCode || "");
  }

  function canOverrideClassDisplayBinding(roleCode) {
    return roleCode === "super_admin";
  }

  function getClassScopeIds(scopes = [], classAssignments = []) {
    const scopeIds = scopes
      .filter((scope) => scope && scope.classId)
      .map((scope) => Number(scope.classId));
    const assignmentIds = classAssignments
      .filter((assignment) => assignment && assignment.classId)
      .map((assignment) => Number(assignment.classId));
    return Array.from(new Set([...scopeIds, ...assignmentIds])).filter(Boolean);
  }

  function canAccessClass(context = {}) {
    if (isDisplayAdminRole(context.roleCode)) {
      return true;
    }
    return getClassScopeIds(
      context.scopes || [],
      context.classAssignments || [],
    ).includes(Number(context.classId));
  }

  function isHomeroomOfClass(context = {}) {
    if (isDisplayAdminRole(context.roleCode)) return true;
    const classId = Number(context.classId);
    if (!classId || !context.user) return false;
    return (context.classAssignments || []).some(
      (assignment) =>
        Number(assignment.classId) === classId &&
        HOMEROOM_ASSIGNMENT_ROLES.includes(
          String(assignment.roleInClass || ""),
        ),
    );
  }

  function canAdoptPet(context = {}) {
    return Boolean(
      context.user &&
        context.token &&
        context.classId &&
        canAccessClass(context),
    );
  }

  function shouldAutoRenewUnlock(context = {}) {
    const method = String(context.method || "GET").toUpperCase();
    if (method === "GET" || method === "HEAD") return false;
    if (!context.token || !context.user || !context.classId) return false;
    if (context.lockStatus !== "active") return false;
    if (
      context.path === "/auth/login" ||
      context.path === "/display/unlock" ||
      context.path === "/display/unlock-renew" ||
      context.path === "/display/lock"
    ) {
      return false;
    }
    return true;
  }

  function shouldRenewUnlockSoon(context = {}) {
    const force = context.force === true;
    const thresholdMs = context.thresholdMs ?? 5 * 60 * 1000;
    if (force) return true;
    if (!context.unlockedUntil) return true;
    const unlockedUntilTs = new Date(context.unlockedUntil).getTime();
    if (!Number.isFinite(unlockedUntilTs)) return true;
    return unlockedUntilTs - (context.now || Date.now()) <= thresholdMs;
  }

  function getOperationLockedAlertCopy(featureName) {
    return {
      badge: "操作已锁定",
      title: "教师操作已锁定",
      description: featureName
        ? `当前展示端处于锁定状态，暂无法${featureName}。\n请先重新登录并解锁操作权限后再继续。`
        : "当前展示端处于锁定状态。请先重新登录并解锁操作权限后再继续。",
    };
  }

  function getHomeroomOnlyAlertCopy(featureName) {
    const featureHints = {
      分组管理: "学生分组属于班级基础设置，通常由班主任统一安排。",
      更换装扮:
        "更换装扮会消耗积分并写入学生成长档案，通常由班主任统一引导完成。",
      萌宠改名: "萌宠改名会写入学生成长档案，通常由班主任统一引导完成。",
    };
    const featureHint =
      featureHints[featureName] ||
      "这项操作属于班级成长档案设置，通常由班主任负责。";
    return {
      login: {
        badge: "需要班主任登录",
        title: "这项操作需班主任登录后完成",
        description: `${featureHint}\n请先请本班班主任登录展示端，再继续${featureName}。`,
      },
      restricted: {
        badge: "班主任专属操作",
        title: "这项操作暂由班主任负责",
        description: `${featureHint}\n您仍可正常使用课堂加减分等功能；如需${featureName}，请联系本班班主任协助处理。`,
      },
    };
  }

  function formatDateTime(value) {
    return new Date(value).toLocaleString("zh-CN");
  }

  function formatTime(value) {
    return new Date(value).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function createLockOverlayViewModel(context = {}) {
    const metaLines = [
      `当前终端：${context.terminalCode || ""}`,
      `当前班级：${context.className || (context.classId ? `班级 ${context.classId}` : "未绑定")}`,
    ];
    const shouldShow = Boolean(
      context.lockOverlayForced &&
        ["page-classroom", "page-exchange", "page-leaderboard"].includes(
          context.activePageId,
        ),
    );

    if (!context.user) {
      if (context.lastLockedAt) {
        metaLines.push(`锁定时间：${formatDateTime(context.lastLockedAt)}`);
      }
      return {
        shouldShow,
        metaLines,
        badge: "操作已锁定",
        title: "教师操作已锁定",
        description:
          "当前为展示状态。若需加减分、兑换或执行其他教师操作，请重新登录后解锁操作权限；学生可继续更换萌宠装扮和昵称。",
        primaryText: "去解锁",
        secondaryText: "我知道了",
        opTitle: "操作已锁定",
        opSubtitle: "学生可继续查看展示内容并更换萌宠装扮，教师操作需重新登录",
        opPrimaryText: "去解锁",
        opSecondaryText: "我知道了",
        topActionUnlocked: false,
        topActionIcon: "fa-solid fa-lock-open",
      };
    }

    if (context.lockStatus === "active") {
      if (context.unlockedUntil) {
        metaLines.push(`操作截止：${formatDateTime(context.unlockedUntil)}`);
      }
      return {
        shouldShow,
        metaLines,
        badge: "操作已解锁",
        title: `当前教师：${context.user.name}`,
        description:
          "当前展示端处于 15 分钟可操作状态。您可以继续课堂加减分、积分兑换或主动锁定终端。",
        primaryText: "继续操作",
        secondaryText: "立即锁定",
        opTitle: `教师操作中：${context.user.name}`,
        opSubtitle: context.unlockedUntil
          ? `可操作至 ${formatTime(context.unlockedUntil)}`
          : "当前可进行加减分与兑换",
        opPrimaryText: "继续操作",
        opSecondaryText: "立即锁定",
        topActionUnlocked: true,
        topActionIcon: "fa-solid fa-lock",
      };
    }

    if (context.lastLockedAt || context.unlockedUntil) {
      metaLines.push(
        `锁定时间：${formatDateTime(context.lastLockedAt || context.unlockedUntil)}`,
      );
    }
    return {
      shouldShow,
      metaLines,
      badge: "操作已锁定",
      title: "教师操作已锁定",
      description:
        "当前为展示状态。若需继续加减分、兑换或执行其他教师操作，请重新登录后解锁操作权限；学生可继续更换萌宠装扮和昵称。",
      primaryText: "去解锁",
      secondaryText: "我知道了",
      opTitle: "操作已锁定",
      opSubtitle: "展示继续可见，学生装扮与昵称自助操作不受锁定影响",
      opPrimaryText: "去解锁",
      opSecondaryText: "我知道了",
      topActionUnlocked: false,
      topActionIcon: "fa-solid fa-lock-open",
    };
  }

  function getSetupModeTextMap(setupMode = "initialize") {
    const isRebind = setupMode === "rebind";
    return {
      isRebind,
      brandTitle: isRebind ? "重新绑定展示终端" : "启用班级展示终端",
      brandCopy: isRebind
        ? "如需更换当前终端绑定的班级，请由班主任或学校管理账号重新授权并完成改绑。完成后，终端将默认进入新的班级展示空间。"
        : "本终端完成初始化后，将自动进入对应班级的展示空间。以后学生可随时查看积分和萌宠成长，教师在需要时解锁操作即可。",
      welcomeTitle: isRebind
        ? "重新绑定当前展示终端"
        : "欢迎启用育英星宠展示终端",
      welcomeDesc: isRebind
        ? "这一过程会保留当前终端编号，并重新由班主任或学校管理账号授权选择新的绑定班级。改绑完成后，系统会返回首页。"
        : "这一过程仅需几步：识别当前终端、完成账号授权，并将本终端绑定到指定班级。绑定完成后，系统会自动进入该班的展示主页。",
      welcomeAction: isRebind ? "开始重新绑定" : "开始初始化",
      authTitle: isRebind ? "请由班主任或管理员确认改绑" : "请由班主任或管理员完成授权",
      authDesc: isRebind
        ? "为保证终端绑定安全，重新绑定班级也需要由班主任及以上账号完成授权。授权成功后，即可继续选择新的班级。"
        : "为保证终端绑定安全，班主任及以上账号可完成首次启用和后续改绑。授权成功后，即可继续选择本终端要绑定的班级。",
      bindTitle: isRebind ? "选择新的默认展示班级" : "选择本终端要进入的班级",
      bindDesc: isRebind
        ? "请先筛选年级，再勾选要绑定的班级。确认后，当前终端会切换为新班级的大屏展示端。"
        : "请先筛选年级，再勾选要绑定的班级。绑定成功后，这块大屏默认会进入对应班级的展示页，后续也可再次改绑。",
      bindAction: isRebind ? "确认重新绑定" : "确认绑定并启用终端",
      successTitle: isRebind ? "终端重新绑定完成" : "终端初始化完成",
    };
  }

  function getClassBindingsByClassId(classBindings = [], classId) {
    return classBindings.filter((item) => Number(item.classId) === Number(classId));
  }

  function isSetupClassSelectable(context = {}) {
    const bindings = getClassBindingsByClassId(
      context.classBindings || [],
      context.classId,
    );
    if (bindings.length === 0) return true;
    if (bindings.some((binding) => binding.terminalCode === context.terminalCode)) return true;
    if (bindings.length < 2) return true;
    return canOverrideClassDisplayBinding(context.roleCode);
  }

  function getSetupClassBindingHint(context = {}) {
    const others = getClassBindingsByClassId(
      context.classBindings || [],
      context.classId,
    ).filter((binding) => binding.terminalCode !== context.terminalCode);
    if (others.length === 0) return "";
    const labels = others.map((binding) => binding.terminalName || binding.terminalCode);
    if (others.length >= 2 && !canOverrideClassDisplayBinding(context.roleCode)) {
      return `已绑定终端：${labels.join("、")}（已达上限）`;
    }
    if (others.length >= 2 && canOverrideClassDisplayBinding(context.roleCode)) {
      return `已绑定终端：${labels.join("、")}（管理员可强制绑定）`;
    }
    return `已绑定终端：${labels.join("、")}`;
  }

  function normalizeGradeName(row) {
    return String(row?.gradeName || "未设置年级").trim() || "未设置年级";
  }

  function getSetupGradeNames(classes = []) {
    const seen = new Set();
    return classes
      .map((row) => normalizeGradeName(row))
      .filter((gradeName) => {
        if (seen.has(gradeName)) return false;
        seen.add(gradeName);
        return true;
      });
  }

  function getFilteredSetupClasses(classes = [], selectedGradeName = "") {
    if (!selectedGradeName) return [];
    return classes.filter((row) => normalizeGradeName(row) === selectedGradeName);
  }

  function createDisplayTerminalPayload(context = {}) {
    return {
      classId: context.classId,
      displayTerminalCode: context.terminalCode,
    };
  }

  function createActiveUnlockPatch(result = {}, now = Date.now()) {
    return {
      lastUnlockRenewAt: now,
      lockStatus: "active",
      unlockSessionId: result.unlockSessionId || null,
      unlockedUntil: result.expiredAt || null,
      lastLockedAt: null,
      lockOverlayForced: false,
    };
  }

  function createLockedPatch(options = {}) {
    return {
      lockStatus: "locked",
      unlockSessionId: options.unlockSessionId || null,
      unlockedUntil: options.unlockedUntil || options.expiredAt || null,
      lastUnlockRenewAt: 0,
      lastLockedAt: options.lockedAt || options.expiredAt || null,
      lockOverlayForced: options.forceOverlay ?? false,
    };
  }

  global.DisplayAuth = {
    isDisplayAdminRole,
    canInitializeDisplayTerminalRole,
    canOverrideClassDisplayBinding,
    getClassScopeIds,
    canAccessClass,
    isHomeroomOfClass,
    canAdoptPet,
    shouldAutoRenewUnlock,
    shouldRenewUnlockSoon,
    getOperationLockedAlertCopy,
    getHomeroomOnlyAlertCopy,
    createLockOverlayViewModel,
    getSetupModeTextMap,
    getClassBindingsByClassId,
    isSetupClassSelectable,
    getSetupClassBindingHint,
    normalizeGradeName,
    getSetupGradeNames,
    getFilteredSetupClasses,
    createDisplayTerminalPayload,
    createActiveUnlockPatch,
    createLockedPatch,
  };
})(window);
