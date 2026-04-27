import {
  BASE_URL,
  CLASS_ID,
  createBrowserPage,
  createLogger,
  initializeTerminal,
  login,
  makeTerminalCode,
  printResult,
  saveScreenshot,
} from "./common.mjs";

const result = {
  suite: "display-terminal",
  terminalCode: makeTerminalCode("playwright-terminal"),
  checks: [],
};

const log = createLogger(result);

async function run() {
  const superLogin = await login("superadmin_demo");
  const { browser, page } = await createBrowserPage();

  try {
    const initialUrl = `${BASE_URL}/display/display.html?terminal=${encodeURIComponent(result.terminalCode)}`;

    await page.goto(initialUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForFunction(
      () => document.querySelector("#page-setup")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    result.uninitialized = {
      activePage: await page.evaluate(() =>
        Array.from(document.querySelectorAll(".page"))
          .find((node) => node.classList.contains("active"))
          ?.id,
      ),
    };
    log("未初始化终端会自动进入初始化向导");

    await initializeTerminal({
      terminalCode: result.terminalCode,
      terminalName: "育英星宠终端-改绑测试",
      classId: CLASS_ID,
      superadminToken: superLogin.token,
    });
    log("已将测试终端绑定到二年级 二(1)班");

    await page.goto(initialUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForFunction(
      () => document.querySelector("#page-entry")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    result.boundEntry = await page.evaluate(() => ({
      terminalName: document.querySelector("#entryTerminalName")?.textContent,
      classTitle: document.querySelector("#entryClassTitle")?.textContent,
      slogan: document.querySelector("#entryClassSummary")?.textContent,
      teacher: document.querySelector("#entryTeacherName")?.textContent,
    }));
    log("已验证绑定后的首页角标");

    await initializeTerminal({
      terminalCode: result.terminalCode,
      terminalName: "育英星宠终端-改绑测试",
      classId: 2,
      superadminToken: superLogin.token,
    });
    log("已将同一终端改绑到一年级 一(2)班");

    await page.goto(initialUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForFunction(
      () => document.querySelector("#page-entry")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    result.reboundEntry = await page.evaluate(() => ({
      terminalName: document.querySelector("#entryTerminalName")?.textContent,
      classTitle: document.querySelector("#entryClassTitle")?.textContent,
      slogan: document.querySelector("#entryClassSummary")?.textContent,
      teacher: document.querySelector("#entryTeacherName")?.textContent,
    }));
    log("已验证改绑后的首页角标");

    await page.click('button:has-text("教师登录")');
    await page.fill("#loginUsername", "teacher_test");
    await page.fill("#loginPassword", "123456");
    await page.click("button.login-btn");
    await page.waitForTimeout(1200);
    result.invalidLogin = {
      message: await page.locator("#loginMessage").textContent(),
      loginPageActive: await page.evaluate(
        () => document.querySelector("#page-login")?.classList.contains("active"),
      ),
    };
    log(`错误账号登录校验结果：${result.invalidLogin.message}`);

    result.screenshot = await saveScreenshot(page, "display-terminal.png");
    log(`已保存终端状态截图 ${result.screenshot}`);
  } finally {
    await browser.close();
  }

  printResult("DISPLAY_TERMINAL_RESULT", result);
}

run().catch((error) => {
  console.error("DISPLAY_TERMINAL_FAILED", error);
  process.exitCode = 1;
});
