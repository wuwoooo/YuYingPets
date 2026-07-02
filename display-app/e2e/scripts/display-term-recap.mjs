import path from "node:path";
import { pathToFileURL } from "node:url";
import { createBrowserPage, createLogger, printResult, saveScreenshot } from "./common.mjs";

const result = {
  suite: "display-score-race",
  checks: [],
  screenshots: {},
};

const log = createLogger(result);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function dayCoverage(records = []) {
  const byDay = new Map();
  records.forEach((record) => {
    const date = new Date(record.occurredAt || record.createdAt);
    const key = `${date.getMonth() + 1}-${date.getDate()}`;
    byDay.set(key, (byDay.get(key) || 0) + 1);
  });
  const counts = Array.from(byDay.values());
  return {
    dayCount: byDay.size,
    minRecordsPerDay: counts.length ? Math.min(...counts) : 0,
    maxRecordsPerDay: counts.length ? Math.max(...counts) : 0,
  };
}

async function run() {
  const { browser, page } = await createBrowserPage();
  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.addInitScript(() => {
      window.__DISPLAY_DEMO_MODE__ = true;
      window.__TERM_RECAP_TEST_FAST__ = true;
    });

    const displayPath = path.resolve(process.cwd(), "../web/public/display/display.html");
    await page.goto(pathToFileURL(displayPath).href, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.addStyleTag({ content: ".display-realtime-status{display:none!important}" });

    result.entry = await page.evaluate(() => ({
      entryText: document.querySelector(".term-entry-card")?.textContent || "",
      tabText: document.querySelector("[data-target='scoreRace']")?.textContent?.trim() || "",
      hasLegacyVisibleCopy: document.body.innerText.includes("期末篇") || document.body.innerText.includes("期末总结"),
    }));
    assert(result.entry.entryText.includes("积分竞速"), "首页入口应显示积分竞速");
    assert(result.entry.tabText === "积分竞速", "底部入口应显示积分竞速");
    assert(!result.entry.hasLegacyVisibleCopy, "可见文案不应再出现期末篇或期末总结");

    await page.evaluate(() => navigateTo("scoreRace"));
    await page.waitForFunction(
      () => document.querySelector("#page-term-recap")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    await page.waitForFunction(
      () => document.querySelector("[data-term-scene='race']")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    await page.waitForFunction(
      () => document.querySelector("#page-term-recap h1")?.textContent?.trim() === "积分竞速",
      null,
      { timeout: 10000 },
    );
    await page.waitForFunction(
      () => {
        const title = document.querySelector("#page-term-recap h1");
        if (!title) return false;
        const style = getComputedStyle(title);
        return style.visibility !== "hidden" && style.display !== "none";
      },
      null,
      { timeout: 10000 },
    );
    log("积分竞速入口可达，进入后直接显示竞速主幕");

    result.initial = await page.evaluate(() => ({
      title: document.querySelector("#page-term-recap h1")?.textContent?.trim(),
      titleItems: Array.from(document.querySelectorAll("#page-term-recap h1, #page-term-recap h2, .term-cinema-brand strong, .term-chapter"))
        .map((item) => {
          const style = getComputedStyle(item);
          const rect = item.getBoundingClientRect();
          return {
            text: item.textContent?.trim(),
            display: style.display,
            visibility: style.visibility,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        }),
      visibleTitleCount: Array.from(document.querySelectorAll("#page-term-recap h1, #page-term-recap h2, .term-cinema-brand strong, .term-chapter"))
        .filter((item) => {
          const style = getComputedStyle(item);
          const rect = item.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && item.textContent?.trim();
        }).length,
      classLine: document.querySelector(".term-section-head.compact h2")?.textContent?.trim(),
      subtitle: document.querySelector(".term-section-head.compact p")?.textContent?.trim(),
      statCount: document.querySelectorAll(".term-stat-card").length,
      dotCount: document.querySelectorAll("[data-term-dot]").length,
      actionLabels: Array.from(document.querySelectorAll(".term-cinema-controls button span")).map((item) => item.textContent?.trim()),
      activeScene: document.querySelector("#page-term-recap")?.dataset.termScene,
      openingScenes: document.querySelectorAll("[data-term-scene='opening']").length,
      finaleScenes: document.querySelectorAll("[data-term-scene='finale']").length,
      hasScoreRaceApi: Boolean(window.DisplayScoreRace),
      hasLegacyApi: window.DisplayScoreRace === window.DisplayTermRecap,
      hasRefreshTimer: Boolean(window.DisplayScoreRace?.state?.refreshTimer),
      hasChapter: Boolean(document.querySelector(".term-chapter")),
      hasCinemaBrand: Boolean(document.querySelector(".term-cinema-brand")),
    }));
    assert(result.initial.title === "积分竞速", "页面主标题应为积分竞速");
    assert(result.initial.visibleTitleCount === 1, `竞速页面只应保留一个可见标题：${JSON.stringify(result.initial.titleItems)}`);
    assert(!result.initial.hasChapter && !result.initial.hasCinemaBrand, "不应显示演示数据实时看板或顶部品牌标题");
    assert(result.initial.statCount === 0, "竞速页面不应显示多余统计指标");
    assert(result.initial.dotCount === 1, "积分竞速应为单主幕看板");
    assert(result.initial.activeScene === "race", "进入页面后应直接处于竞速主幕");
    assert(result.initial.openingScenes === 0 && result.initial.finaleScenes === 0, "不应再渲染开场或终幕");
    assert(result.initial.actionLabels.includes("结束") && result.initial.actionLabels.includes("返回"), "应保留结束和返回按钮");
    assert(result.initial.hasScoreRaceApi && result.initial.hasLegacyApi, "应提供 DisplayScoreRace 并兼容 DisplayTermRecap");
    assert(result.initial.hasRefreshTimer, "积分竞速应启动 60 秒自动刷新定时器");

    result.audio = await page.evaluate(async () => {
      const firstAudio = window.DisplayScoreRace?.state?.audio;
      if (firstAudio) firstAudio.currentTime = 18;
      window.replayScoreRace?.();
      await new Promise((resolve) => setTimeout(resolve, 120));
      const secondAudio = window.DisplayScoreRace?.state?.audio;
      return {
        exists: Boolean(secondAudio),
        sameInstance: firstAudio === secondAudio,
        src: secondAudio?.src || "",
        currentTime: secondAudio?.currentTime || 0,
      };
    });
    assert(result.audio.exists, "积分竞速应创建音乐播放器");
    assert(result.audio.sameInstance, "重播时应复用同一个音乐实例，避免叠加播放");
    assert(result.audio.src.includes("BreathandLife.mp3"), "应使用 BreathandLife.mp3 作为积分竞速音乐");
    assert(result.audio.currentTime < 1, "重播时音乐应从开头重新开始");

    result.race = await page.evaluate(() => {
      const records = window.DisplayScoreRace?.state?.model?.records || [];
      const byDay = new Map();
      records.forEach((record) => {
        const date = new Date(record.occurredAt || record.createdAt);
        const key = `${date.getMonth() + 1}-${date.getDate()}`;
        byDay.set(key, (byDay.get(key) || 0) + 1);
      });
      const counts = Array.from(byDay.values());
      return {
        hasEcharts: Boolean(window.echarts),
        hasChart: Boolean(window.DisplayScoreRace?.state?.raceChart),
        canvasCount: document.querySelectorAll("[data-race-chart] canvas").length,
        oldGridLines: document.querySelectorAll(".term-race-track-lines, .term-race-line").length,
        leaders: document.querySelectorAll(".term-race-leader").length,
        hasGlowNodes: Boolean(document.querySelector(".term-speed-burst, .term-race-headline-burst, .term-race-chart-shine")),
        hasSprintMarker: Boolean(document.querySelector(".term-race-sprint-marker")),
        frameLabel: document.querySelector("[data-race-frame-label]")?.textContent?.trim(),
        initialValues: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.series?.[0]?.data?.map((item) => item.value) || [],
        leaderNames: Array.from(document.querySelectorAll(".term-race-leader strong")).map((item) => item.textContent?.trim()),
        raceRows: window.DisplayScoreRace?.state?.model?.raceRows?.length || 0,
        frameCount: window.DisplayScoreRace?.state?.model?.raceFrames?.length || 0,
        totalStudents: window.DisplayScoreRace?.state?.model?.summary?.studentCount || 0,
        rangeDayCount: window.DisplayScoreRace?.state?.model?.summary?.rangeDayCount || 0,
        summaryFrameCount: window.DisplayScoreRace?.state?.model?.summary?.frameCount || 0,
        frameStep: window.DisplayScoreRace?.state?.model?.summary?.frameStep || 0,
        frameInterval: window.DisplayScoreRace?.raceFrameInterval?.(window.DisplayScoreRace?.state?.model?.raceFrames?.length || 0, { production: true }),
        dataSource: window.DisplayScoreRace?.state?.model?.dataSource,
        dailyCoverage: {
          dayCount: byDay.size,
          minRecordsPerDay: counts.length ? Math.min(...counts) : 0,
          maxRecordsPerDay: counts.length ? Math.max(...counts) : 0,
        },
        scene: document.querySelector("#page-term-recap")?.dataset.termScene,
      };
    });
    await page.waitForTimeout(2200);
    result.race.afterFrame = await page.evaluate(() => ({
      frameLabel: document.querySelector("[data-race-frame-label]")?.textContent?.trim(),
      leaderNames: Array.from(document.querySelectorAll(".term-race-leader strong")).map((item) => item.textContent?.trim()),
      seriesCount: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.series?.length || 0,
      dataCount: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.series?.[0]?.data?.length || 0,
      topValues: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.series?.[0]?.data?.slice(0, 6).map((item) => item.value) || [],
      hasStableIds: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.series?.[0]?.data?.every((item) => item.id != null) || false,
      realtimeSort: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.series?.[0]?.realtimeSort,
      seriesAnimationDurationUpdate: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.series?.[0]?.animationDurationUpdate,
      seriesAnimationEasingUpdate: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.series?.[0]?.animationEasingUpdate,
      valueAnimation: (() => {
        const label = window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.series?.[0]?.label;
        return Array.isArray(label) ? label[0]?.valueAnimation : label?.valueAnimation;
      })(),
      xAxisMax: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.xAxis?.[0]?.max,
      yAxisMax: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.yAxis?.[0]?.max,
      graphicText: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.graphic?.[0]?.elements?.[0]?.style?.text,
    }));
    assert(result.race.scene === "race", "应处于竞速主幕");
    assert(result.race.hasEcharts && result.race.hasChart, "竞速看板应使用 ECharts 图表实例");
    assert(result.race.canvasCount > 0, "竞速看板应渲染 ECharts canvas");
    assert(result.race.oldGridLines === 0, "竞速看板不应保留旧方格/赛道线背景");
    assert(result.race.totalStudents >= 40, "本地演示应提供足够多的 61班积分数据");
    assert(result.race.dailyCoverage.dayCount >= 30, "61班本地积分数据应覆盖近 30 天");
    assert(result.race.rangeDayCount >= 120, "竞速看板应使用本学期起始日至今的数据范围");
    assert(result.race.initialValues.length >= 30 && result.race.initialValues.every((value) => Number(value) === 0), "积分竞速起点应全员从 0 分开始");
    assert(result.race.frameStep >= 2, "学期跨度较长时应自动抽样，避免每天一帧导致闪帧");
    assert(result.race.frameCount === result.race.summaryFrameCount, "模型摘要应记录实际竞速帧数");
    assert(result.race.frameCount >= 45 && result.race.frameCount <= 111, "竞速看板应按音乐长度控制采样帧数");
    assert(result.race.frameInterval >= 900 && result.race.frameInterval <= 2200, "竞速帧间隔应随时间跨度自适应");
    assert(result.race.raceRows >= 30, "竞速看板应将大量学生数据交给 ECharts 自动竞速排序");
    assert(result.race.leaders === 0, "竞速看板不应显示右上角领先榜");
    assert(!result.race.hasGlowNodes, "竞速看板不应渲染背景光晕节点");
    assert(result.race.hasSprintMarker, "竞速看板应显示冲刺标记");
    assert(result.race.afterFrame.seriesCount > 0, "ECharts 动态序列图应包含数据序列");
    assert(result.race.afterFrame.dataCount >= 30, "ECharts 动态序列图应包含大量追赶数据");
    assert(result.race.afterFrame.realtimeSort === true, "ECharts 应启用 realtimeSort");
    assert(result.race.afterFrame.valueAnimation === true, "ECharts 分数标签应启用 valueAnimation");
    assert(result.race.afterFrame.xAxisMax === "dataMax", "ECharts 横轴应使用 dataMax 形成 bar race");
    assert(Number(result.race.afterFrame.yAxisMax) <= 12, "ECharts 应只显示 Top 12，由 realtimeSort 自动排序");
    assert(result.race.afterFrame.hasStableIds, "ECharts 数据项应有稳定 id，避免补间时重新识别条目");
    assert(result.race.afterFrame.seriesAnimationEasingUpdate === "cubicOut", "ECharts 换位动画应使用 cubicOut 增强冲感");
    assert(Number(result.race.afterFrame.seriesAnimationDurationUpdate) >= 720, "ECharts series 更新动画时长应覆盖帧间补间");
    assert(result.race.afterFrame.graphicText?.includes("月"), "竞速看板应显示随帧变化的日期大字");
    assert(result.race.afterFrame.frameLabel !== result.race.frameLabel, "竞速看板应按时间帧推进");
    assert(result.race.afterFrame.topValues.some((value) => Number(value) > 0), "竞速看板应连续推进分值");
    await page.waitForTimeout(2600);
    result.race.laterFrame = await page.evaluate(() => ({
      frameLabel: document.querySelector("[data-race-frame-label]")?.textContent?.trim(),
    }));
    assert(
      result.race.laterFrame.frameLabel !== result.race.afterFrame.frameLabel,
      "竞速看板在连续日期推进后应继续切换时间帧",
    );
    result.race.singleRunStop = await page.evaluate(async () => {
      const frames = window.DisplayScoreRace?.state?.model?.raceFrames || [];
      window.DisplayScoreRace.state.raceFrameIndex = Math.max(0, frames.length - 2);
      await new Promise((resolve) => setTimeout(resolve, 1600));
      const audio = window.DisplayScoreRace?.state?.audio;
      return {
        raceStopped: !window.DisplayScoreRace?.state?.raceTimer,
        frameIndex: window.DisplayScoreRace?.state?.raceFrameIndex,
        lastIndex: Math.max(0, frames.length - 1),
        audioState: audio?.dataset?.state || "",
      };
    });
    assert(result.race.singleRunStop.raceStopped, "竞速动画播放完一次后应自动停止，不应循环");
    assert(result.race.singleRunStop.frameIndex === result.race.singleRunStop.lastIndex, "竞速动画应停留在最后一帧");
    await page.waitForTimeout(1400);
    result.screenshots.race = await saveScreenshot(page, "display-score-race.png");
    log("积分竞速 ECharts 主幕渲染正确");

    result.boundSparseFallback = await page.evaluate(async () => {
      const previousDemoMode = window.__DISPLAY_DEMO_MODE__;
      window.__DISPLAY_DEMO_MODE__ = false;
      const sourceStudents = window.DisplayScoreRace?.state?.model?.students || [];
      window.DisplayScoreRace?.cleanup?.();
      await window.DisplayScoreRace?.init?.({
        getStudents: () => sourceStudents,
        getRuntimeState: () => ({ classId: 61, home: { className: "61班" } }),
        apiFetch: async (path) => {
          if (path.includes("/leaderboard")) return { rows: sourceStudents };
          if (path.includes("/score-records")) return { code: 0, message: "ok", data: [] };
          return [];
        },
        petImg: (row) => row.petImageUrl || row.avatarUrl || "images/logo.svg",
      });
      window.DisplayScoreRace?.setScene?.("race", { restartTimer: false });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const records = window.DisplayScoreRace?.state?.model?.records || [];
      const byDay = new Map();
      records.forEach((record) => {
        const date = new Date(record.occurredAt || record.createdAt);
        const key = `${date.getMonth() + 1}-${date.getDate()}`;
        byDay.set(key, (byDay.get(key) || 0) + 1);
      });
      const counts = Array.from(byDay.values());
      const response = {
        hasRecords: Boolean(window.DisplayScoreRace?.state?.model?.hasRecords),
        records: records.length,
        dayCount: byDay.size,
        minRecordsPerDay: counts.length ? Math.min(...counts) : 0,
        maxRecordsPerDay: counts.length ? Math.max(...counts) : 0,
        chartDataCount: window.DisplayScoreRace?.state?.raceChart?.getOption?.()?.series?.[0]?.data?.length || 0,
        scene: document.querySelector("#page-term-recap")?.dataset.termScene,
        dataSource: window.DisplayScoreRace?.state?.model?.dataSource,
      };
      window.__DISPLAY_DEMO_MODE__ = previousDemoMode;
      return response;
    });
    assert(result.boundSparseFallback.hasRecords, "已绑定 61班但接口无积分时应生成测试追赶数据");
    assert(result.boundSparseFallback.dayCount >= 120, "已绑定 61班兜底数据应覆盖本学期连续日期");
    assert(result.boundSparseFallback.minRecordsPerDay >= 1, "已绑定 61班兜底数据每天应有竞速事件");
    assert(result.boundSparseFallback.chartDataCount >= 40, "已绑定 61班兜底数据应进入 ECharts 主幕");
    assert(result.boundSparseFallback.scene === "race", "已绑定 61班兜底数据应能显示竞速主幕");
    assert(result.boundSparseFallback.dataSource === "generated", "兜底数据应标记为演示数据");
    log("已绑定 61班积分为空时可自动生成测试追赶数据");

    result.compatAndCleanup = await page.evaluate(async () => {
      window.DisplayScoreRace?.cleanup?.();
      const afterCleanup = {
        refreshStopped: !window.DisplayScoreRace?.state?.refreshTimer,
        raceStopped: !window.DisplayScoreRace?.state?.raceTimer,
        chartDisposed: !window.DisplayScoreRace?.state?.raceChart,
      };
      window.navigateTo("termRecap");
      await new Promise((resolve) => setTimeout(resolve, 700));
      const viaLegacy = {
        active: document.querySelector("#page-term-recap")?.classList.contains("active"),
        activeTab: document.querySelector(".bottom-tab.active")?.dataset.target,
        title: document.querySelector("#page-term-recap h1")?.textContent?.trim(),
      };
      return { afterCleanup, viaLegacy };
    });
    assert(result.compatAndCleanup.afterCleanup.refreshStopped, "离开或清理时应停止刷新定时器");
    assert(result.compatAndCleanup.afterCleanup.raceStopped, "离开或清理时应停止竞速定时器");
    assert(result.compatAndCleanup.afterCleanup.chartDisposed, "离开或清理时应销毁 ECharts 实例");
    assert(result.compatAndCleanup.viaLegacy.active, "旧 termRecap 路由应兼容进入积分竞速页面");
    assert(result.compatAndCleanup.viaLegacy.activeTab === "scoreRace", "旧路由进入后应高亮积分竞速入口");
    assert(result.compatAndCleanup.viaLegacy.title === "积分竞速", "旧路由进入后也应显示积分竞速");
    log("资源清理和旧路由兼容正确");
  } finally {
    await browser.close();
  }
}

run()
  .then(() => printResult("DISPLAY_SCORE_RACE_RESULT", result))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
