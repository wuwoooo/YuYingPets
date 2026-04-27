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
  suite: "display-core",
  terminalCode: makeTerminalCode("playwright-core"),
  checks: [],
};

const log = createLogger(result);

async function run() {
  const superLogin = await login("superadmin_demo");
  const teacherLogin = await login("teacher_demo_c");

  await initializeTerminal({
    terminalCode: result.terminalCode,
    terminalName: "育英星宠终端-核心测试",
    classId: CLASS_ID,
    superadminToken: superLogin.token,
  });
  log("已完成核心测试终端初始化");

  const { browser, page } = await createBrowserPage();
  try {
    await loginToClassroom(page, {
      terminalCode: result.terminalCode,
      username: "teacher_demo_c",
    });
    log("教师登录并进入班级主页成功");

    const before = await page.evaluate(() => ({ name: students[0]?.name, pts: students[0]?.pts }));
    await page.evaluate(() => {
      const name = students[0]?.name;
      const card = document.querySelector(`.student-card[data-student-name="${name}"]`);
      openPointModalByName(name, card);
    });
    await page.waitForFunction(
      () => document.querySelector("#pointModal")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    await page.evaluate(() => applyQuickRule(1));
    await page.waitForFunction((prev) => students[0] && students[0].pts > prev, before.pts, {
      timeout: 15000,
    });
    const after = await page.evaluate(() => ({ name: students[0]?.name, pts: students[0]?.pts }));
    result.scoreChange = { student: before.name, before: before.pts, after: after.pts };
    log(`加分模块通过：${before.name} ${before.pts} -> ${after.pts}`);

    await page.evaluate(() => navigateTo("leaderboard"));
    await page.waitForFunction(
      () => document.querySelector("#page-leaderboard")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    const topPodiumNames = await page.locator(".podium-name").evaluateAll((els) =>
      els.map((el) => el.textContent),
    );
    result.leaderboard = { topPodiumNames };
    log(`排行榜模块可用，领奖台：${topPodiumNames.join(" / ")}`);

    const studentRows = await api(`/students?classId=${CLASS_ID}`, {
      headers: { Authorization: `Bearer ${teacherLogin.token}` },
    });
    const targetStudent = studentRows.find((row) => row.name === before.name) || studentRows[0];
    for (let index = 0; index < 10; index += 1) {
      await api("/score-records", {
        method: "POST",
        headers: { Authorization: `Bearer ${teacherLogin.token}` },
        body: JSON.stringify({
          classId: CLASS_ID,
          studentId: targetStudent.id,
          ruleId: 1,
          sourceTerminal: "display",
          remark: "兑换测试补分",
        }),
      });
    }
    log(`已为 ${targetStudent.name} 补足兑换积分`);

    await page.evaluate(() => navigateTo("exchange"));
    await page.waitForFunction(
      () => document.querySelector("#page-exchange")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    const rewardCenter = await api(`/display/classes/${CLASS_ID}/reward-center`);
    const reward = rewardCenter.rewards[0];
    await page.evaluate(
      ({ rewardId, rewardName, cost }) => initiateExchange(rewardId, rewardName, cost),
      { rewardId: reward.id, rewardName: reward.name, cost: reward.scoreCost },
    );
    await page.waitForFunction(
      () => document.querySelector("#exStudentModal")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    await page.evaluate((studentName) => confirmExchange(studentName), targetStudent.name);
    await page.waitForFunction(() => document.querySelector("#exModal")?.classList.contains("active"), null, {
      timeout: 10000,
    });
    const exchangeText = await page.locator("#exModalDesc").textContent();
    result.exchange = { student: targetStudent.name, reward: reward.name, text: exchangeText };
    log(`兑换模块通过：${targetStudent.name} -> ${reward.name}`);
    await page.evaluate(() => closeExchangeSuccess());

    await page.evaluate(() => navigateTo("classroom"));
    await page.waitForFunction(
      () => document.querySelector("#page-classroom")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    await page.evaluate(() => lockDisplay());
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const name = students[0]?.name;
      const card = document.querySelector(`.student-card[data-student-name="${name}"]`);
      openPointModalByName(name, card);
    });
    await page.waitForTimeout(600);
    result.lock = await page.evaluate(() => ({
      overlayActive: document.querySelector("#displayLockOverlay")?.classList.contains("active"),
      pointModalActive: document.querySelector("#pointModal")?.classList.contains("active"),
      lockTitle: document.querySelector("#displayLockTitle")?.textContent,
    }));
    log(
      `锁定模块结果：overlay=${result.lock.overlayActive}, pointModal=${result.lock.pointModalActive}`,
    );

    result.screenshot = await saveScreenshot(page, "display-core.png");
    log(`已保存核心链路截图 ${result.screenshot}`);
  } finally {
    await browser.close();
  }

  printResult("DISPLAY_CORE_RESULT", result);
}

run().catch((error) => {
  console.error("DISPLAY_CORE_FAILED", error);
  process.exitCode = 1;
});
