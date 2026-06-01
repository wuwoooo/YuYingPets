import {
  CLASS_ID,
  api,
  createBrowserPage,
  createLogger,
  initializeTerminal,
  login,
  makeTerminalCode,
  printResult,
  saveScreenshot,
  BASE_URL,
} from "./common.mjs";

const result = {
  suite: "display-online-status",
  terminalCode: makeTerminalCode("playwright-online"),
  checks: [],
};

const log = createLogger(result);

async function getTerminalRow(token, terminalCode) {
  const rows = await api("/display/terminals", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (rows || []).find((item) => item.terminalCode === terminalCode) || null;
}

async function waitForTerminalStatus(token, terminalCode, expectedStatus, timeoutMs = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const row = await getTerminalRow(token, terminalCode);
    if (row?.onlineStatus === expectedStatus) {
      return row;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  const latest = await getTerminalRow(token, terminalCode);
  throw new Error(
    `等待终端 ${terminalCode} 变为 ${expectedStatus} 超时，当前为 ${latest?.onlineStatus || "unknown"}`,
  );
}

async function run() {
  const adminLogin = await login("admin", "xiaowu123");

  await initializeTerminal({
    terminalCode: result.terminalCode,
    terminalName: "育英星宠终端-在线状态测试",
    classId: CLASS_ID,
    superadminToken: adminLogin.token,
  });
  log("已完成在线状态测试终端初始化");

  const { browser, page } = await createBrowserPage();

  try {
    const url = `${BASE_URL}/display/display.html?terminal=${encodeURIComponent(result.terminalCode)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForFunction(
      () => document.querySelector("#page-entry")?.classList.contains("active"),
      null,
      { timeout: 15000 },
    );
    log("展示端已打开进入页");

    result.onlineRow = await waitForTerminalStatus(
      adminLogin.token,
      result.terminalCode,
      "online",
      12000,
    );
    log(`后台在线状态已变为 online，最近在线=${result.onlineRow.lastOnlineAt || "null"}`);

    result.screenshot = await saveScreenshot(page, "display-online-status.png");
    log(`已保存在线状态测试截图 ${result.screenshot}`);
  } finally {
    await browser.close();
  }

  result.offlineRow = await waitForTerminalStatus(
    adminLogin.token,
    result.terminalCode,
    "offline",
    12000,
  );
  log("关闭页面后后台在线状态已切为 offline");

  printResult("DISPLAY_ONLINE_STATUS_RESULT", result);
}

run().catch((error) => {
  console.error("DISPLAY_ONLINE_STATUS_FAILED", error);
  process.exitCode = 1;
});
