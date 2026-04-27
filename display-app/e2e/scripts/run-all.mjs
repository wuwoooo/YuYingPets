import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scripts = ["test:core", "test:roles", "test:terminal", "test:prototype", "test:realtime"];
const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const script of scripts) {
  await new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", script], {
      cwd,
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${script} failed with code ${code}`));
      }
    });
  });
}
