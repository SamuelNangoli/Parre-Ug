import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const children = [];
let closing = false;
const close = (code) => {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
};
const api = spawn(process.execPath, ["server/index.js"], {
  cwd: root,
  stdio: "inherit",
});
children.push(api);
api.on("error", () => close(1));
api.on("exit", (code) => close(code || 0));
const port = process.env.PARRE_API_PORT || "4174";
try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (closing) break;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* API still starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!ready || closing) close(1);
  else {
    const vite = spawn(
      process.execPath,
      ["node_modules/vite/bin/vite.js", ...process.argv.slice(2)],
      { cwd: root, stdio: "inherit" },
    );
    children.push(vite);
    vite.on("error", () => close(1));
    vite.on("exit", (code) => close(code || 0));
  }
} catch {
  close(1);
}
process.on("SIGINT", () => close(0));
process.on("SIGTERM", () => close(0));
