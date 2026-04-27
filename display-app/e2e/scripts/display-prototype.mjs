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
  suite: "display-prototype",
  terminalCode: makeTerminalCode("playwright-prototype"),
  checks: [],
};

const log = createLogger(result);

async function run() {
  const superLogin = await login("superadmin_demo");
  const teacherLogin = await login("teacher_demo_c");
  const suffix = Date.now().toString().slice(-6);
  const prototypeStudent = {
    studentNo: `E2E${suffix}`,
    name: `原型学生${suffix}`,
  };

  await api("/students/import", {
    method: "POST",
    headers: { Authorization: `Bearer ${teacherLogin.token}` },
    body: JSON.stringify({
      classId: CLASS_ID,
      students: [prototypeStudent],
    }),
  });
  log(`已创建原型测试学生 ${prototypeStudent.name}`);

  await initializeTerminal({
    terminalCode: result.terminalCode,
    terminalName: "育英星宠终端-原型测试",
    classId: CLASS_ID,
    superadminToken: superLogin.token,
  });
  log("已完成原型测试终端初始化");

  const { browser, page } = await createBrowserPage();
  try {
    await loginToClassroom(page, {
      terminalCode: result.terminalCode,
      username: "teacher_demo_c",
    });
    log("教师登录并进入班级主页成功");

    const adoptCandidate = await page.evaluate((studentName) => {
      const candidate = students.find((student) => student.name === studentName);
      return { name: candidate?.name, hasPet: candidate?.hasPet, petName: candidate?.petName };
    }, prototypeStudent.name);

    await page.evaluate((studentName) => openAdoptModal(studentName), adoptCandidate.name);
    await page.waitForFunction(
      () => document.querySelector("#adoptPetModal")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    await page.evaluate(async () => {
      const pet = adoptPetCatalog[0];
      await confirmAdopt(pet.petId, pet.petName, pet.ext);
    });
    await page.waitForFunction(
      (studentName) => {
        const student = students.find((row) => row.name === studentName);
        return Boolean(student?.hasPet && student?.petName);
      },
      adoptCandidate.name,
      { timeout: 15000 },
    );
    result.adopt = await page.evaluate((studentName) => {
      const student = students.find((row) => row.name === studentName);
      return {
        name: student?.name,
        hasPet: student?.hasPet,
        petName: student?.petName,
        modalActive: document.querySelector("#adoptPetModal")?.classList.contains("active"),
      };
    }, adoptCandidate.name);
    log(`原型领养链路通过：${result.adopt.name} -> ${result.adopt.petName}`);

    await loginToClassroom(page, {
      terminalCode: result.terminalCode,
      username: "teacher_demo_c",
    });
    result.adoptAfterReload = await page.evaluate((studentName) => {
      const student = students.find((row) => row.name === studentName);
      return {
        name: student?.name,
        hasPet: student?.hasPet,
        petName: student?.petName,
      };
    }, adoptCandidate.name);
    log(`领养结果重载后仍保留：${result.adoptAfterReload.name} -> ${result.adoptAfterReload.petName}`);

    const groupBefore = await page.evaluate(() => ({
      name: null,
      group: null,
    }));
    groupBefore.name = prototypeStudent.name;
    groupBefore.group = await page.evaluate((studentName) => {
      const student = students.find((row) => row.name === studentName);
      return student?.group;
    }, prototypeStudent.name);
    await page.evaluate(() => openGroupManageModal());
    await page.waitForFunction(
      () => document.querySelector("#groupManageModal")?.classList.contains("active"),
      null,
      { timeout: 10000 },
    );
    await page.evaluate((studentName) => setStudentGroupByName(studentName, 4), groupBefore.name);
    await page.evaluate(async () => {
      await saveGroupManageChanges();
    });
    await page.waitForFunction(
      (studentName) => {
        const student = students.find((row) => row.name === studentName);
        return Number(student?.group) === 4;
      },
      groupBefore.name,
      { timeout: 15000 },
    );
    result.groupManage = await page.evaluate((studentName) => {
      const student = students.find((row) => row.name === studentName);
      return {
        name: student?.name,
        group: student?.group,
        modalActive: document.querySelector("#groupManageModal")?.classList.contains("active"),
      };
    }, groupBefore.name);
    log(`原型分组链路通过：${result.groupManage.name} -> 第${result.groupManage.group}组`);

    await loginToClassroom(page, {
      terminalCode: result.terminalCode,
      username: "teacher_demo_c",
    });
    result.groupAfterReload = await page.evaluate((studentName) => {
      const student = students.find((row) => row.name === studentName);
      return {
        name: student?.name,
        group: student?.group,
      };
    }, groupBefore.name);
    log(`分组结果重载后仍保留：${result.groupAfterReload.name} -> 第${result.groupAfterReload.group}组`);

    result.screenshot = await saveScreenshot(page, "display-prototype.png");
    log(`已保存原型链路截图 ${result.screenshot}`);
  } finally {
    await browser.close();
  }

  printResult("DISPLAY_PROTOTYPE_RESULT", result);
}

run().catch((error) => {
  console.error("DISPLAY_PROTOTYPE_FAILED", error);
  process.exitCode = 1;
});
