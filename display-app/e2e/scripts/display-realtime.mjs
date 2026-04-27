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
  suite: "display-realtime",
  terminalCodePrimary: makeTerminalCode("playwright-rt-a"),
  terminalCodeSecondary: makeTerminalCode("playwright-rt-b"),
  checks: [],
};

const log = createLogger(result);

async function run() {
  const superLogin = await login("superadmin_demo");
  const teacherLogin = await login("teacher_demo_c");
  const suffix = Date.now().toString().slice(-6);
  const realtimeStudent = {
    studentNo: `RT${suffix}`,
    name: `实时学生${suffix}`,
  };

  await api("/students/import", {
    method: "POST",
    headers: { Authorization: `Bearer ${teacherLogin.token}` },
    body: JSON.stringify({
      classId: CLASS_ID,
      students: [realtimeStudent],
    }),
  });
  log(`已创建实时测试学生 ${realtimeStudent.name}`);

  await initializeTerminal({
    terminalCode: result.terminalCodePrimary,
    terminalName: "育英星宠终端-实时主屏",
    classId: CLASS_ID,
    superadminToken: superLogin.token,
  });
  await initializeTerminal({
    terminalCode: result.terminalCodeSecondary,
    terminalName: "育英星宠终端-实时副屏",
    classId: CLASS_ID,
    superadminToken: superLogin.token,
  });
  log("已完成实时测试双终端初始化");

  const browserA = await createBrowserPage();
  const browserB = await createBrowserPage();

  try {
    await loginToClassroom(browserA.page, {
      terminalCode: result.terminalCodePrimary,
      username: "teacher_demo_c",
    });
    await loginToClassroom(browserB.page, {
      terminalCode: result.terminalCodeSecondary,
      username: "teacher_demo_c",
    });
    log("双终端已登录并进入同一班级主页");

    const watched = await browserB.page.evaluate((studentName) => {
      const student = students.find((row) => row.name === studentName);
      return student
        ? {
            id: student.id,
            name: student.name,
            pts: student.pts,
            group: student.group,
            hasPet: student.hasPet,
            petName: student.petName,
          }
        : null;
    }, realtimeStudent.name);

    if (!watched?.id) {
      throw new Error(`未在展示端找到实时测试学生 ${realtimeStudent.name}`);
    }

    result.watchedStudent = watched.name;

    await api("/score-records", {
      method: "POST",
      headers: { Authorization: `Bearer ${teacherLogin.token}` },
      body: JSON.stringify({
        classId: CLASS_ID,
        studentId: watched.id,
        ruleId: 1,
        sourceTerminal: "display",
        remark: "实时刷新测试-积分",
      }),
    });
    await browserB.page.waitForFunction(
      ([name, previous]) => {
        const student = students.find((row) => row.name === name);
        return Boolean(student && student.pts > previous);
      },
      [watched.name, watched.pts],
      { timeout: 15000 },
    );
    result.scoreRefresh = await browserB.page.evaluate((name) => {
      const student = students.find((row) => row.name === name);
      return {
        name: student?.name,
        pts: student?.pts,
      };
    }, watched.name);
    log(`前端实时积分刷新通过：${watched.name} ${watched.pts} -> ${result.scoreRefresh.pts}`);

    await api(`/students/${watched.id}/adopt-pet`, {
      method: "POST",
      headers: { Authorization: `Bearer ${teacherLogin.token}` },
      body: JSON.stringify({
        classId: CLASS_ID,
        petCode: "002",
        petName: "侏儒兔",
        coverUrl: "images/pets/002_侏儒兔_5.jpg",
        category: "display_catalog",
        rarity: "normal",
        sourceTerminal: "display",
      }),
    });
    await browserB.page.waitForFunction(
      ([name, previousPet]) => {
        const student = students.find((row) => row.name === name);
        return Boolean(student && student.petName && student.petName !== previousPet);
      },
      [watched.name, watched.petName || ""],
      { timeout: 15000 },
    );
    result.adoptRefresh = await browserB.page.evaluate((name) => {
      const student = students.find((row) => row.name === name);
      return {
        name: student?.name,
        hasPet: student?.hasPet,
        petName: student?.petName,
      };
    }, watched.name);
    log(`前端实时领养刷新通过：${result.adoptRefresh.name} -> ${result.adoptRefresh.petName}`);

    const groups = await api(`/classes/${CLASS_ID}/groups`, {
      headers: { Authorization: `Bearer ${teacherLogin.token}` },
    });
    const groupMap = new Map(groups.map((group) => [group.groupNo, group]));
    const targetGroupNo = Number(watched.group) === 4 ? 3 : 4;
    const groupPayload = [1, 2, 3, 4].map((groupNo) => {
      const group = groupMap.get(groupNo);
      const existingIds = (group?.students || []).map((student) => student.id);
      const studentIds =
        groupNo === targetGroupNo
          ? Array.from(new Set([...existingIds, watched.id]))
          : existingIds.filter((studentId) => studentId !== watched.id);
      return {
        id: group?.id || null,
        groupNo,
        name: group?.name || `第${groupNo}组`,
        studentIds,
      };
    });

    await api(`/classes/${CLASS_ID}/groups/students`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${teacherLogin.token}` },
      body: JSON.stringify({ groups: groupPayload }),
    });
    await browserB.page.waitForFunction(
      ([name, expectedGroup]) => {
        const student = students.find((row) => row.name === name);
        return Boolean(student && Number(student.group) === Number(expectedGroup));
      },
      [watched.name, targetGroupNo],
      { timeout: 15000 },
    );
    result.groupRefresh = await browserB.page.evaluate((name) => {
      const student = students.find((row) => row.name === name);
      return {
        name: student?.name,
        group: student?.group,
      };
    }, watched.name);
    log(`前端实时分组刷新通过：${result.groupRefresh.name} -> 第${result.groupRefresh.group}组`);

    result.screenshot = await saveScreenshot(browserB.page, "display-realtime.png");
    log(`已保存实时链路截图 ${result.screenshot}`);
  } finally {
    await browserA.browser.close();
    await browserB.browser.close();
  }

  printResult("DISPLAY_REALTIME_RESULT", result);
}

run().catch((error) => {
  console.error("DISPLAY_REALTIME_FAILED", error);
  process.exitCode = 1;
});
