import {
  CLASS_ID,
  api,
  createBrowserPage,
  createLogger,
  initializeTerminal,
  login,
  loginToClassroom,
  makeTerminalCode,
  printResult,
  saveScreenshot,
} from "./common.mjs";

const result = {
  suite: "display-login-call-only",
  terminalCode: makeTerminalCode("playwright-login-call"),
  checks: [],
};

const log = createLogger(result);

async function clearCallQueue(token) {
  const queue = await api(`/call-queue/list?classId=${CLASS_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => []);

  for (const item of queue || []) {
    if (["pending", "calling"].includes(item.status)) {
      await api(`/call-queue/${item.id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }
}

async function run() {
  const superLogin = await login("admin", "xiaowu123");
  const teacherLogin = await login("admin", "xiaowu123");

  await clearCallQueue(teacherLogin.token);
  log("已清理班级历史叫号队列");

  await initializeTerminal({
    terminalCode: result.terminalCode,
    terminalName: "育英星宠终端-登录页叫号测试",
    classId: CLASS_ID,
    superadminToken: superLogin.token,
  });
  log("已完成登录页叫号测试终端初始化");

  const { browser, page } = await createBrowserPage();

  try {
    await loginToClassroom(page, {
      terminalCode: result.terminalCode,
      username: "admin",
      password: "xiaowu123",
    });
    log("教师登录并进入班级主页成功");

    const watched = await page.evaluate(() => ({
      id: students[0]?.id,
      name: students[0]?.name,
      pts: students[0]?.pts,
    }));
    if (!watched?.id || !watched?.name) {
      throw new Error("未找到可观察学生");
    }
    result.watchedStudent = watched.name;

    const scoreRules = await api(
      `/score-rules?displayEnabled=true&scoreTarget=student&classId=${CLASS_ID}`,
      {
        headers: { Authorization: `Bearer ${teacherLogin.token}` },
      },
    );
    const usableRule = (scoreRules || []).find((item) => Number(item.id));
    if (!usableRule?.id) {
      throw new Error("未找到可用的学生积分规则");
    }

    await page.evaluate(() => lockDisplay());
    await page.waitForFunction(() => !runtimeState?.user, null, {
      timeout: 15000,
    }).catch(async () => {
      const state = await page.evaluate(() => ({
        hasUser: Boolean(runtimeState.user),
        page: document.querySelector(".page.active")?.id || "",
      }));
      throw new Error(`锁定后登录态未清空: ${JSON.stringify(state)}`);
    });
    await page.evaluate(() => navigateTo("login"));
    await page.waitForFunction(
      () => document.querySelector("#page-login")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    log("已切到登录页，准备验证仅接收叫号");

    await api("/score-records", {
      method: "POST",
      headers: { Authorization: `Bearer ${teacherLogin.token}` },
      body: JSON.stringify({
        classId: CLASS_ID,
        studentId: watched.id,
        ruleId: usableRule.id,
        sourceTerminal: "admin",
        remark: "登录页不接收积分更新测试",
      }),
    });
    await page.waitForTimeout(2500);

    result.loginPageScoreState = await page.evaluate((studentName) => {
      const student = students.find((row) => row.name === studentName);
      return {
        page: document.querySelector(".page.active")?.id || "",
        pts: student?.pts,
      };
    }, watched.name);
    if (result.loginPageScoreState.pts !== watched.pts) {
      throw new Error(
        `登录页误接收了积分更新: ${watched.pts} -> ${result.loginPageScoreState.pts}`,
      );
    }
    log(`登录页积分静默通过：${watched.name} 仍为 ${watched.pts}`);

    await api("/call-queue", {
      method: "POST",
      headers: { Authorization: `Bearer ${teacherLogin.token}` },
      body: JSON.stringify({
        classId: CLASS_ID,
        studentIds: [watched.id],
        location: "科学实验室",
      }),
    });

    await page.waitForFunction(
      () => {
        const overlay = document.getElementById("callOverlay");
        return Boolean(overlay && overlay.style.display === "flex");
      },
      null,
      { timeout: 15000 },
    );

    result.loginPageCallState = await page.evaluate(() => ({
      title: document.getElementById("callTitle")?.textContent?.trim() || "",
      location: document.getElementById("callLocation")?.textContent?.trim() || "",
      students: Array.from(document.querySelectorAll("#callStudents .co-student-tag")).map(
        (el) => el.textContent?.trim() || "",
      ),
    }));
    log(
      `登录页叫号通过：${result.loginPageCallState.title} -> ${result.loginPageCallState.location}`,
    );

    result.screenshot = await saveScreenshot(page, "display-login-call-only.png");
    log(`已保存登录页叫号测试截图 ${result.screenshot}`);
  } finally {
    await browser.close();
  }

  printResult("DISPLAY_LOGIN_CALL_ONLY_RESULT", result);
}

run().catch((error) => {
  console.error("DISPLAY_LOGIN_CALL_ONLY_FAILED", error);
  process.exitCode = 1;
});
