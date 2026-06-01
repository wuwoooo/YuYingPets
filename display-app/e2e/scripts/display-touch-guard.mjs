import {
  CLASS_ID,
  createBrowserPage,
  createLogger,
  initializeTerminal,
  login,
  loginToClassroom,
  makeTerminalCode,
  printResult,
} from "./common.mjs";

const result = {
  suite: "display-touch-guard",
  terminalCode: makeTerminalCode("playwright-touch"),
  checks: [],
};

const log = createLogger(result);

function dispatchPointer(page, type, target, clientX, clientY, pointerId = 1) {
  return page.evaluate(
    ({ type, selector, clientX, clientY, pointerId }) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`missing target ${selector}`);
      const eventInit = {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        pointerId,
        pointerType: "touch",
        isPrimary: true,
        buttons: type === "pointerup" ? 0 : 1,
        button: 0,
      };
      el.dispatchEvent(new PointerEvent(type, eventInit));
    },
    { type, selector: target, clientX, clientY, pointerId },
  );
}

async function run() {
  const superLogin = await login("superadmin_demo");

  await initializeTerminal({
    terminalCode: result.terminalCode,
    terminalName: "育英星宠终端-触控防误触测试",
    classId: CLASS_ID,
    superadminToken: superLogin.token,
  });
  log("已完成触控防误触测试终端初始化");

  const { browser, page } = await createBrowserPage();
  try {
    await loginToClassroom(page, {
      terminalCode: result.terminalCode,
      username: "teacher_demo_c",
    });
    log("教师登录并进入班级主页成功");

    await page.evaluate(() => {
      document.documentElement.classList.add("touch-preview");
      const wrap = document.querySelector("#page-classroom .student-grid-wrap");
      if (wrap) {
        wrap.style.maxHeight = "240px";
        wrap.style.overflowY = "auto";
      }
      enableClassroomGridDragScroll();
    });

    const cardSelector = await page.evaluate(() => {
      const card = document.querySelector("#studentGrid .student-card");
      if (!card) return null;
      card.setAttribute("data-e2e-touch-card", "1");
      return '[data-e2e-touch-card="1"]';
    });
    if (!cardSelector) {
      throw new Error("未找到可用于触控测试的学生卡片");
    }

    const start = await page.evaluate((selector) => {
      const card = document.querySelector(selector);
      const rect = card.getBoundingClientRect();
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      };
    }, cardSelector);

    await dispatchPointer(page, "pointerdown", cardSelector, start.x, start.y);
    await dispatchPointer(page, "pointermove", cardSelector, start.x, start.y + 36);
    await dispatchPointer(page, "pointerup", cardSelector, start.x, start.y + 36);

    result.scrollGuard = await page.evaluate(() => ({
      pointModalActive: document.querySelector("#pointModal")?.classList.contains("active"),
      pkOverlayActive: document.querySelector("#petPkOverlay")?.classList.contains("active"),
      gridDragMoved: document.querySelector(".student-grid-wrap")?.dataset?.dragMoved === "1",
    }));

    if (result.scrollGuard.pointModalActive) {
      throw new Error("纵向滑动后不应打开评分弹窗");
    }
    if (result.scrollGuard.pkOverlayActive) {
      throw new Error("纵向滑动后不应触发 PK");
    }
    log(
      `滑动防误触通过：pointModal=${result.scrollGuard.pointModalActive}, pk=${result.scrollGuard.pkOverlayActive}`,
    );

    await dispatchPointer(page, "pointerdown", cardSelector, start.x, start.y);
    await dispatchPointer(page, "pointerup", cardSelector, start.x, start.y);

    await page.waitForFunction(
      () => document.querySelector("#pointModal")?.classList.contains("active"),
      null,
      { timeout: 5000 },
    );
    result.tapScore = await page.evaluate(() => ({
      pointModalActive: document.querySelector("#pointModal")?.classList.contains("active"),
    }));
    log(`单击评分仍可用：pointModal=${result.tapScore.pointModalActive}`);

    await page.evaluate(() => closePointModal());
    result.closeGuard = await page.evaluate(() => ({
      inputGuard: document.body.classList.contains("display-input-guard"),
    }));
    if (!result.closeGuard.inputGuard) {
      throw new Error("关闭评分弹窗后应立即开启 display-input-guard");
    }
    log("关闭弹窗穿透保护已生效");

    await page.waitForTimeout(500);
    result.closeGuardExpired = await page.evaluate(() => ({
      inputGuard: document.body.classList.contains("display-input-guard"),
    }));
    if (result.closeGuardExpired.inputGuard) {
      throw new Error("display-input-guard 应在 450ms 后自动解除");
    }
    log("关闭弹窗穿透保护已按时解除");
  } finally {
    await browser.close();
  }

  printResult("DISPLAY_TOUCH_GUARD_RESULT", result);
}

run().catch((error) => {
  console.error("DISPLAY_TOUCH_GUARD_FAILED", error);
  process.exitCode = 1;
});
