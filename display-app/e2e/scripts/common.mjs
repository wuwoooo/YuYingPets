import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const artifactsDir = path.join(workspaceRoot, "artifacts");

export const BASE_URL = process.env.DISPLAY_E2E_BASE_URL || "http://localhost:5174";
export const API_BASE_URL =
  process.env.DISPLAY_E2E_API_BASE_URL || "http://127.0.0.1:3000/api/v1";

export const DEFAULT_PASSWORD = "123456";
export const CLASS_ID = 3;

export function ensureArtifactsDir() {
  fs.mkdirSync(artifactsDir, { recursive: true });
  return artifactsDir;
}

export function artifactPath(filename) {
  ensureArtifactsDir();
  return path.join(artifactsDir, filename);
}

export async function api(pathname, options = {}) {
  const response = await fetch(`${API_BASE_URL}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const json = await response.json();
  if (!response.ok || json.statusCode) {
    const message = Array.isArray(json.message) ? json.message.join("; ") : json.message;
    throw new Error(message || `API ${pathname} failed`);
  }
  return json.data;
}

export async function login(username, password = DEFAULT_PASSWORD, terminalType = "display") {
  try {
    return await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, terminalType }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("账号或密码错误")) {
      throw new Error(
        [
          "演示账号登录失败，请先导入本地测试数据。",
          "在 backend 目录执行：npm run seed:mock",
          "并确认 backend (127.0.0.1:3000) 与 display-web (localhost:5174) 已启动。",
          `原始错误：${message}`,
        ].join("\n"),
      );
    }
    throw error;
  }
}

export async function initializeTerminal({
  terminalCode,
  terminalName,
  classId = CLASS_ID,
  superadminToken,
}) {
  return api("/display/terminal-initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${superadminToken}`,
    },
    body: JSON.stringify({ terminalCode, terminalName, classId }),
  });
}

export async function createBrowserPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  return { browser, page };
}

export async function loginToClassroom(page, { terminalCode, username, password = DEFAULT_PASSWORD }) {
  const url = `${BASE_URL}/display/display.html?terminal=${encodeURIComponent(terminalCode)}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(
    () => document.querySelector("#page-entry")?.classList.contains("active"),
    null,
    { timeout: 15000 },
  );
  await page.evaluate(() => navigateTo("login"));
  await page.waitForFunction(
    () =>
      document.querySelector("#page-login")?.classList.contains("active") &&
      !document.querySelector("#page-entry")?.classList.contains("active"),
    null,
    { timeout: 15000 },
  );
  await page.evaluate(
    ({ username, password }) => {
      document.querySelector("#loginUsername").value = username;
      document.querySelector("#loginPassword").value = password;
      handleLogin();
    },
    { username, password },
  );
  await page.waitForFunction(
    () => document.querySelector("#page-classroom")?.classList.contains("active"),
    null,
    { timeout: 20000 },
  );
}

export function makeTerminalCode(prefix) {
  return `${prefix}-${Date.now()}`;
}

export function createLogger(result) {
  return (message) => {
    result.checks.push(message);
    console.log(message);
  };
}

export async function saveScreenshot(page, filename) {
  const target = artifactPath(filename);
  await page.screenshot({ path: target, fullPage: true });
  return target;
}

export function printResult(prefix, result) {
  console.log(`${prefix}=${JSON.stringify(result)}`);
}
