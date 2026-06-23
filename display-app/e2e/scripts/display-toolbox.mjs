import path from "node:path";
import { pathToFileURL } from "node:url";
import { createBrowserPage, createLogger, printResult, saveScreenshot } from "./common.mjs";

const result = {
  suite: "display-toolbox",
  checks: [],
  screenshots: {},
};

const log = createLogger(result);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const { browser, page } = await createBrowserPage();
  try {
    await page.addInitScript(() => {
      window.__DISPLAY_DEMO_MODE__ = true;
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new Error("mock microphone denied");
          },
        },
      });
    });

    const displayPath = path.resolve(
      process.cwd(),
      "../web/public/display/display.html",
    );
    await page.goto(pathToFileURL(displayPath).href, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.evaluate(() => {
      window.__mindfulnessCues = [];
      if (window.DisplayAudio?.playMindfulnessCue && !window.__mindfulnessCueWrapped) {
        const originalPlayMindfulnessCue = window.DisplayAudio.playMindfulnessCue;
        window.DisplayAudio.playMindfulnessCue = function wrappedPlayMindfulnessCue(type, helpers) {
          window.__mindfulnessCues.push({
            type: type || "phase",
            at: Math.round(performance.now()),
          });
          return originalPlayMindfulnessCue.call(this, type, helpers);
        };
        window.__mindfulnessCueWrapped = true;
      }
      runtimeState.groups = [
        { groupNo: 1, name: "晨星小组" },
        { groupNo: 2, name: "森林小组" },
      ];
      students.slice(0, 4).forEach((student) => {
        student.group = 1;
        student.groupName = "晨星小组";
      });
      students.slice(4, 8).forEach((student) => {
        student.group = 2;
        student.groupName = "森林小组";
      });
      navigateTo("toolbox");
    });
    await page.waitForFunction(
      () => document.querySelector("#page-toolbox")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    log("教室工具箱页面可从本地 Display 页面打开");

    result.homeCards = await page.evaluate(() =>
      [...document.querySelectorAll("[data-toolbox-card]")].map((card) => ({
        tool: card.dataset.toolboxCard,
        title: card.querySelector("strong")?.textContent,
        cta: card.querySelector("b")?.textContent,
      })),
    );
    assert(result.homeCards.length === 6, "首页应渲染六张课堂情绪入口卡");
    assert(result.homeCards.some((card) => card.tool === "breath"), "首页应包含呼吸练习入口");
    assert(result.homeCards.some((card) => card.tool === "meditation"), "首页应包含静心冥想入口");
    assert(result.homeCards.every((card) => card.cta), "每张入口卡都应有明确行动提示");
    await page.waitForTimeout(1200);
    result.screenshots.home = await saveScreenshot(page, "display-toolbox-home.png");
    log("六张大卡入口渲染正确");

    await page.evaluate(() => enterToolboxTool("energy"));
    await page.waitForFunction(
      () =>
        document.querySelector("#toolboxImmersive")?.classList.contains("active") &&
        document.querySelector("[data-toolbox-scene='energy']")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    result.energyInitial = await page.evaluate(() => ({
      primary: document.querySelector("#toolboxPrimaryBtn")?.textContent?.trim(),
      secondary: document.querySelector("#toolboxResetBtn")?.textContent?.trim(),
      completion: document.querySelector("#toolboxEnergyScore")?.textContent?.trim(),
      db: document.querySelector("#toolboxEnergyDb")?.textContent?.trim(),
      time: document.querySelector("#toolboxEnergyTime")?.textContent?.trim(),
      runningChrome: document.querySelector("#page-toolbox")?.classList.contains("toolbox-audio-running"),
    }));
    assert(result.energyInitial.primary === "开始点亮", "点燃课堂进入后应先展示开始按钮");
    assert(result.energyInitial.secondary === "结束", "点燃课堂应提供结束按钮");
    assert(result.energyInitial.completion === "0%", "声浪完成度初始应为 0%");
    assert(result.energyInitial.db === "-- dB", "声浪应预留实时分贝显示");
    assert(result.energyInitial.time === "不限时", "声浪默认应不限时");
    assert(!result.energyInitial.runningChrome, "点燃课堂未开始前不应隐藏顶部控件");
    await page.evaluate(() => runToolboxPrimaryAction());
    await page.waitForFunction(
      () => document.querySelector("#toolboxEnergyResult")?.classList.contains("error"),
      null,
      { timeout: 5000 },
    );
    result.energyDenied = await page.textContent("#toolboxEnergyResult");
    assert(
      result.energyDenied.includes("mock microphone denied") ||
        result.energyDenied.includes("麦克风权限") ||
        result.energyDenied.includes("麦克风"),
      "声浪活力应处理麦克风拒绝",
    );
    result.screenshots.energy = await saveScreenshot(page, "display-toolbox-energy.png");
    log("声浪活力进入沉浸页并处理麦克风拒绝");

    await page.evaluate(() => enterToolboxTool("garden"));
    await page.waitForFunction(
      () =>
        document.querySelector("#toolboxImmersive")?.classList.contains("active") &&
        document.querySelector("[data-toolbox-scene='garden']")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    result.gardenInitial = await page.evaluate(() => ({
      primary: document.querySelector("#toolboxPrimaryBtn")?.textContent?.trim(),
      secondary: document.querySelector("#toolboxResetBtn")?.textContent?.trim(),
      db: document.querySelector("#toolboxGardenDb")?.textContent?.trim(),
    }));
    assert(result.gardenInitial.primary === "开始守护", "安静下来进入后应先展示开始按钮");
    assert(result.gardenInitial.secondary === "结束", "安静下来应提供结束按钮");
    assert(result.gardenInitial.db === "-- dB", "安静下来应预留艺术化分贝显示");
    await page.evaluate(() => runToolboxPrimaryAction());
    await page.waitForFunction(
      () => document.querySelector("#toolboxGardenResult")?.classList.contains("error"),
      null,
      { timeout: 5000 },
    );
    result.screenshots.garden = await saveScreenshot(page, "display-toolbox-garden.png");
    log("安静花园进入沉浸页并处理麦克风拒绝");

    await page.evaluate(() => enterToolboxTool("breath"));
    await page.waitForFunction(
      () =>
        document.querySelector("#toolboxImmersive")?.classList.contains("active") &&
        document.querySelector("[data-toolbox-scene='breath']")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    result.breathInitial = await page.evaluate(() => ({
      primary: document.querySelector("#toolboxPrimaryBtn")?.textContent?.trim(),
      secondary: document.querySelector("#toolboxResetBtn")?.textContent?.trim(),
      phase: document.querySelector("#toolboxBreathPhase")?.textContent?.trim(),
      time: document.querySelector("#toolboxBreathTime")?.textContent?.trim(),
      hasCycleLabel: Boolean(document.querySelector("#toolboxBreathCycle")),
      presetTexts: [...document.querySelectorAll(".breath-presets button")].map((button) =>
        button.textContent?.trim(),
      ),
      bgFilter: getComputedStyle(document.querySelector("#toolboxBg")).filter,
      runningChrome: document.querySelector("#page-toolbox")?.classList.contains("toolbox-breath-running"),
    }));
    assert(result.breathInitial.primary === "开始呼吸", "呼吸练习进入后应先展示开始按钮");
    assert(result.breathInitial.secondary === "返回", "呼吸练习未开始时应提供返回按钮");
    assert(result.breathInitial.phase === "吸气" || result.breathInitial.phase === "准备", "呼吸练习应显示当前阶段");
    assert(result.breathInitial.time === "01:00", "呼吸练习默认时长应为 1 分钟");
    assert(!result.breathInitial.hasCycleLabel, "呼吸练习首页不应再展示吸气呼气秒数文案");
    assert(result.breathInitial.presetTexts.every((text) => !text.includes("秒/轮")), "呼吸练习首页不应再展示秒/轮节奏设置");
    assert(!result.breathInitial.runningChrome, "呼吸练习未开始前不应进入运行沉浸态");
    await page.evaluate(() => runToolboxPrimaryAction());
    await page.waitForFunction(
      () => document.querySelector("#page-toolbox")?.classList.contains("toolbox-breath-running"),
      null,
      { timeout: 3000 },
    );
    await page.waitForFunction(
      () =>
        Array.isArray(window.__mindfulnessCues) &&
        window.__mindfulnessCues.some((cue) => cue.type === "inhale") &&
        window.__mindfulnessCues.some((cue) => cue.type === "exhale"),
      null,
      { timeout: 6500 },
    );
    result.breathRunning = await page.evaluate(() => ({
      primary: document.querySelector("#toolboxPrimaryBtn")?.textContent?.trim(),
      phase: document.querySelector("#toolboxBreathPhase")?.textContent?.trim(),
      rafActive: Boolean(toolboxState().breathRAF),
      bgFilter: getComputedStyle(document.querySelector("#toolboxBg")).filter,
      cues: window.__mindfulnessCues.map((cue) => cue.type),
    }));
    assert(result.breathRunning.primary === "暂停", "呼吸练习开始后主按钮应变为暂停");
    assert(result.breathRunning.rafActive, "呼吸练习开始后应持有 RAF");
    assert(result.breathRunning.bgFilter !== result.breathInitial.bgFilter, "呼吸练习开始后背景滤镜应改变为更暗状态");
    assert(result.breathRunning.cues.includes("inhale"), "呼吸练习开始后应播放吸气提示音");
    assert(result.breathRunning.cues.includes("exhale"), "呼吸练习开始后应播放呼气提示音");
    result.screenshots.breathRunning = await saveScreenshot(page, "display-toolbox-breath-running.png");
    await page.evaluate(() => runToolboxPrimaryAction());
    result.breathPaused = await page.evaluate(() => ({
      primary: document.querySelector("#toolboxPrimaryBtn")?.textContent?.trim(),
      rafActive: Boolean(toolboxState().breathRAF),
      paused: toolboxState().breathPaused,
    }));
    assert(result.breathPaused.primary === "继续", "呼吸练习暂停后主按钮应变为继续");
    assert(result.breathPaused.paused && !result.breathPaused.rafActive, "呼吸练习暂停后应取消 RAF");
    await page.evaluate(() => runToolboxPrimaryAction());
    await page.waitForFunction(() => Boolean(toolboxState().breathRAF), null, { timeout: 3000 });
    await page.evaluate(() => resetActiveToolboxTool());
    result.breathEnded = await page.evaluate(() => ({
      primary: document.querySelector("#toolboxPrimaryBtn")?.textContent?.trim(),
      result: document.querySelector("#toolboxBreathResult")?.textContent?.trim(),
      rafActive: Boolean(toolboxState().breathRAF),
      running: toolboxState().breathRunning || toolboxState().breathPaused,
    }));
    assert(result.breathEnded.primary === "再来一次", "呼吸练习结束后主按钮应支持再次开始");
    assert(result.breathEnded.result.includes("完成"), "呼吸练习结束后应展示完成摘要");
    assert(!result.breathEnded.rafActive && !result.breathEnded.running, "呼吸练习结束后不应残留 RAF 或运行态");
    log("呼吸练习进入、开始、暂停、继续、结束状态正确");

    await page.evaluate(() => enterToolboxTool("meditation"));
    await page.waitForFunction(
      () =>
        document.querySelector("#toolboxImmersive")?.classList.contains("active") &&
        document.querySelector("[data-toolbox-scene='meditation']")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    result.meditationInitial = await page.evaluate(() => ({
      primary: document.querySelector("#toolboxPrimaryBtn")?.textContent?.trim(),
      secondary: document.querySelector("#toolboxResetBtn")?.textContent?.trim(),
      time: document.querySelector("#toolboxMeditationTime")?.textContent?.trim(),
      status: document.querySelector("#toolboxMeditationStatus")?.textContent?.trim(),
    }));
    assert(result.meditationInitial.primary === "开始冥想", "静心冥想进入后应先展示开始按钮");
    assert(result.meditationInitial.secondary === "返回", "静心冥想未开始时应提供返回按钮");
    assert(result.meditationInitial.time === "02:00", "静心冥想默认时长应为 2 分钟");
    await page.evaluate(() => runToolboxPrimaryAction());
    await page.waitForFunction(
      () => document.querySelector("#page-toolbox")?.classList.contains("toolbox-meditation-running"),
      null,
      { timeout: 3000 },
    );
    result.meditationRunning = await page.evaluate(() => ({
      primary: document.querySelector("#toolboxPrimaryBtn")?.textContent?.trim(),
      rafActive: Boolean(toolboxState().meditationRAF),
    }));
    assert(result.meditationRunning.primary === "暂停", "静心冥想开始后主按钮应变为暂停");
    assert(result.meditationRunning.rafActive, "静心冥想开始后应持有 RAF");
    result.screenshots.meditationRunning = await saveScreenshot(page, "display-toolbox-meditation-running.png");
    await page.evaluate(() => runToolboxPrimaryAction());
    result.meditationPaused = await page.evaluate(() => ({
      primary: document.querySelector("#toolboxPrimaryBtn")?.textContent?.trim(),
      rafActive: Boolean(toolboxState().meditationRAF),
      paused: toolboxState().meditationPaused,
    }));
    assert(result.meditationPaused.primary === "继续", "静心冥想暂停后主按钮应变为继续");
    assert(result.meditationPaused.paused && !result.meditationPaused.rafActive, "静心冥想暂停后应取消 RAF");
    await page.evaluate(() => runToolboxPrimaryAction());
    await page.waitForFunction(() => Boolean(toolboxState().meditationRAF), null, { timeout: 3000 });
    await page.evaluate(() => resetActiveToolboxTool());
    result.meditationEnded = await page.evaluate(() => ({
      primary: document.querySelector("#toolboxPrimaryBtn")?.textContent?.trim(),
      result: document.querySelector("#toolboxMeditationResult")?.textContent?.trim(),
      rafActive: Boolean(toolboxState().meditationRAF),
      running: toolboxState().meditationRunning || toolboxState().meditationPaused,
    }));
    assert(result.meditationEnded.primary === "开始冥想", "静心冥想结束后主按钮应回到开始");
    assert(result.meditationEnded.result.includes("完成"), "静心冥想结束后应展示完成摘要");
    assert(!result.meditationEnded.rafActive && !result.meditationEnded.running, "静心冥想结束后不应残留 RAF 或运行态");
    log("静心冥想进入、开始、暂停、继续、结束状态正确");

    result.settingsScopes = await page.evaluate(() => {
      const collect = (tool) => {
        enterToolboxTool(tool, { silent: true });
        openToolboxSettings();
        const overlay = document.querySelector("#toolboxSettingsOverlay");
        const visible = [...document.querySelectorAll(".toolbox-setting-field")]
          .filter((item) => getComputedStyle(item).display !== "none")
          .map((item) => item.textContent.trim().replace(/\s+/g, " "));
        closeToolboxSettings();
        return { tool: overlay?.dataset.tool, visible };
      };
      return {
        energy: collect("energy"),
        garden: collect("garden"),
        breath: collect("breath"),
        meditation: collect("meditation"),
        lucky: collect("lucky"),
        timer: collect("timer"),
      };
    });
    assert(
      result.settingsScopes.energy.visible.every((label) => label.includes("声浪") || label.includes("限时")),
      "点燃课堂设置只应显示声浪和可选限时字段",
    );
    assert(result.settingsScopes.garden.visible.every((label) => label.includes("安静") || label.includes("嘈杂")), "安静下来设置只应显示花园字段");
    assert(result.settingsScopes.breath.visible.every((label) => label.includes("呼吸")), "呼吸练习设置只应显示呼吸字段");
    assert(result.settingsScopes.breath.visible.every((label) => !label.includes("节奏") && !label.includes("一轮")), "呼吸练习设置不应再显示节奏秒/轮字段");
    assert(result.settingsScopes.meditation.visible.every((label) => label.includes("冥想") || label.includes("静心")), "静心冥想设置只应显示冥想字段");
    assert(result.settingsScopes.lucky.visible.some((label) => label.includes("抽选")), "随机抽选设置应显示抽选字段");
    assert(result.settingsScopes.timer.visible.every((label) => label.includes("自定义")), "计时器设置只应显示计时字段");
    log("六个工具的高级设置按当前工具隔离显示");

    result.runningChrome = await page.evaluate(() => {
      enterToolboxTool("energy", { silent: true });
      const state = toolboxState();
      state.energyRunning = true;
      state.paused = false;
      syncToolboxPrimaryButton();
      renderEnergyToolbox();
      const top = getComputedStyle(document.querySelector(".toolbox-immersive-top"));
      const copy = getComputedStyle(document.querySelector("[data-toolbox-scene='energy'] .toolbox-live-copy"));
      return {
        primary: document.querySelector("#toolboxPrimaryBtn")?.textContent?.trim(),
        secondary: document.querySelector("#toolboxResetBtn")?.textContent?.trim(),
        hasRunningClass: document.querySelector("#page-toolbox")?.classList.contains("toolbox-audio-running"),
        topOpacity: top.opacity,
        copyOpacity: copy.opacity,
      };
    });
    assert(result.runningChrome.primary === "暂停", "点燃课堂运行后底部主按钮应变为暂停");
    assert(result.runningChrome.secondary === "结束", "点燃课堂运行后底部次按钮应为结束");
    assert(result.runningChrome.hasRunningClass, "点燃课堂运行后页面应进入沉浸运行态");
    assert(result.runningChrome.topOpacity === "0", "点燃课堂运行后应隐藏顶部标题和设置");
    assert(result.runningChrome.copyOpacity === "0", "点燃课堂运行后应隐藏说明面板");
    await page.evaluate(() => {
      const state = toolboxState();
      state.energyRunning = false;
      state.paused = false;
      syncToolboxPrimaryButton();
    });
    log("点燃课堂运行态只保留底部暂停/结束控件");

    await page.evaluate(() => {
      enterToolboxTool("lucky", { silent: true });
      setLuckyScope("class");
      drawLuckyStudent();
    });
    await page.waitForFunction(
      () => document.querySelector("#toolboxLuckyWheel")?.classList.contains("rolling"),
      null,
      { timeout: 2000 },
    );
    result.screenshots.luckyRolling = await saveScreenshot(page, "display-toolbox-lucky-rolling.png");
    await page.evaluate(() => stopLuckyDrawWithWinner());
    await page.waitForFunction(
      () =>
        !document.querySelector("#toolboxLuckyWheel")?.classList.contains("rolling") &&
        document.querySelector("#toolboxLuckyName")?.textContent !== "准备抽选",
      null,
      { timeout: 7000 },
    );
    result.lucky = await page.evaluate(() => ({
      name:
        document.querySelector("#toolboxLuckyName")?.textContent?.trim() ||
        document.querySelector("#toolboxLuckyCenterCard b")?.textContent?.trim(),
      meta: document.querySelector("#toolboxLuckyMeta")?.textContent?.trim(),
      historyCount: document.querySelectorAll("#toolboxLuckyHistory button").length,
      rollCards: document.querySelectorAll("#toolboxLuckyTrack .lucky-roll-card").length,
    }));
    assert(result.lucky.historyCount === 1, "抽选结束后应新增历史记录");
    assert(result.lucky.rollCards >= 12, "抽选过程中应渲染头像翻滚卡片");
    result.screenshots.lucky = await saveScreenshot(page, "display-toolbox-lucky-winner.png");
    log(`随机抽选翻滚并定格中奖学生：${result.lucky.name}`);

    await page.evaluate(() => {
      enterToolboxTool("timer", { silent: true });
      setToolboxTimerPreset(1);
      startToolboxTimer();
    });
    await page.waitForFunction(
      () => /\d{2}:\d{2}/.test(document.querySelector("#toolboxTimerDisplay")?.textContent || ""),
      null,
      { timeout: 3000 },
    );
    result.timerRunning = await page.evaluate(() => ({
      display: document.querySelector("#toolboxTimerDisplay")?.textContent?.trim(),
      running: toolboxState().timerRunning,
    }));
    assert(/\d{2}:\d{2}/.test(result.timerRunning.display), "计时器运行时应显示倒计时");
    assert(result.timerRunning.running, "计时器启动后应进入运行态");
    result.screenshots.timerRunning = await saveScreenshot(page, "display-toolbox-timer-running.png");
    await page.waitForFunction(
      () =>
        document.querySelector("#toolboxTimerDisplay")?.textContent?.trim() === "00:00" &&
        toolboxState().timerFinishedAlerting === true,
      null,
      { timeout: 5000 },
    );
    result.timerDone = await page.evaluate(() => ({
      display: document.querySelector("#toolboxTimerDisplay")?.textContent?.trim(),
      finishedAlerting: toolboxState().timerFinishedAlerting,
    }));
    assert(result.timerDone.display === "00:00", "计时结束后应显示 00:00");
    result.screenshots.timerDone = await saveScreenshot(page, "display-toolbox-timer-done.png");
    log("课堂计时器毫秒显示与结束状态正确");

    await page.evaluate(() => exitToolboxImmersive());
    await page.waitForFunction(
      () =>
        document.querySelector("#toolboxHome")?.classList.contains("active") &&
        !document.querySelector("#toolboxImmersive")?.classList.contains("active"),
      null,
      { timeout: 5000 },
    );
    log("沉浸页可退出并回到工具箱首页");
  } finally {
    await browser.close();
  }

  printResult("DISPLAY_TOOLBOX_RESULT", result);
}

run().catch((error) => {
  console.error("DISPLAY_TOOLBOX_FAILED", error);
  process.exitCode = 1;
});
