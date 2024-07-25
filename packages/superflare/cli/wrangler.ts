import { spawn } from "node:child_process";

export type WranglerCommandResponse = {
  code: number;
  stdout: string;
  stderr: string;
};

/**
 * Run a wrangler command. It would be great to replace this with a real exported API instead
 * of spawning a child process every time.
 */
export async function runWranglerCommand(
  command: string[]
): Promise<WranglerCommandResponse> {
  let stdout = "";
  let stderr = "";

  const child = spawn("npx", ["wrangler@latest", ...command], {
    shell: true,
    env: process.env,
  });

  child.stderr.on("data", (data) => {
    stderr += data;
  });
  child.stdout.on("data", (data) => {
    stdout += data;
  });

  return new Promise((resolve, reject) => {
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }

      reject({ code, stdout, stderr });
    });
  });
}

/**
 * Spawn a child process to execute: npx wrangler d1 migrations apply DB --local
 */
export async function wranglerMigrate(dbName: string) {
  return await runWranglerCommand([
    "d1",
    "migrations",
    "apply",
    dbName,
    "--local",
    "-j",
  ]);
}
