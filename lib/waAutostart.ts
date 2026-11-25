// Dev convenience: starts wa-bridge with the Next server so the WhatsApp QR shows up in Settings on its own.
// Skipped when WA_BRIDGE_URL is set (you run the bridge yourself), in production, or with WA_BRIDGE_AUTOSTART=0.
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "wa-bridge");
const TOKEN_FILE = path.join(DIR, ".token"); // git-ignored; stable so a bridge left running survives dev restarts
const PORT = 8790;
const g = globalThis as { __waBridge?: ChildProcess | "starting" };

function run(cmd: string, args: string[], opts: { cwd: string; env?: NodeJS.ProcessEnv }) {
  return spawn(cmd, args, { ...opts, stdio: "inherit" });
}

async function alive(token: string) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/health`, { headers: { "x-bridge-token": token }, signal: AbortSignal.timeout(1000) });
    return r.ok;
  } catch {
    return false;
  }
}

async function start() {
  if (process.env.NODE_ENV === "production" || process.env.WA_BRIDGE_AUTOSTART === "0" || process.env.WA_BRIDGE_URL) return;
  if (!existsSync(path.join(DIR, "server.mjs")) || g.__waBridge) return;
  g.__waBridge = "starting";

  let token = existsSync(TOKEN_FILE) ? readFileSync(TOKEN_FILE, "utf8").trim() : "";
  if (token.length < 16) {
    token = randomBytes(24).toString("hex");
    writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
  }
  process.env.WA_BRIDGE_URL = `http://127.0.0.1:${PORT}`;
  process.env.WA_BRIDGE_TOKEN = token;
  if (await alive(token)) return; // already running from an earlier dev session

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  if (!existsSync(path.join(DIR, "node_modules"))) {
    console.log("[wa-bridge] first run: installing (≈30 s)…");
    const code = await new Promise<number | null>((res) => run(npm, ["install", "--no-audit", "--no-fund"], { cwd: DIR }).on("exit", res));
    if (code !== 0) return console.error("[wa-bridge] npm install failed; WhatsApp stays off");
  }
  let quitting = false;
  process.on("exit", () => {
    quitting = true;
    if (g.__waBridge && g.__waBridge !== "starting") g.__waBridge.kill();
  });
  const launch = () => {
    const child = run(process.execPath, ["server.mjs"], { cwd: DIR, env: { ...process.env, WA_BRIDGE_TOKEN: token, PORT: String(PORT) } });
    g.__waBridge = child;
    // Crashed or killed? Bring it back, so WhatsApp doesn't silently stop working mid-wedding.
    child.on("exit", () => !quitting && setTimeout(async () => !(await alive(token)) && launch(), 3000));
  };
  launch();
}

// Don't block server startup on npm install.
void start();
