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
  suite: "display-roles",
  terminalCode: makeTerminalCode("playwright-roles"),
  checks: [],
};

const log = createLogger(result);

async function run() {
  const superLogin = await login("superadmin_demo");
  const teacherLogin = await login("teacher_demo_c");

  await initializeTerminal({
    terminalCode: result.terminalCode,
    terminalName: "育英星宠终端-权限测试",
    classId: CLASS_ID,
    superadminToken: superLogin.token,
  });
  log("已完成权限测试终端初始化");

  const { browser, page } = await createBrowserPage();
  try {
    await loginToClassroom(page, {
      terminalCode: result.terminalCode,
      username: "teacher_demo_c",
    });
    log("班主任登录成功");

    const batchBefore = await page.evaluate(() =>
      students.slice(0, 2).map((student) => ({ name: student.name, pts: student.pts })),
    );
    await page.evaluate(() => openPointModalBatch(students.slice(0, 2).map((student) => student.name)));
    await page.waitForFunction(
      () => document.querySelector("#pointModal")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    await page.evaluate(() => applyQuickRule(1));
    await page.waitForFunction(
      (beforeRows) => beforeRows.every((row, index) => students[index] && students[index].pts > row.pts),
      batchBefore,
      { timeout: 15000 },
    );
    const batchAfter = await page.evaluate(() =>
      students.slice(0, 2).map((student) => ({ name: student.name, pts: student.pts })),
    );
    result.batch = { before: batchBefore, after: batchAfter };
    log(`批量加分通过：${batchAfter.map((row) => `${row.name}=${row.pts}`).join(" / ")}`);

    const groups = await api(`/classes/${CLASS_ID}/groups`, {
      headers: { Authorization: `Bearer ${teacherLogin.token}` },
    });
    const targetGroupNo = groups[0]?.groupNo || 1;
    const groupBefore = await page.evaluate(
      (groupNo) => students.filter((student) => student.group === groupNo).map((student) => ({
        name: student.name,
        pts: student.pts,
      })),
      targetGroupNo,
    );
    await page.evaluate((groupNo) => openPointModalGroup(groupNo), targetGroupNo);
    await page.waitForFunction(
      () => document.querySelector("#pointModal")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    await page.evaluate(() => applyQuickRule(2));
    await page.waitForFunction(
      (payload) => {
        const rows = students.filter((student) => student.group === payload.groupNo);
        return rows.length > 0 && rows.every((row, index) => row.pts < payload.before[index].pts);
      },
      { groupNo: targetGroupNo, before: groupBefore },
      { timeout: 15000 },
    );
    const groupAfter = await page.evaluate(
      (groupNo) => students.filter((student) => student.group === groupNo).map((student) => ({
        name: student.name,
        pts: student.pts,
      })),
      targetGroupNo,
    );
    result.group = { groupNo: targetGroupNo, before: groupBefore, after: groupAfter };
    log(
      `按组扣分通过：第${targetGroupNo}组 ${groupAfter
        .map((row) => `${row.name}=${row.pts}`)
        .join(" / ")}`,
    );

    await loginToClassroom(page, {
      terminalCode: result.terminalCode,
      username: "subject_demo",
    });
    log("任课教师登录成功");

    result.subjectLogin = {
      opTitle: await page.locator("#displayOpTitle").textContent(),
    };

    let alertMessage = null;
    page.once("dialog", async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

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
    const candidateName = await page.evaluate(() => students[0]?.name);
    await page.evaluate((studentName) => confirmExchange(studentName), candidateName);
    await page.waitForTimeout(1200);
    result.subjectExchange = {
      alertMessage,
      successModalActive: await page
        .locator("#exModal")
        .evaluate((el) => el.classList.contains("active")),
      candidateName,
    };
    log(
      `任课教师兑换限制结果：alert=${result.subjectExchange.alertMessage || "none"}, success=${result.subjectExchange.successModalActive}`,
    );

    result.screenshot = await saveScreenshot(page, "display-roles.png");
    log(`已保存权限链路截图 ${result.screenshot}`);
  } finally {
    await browser.close();
  }

  printResult("DISPLAY_ROLES_RESULT", result);
}

run().catch((error) => {
  console.error("DISPLAY_ROLES_FAILED", error);
  process.exitCode = 1;
});
