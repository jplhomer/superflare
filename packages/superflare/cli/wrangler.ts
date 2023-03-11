import { spawn } from "node:child_process";

/**
 * Spawn a child process to execute: npx wrangler d1 migrations apply DB --local
 */
export async function wranglerMigrate() {
  return new Promise<void>((resolve, reject) => {
    spawn(
      "npx",
      ["wrangler", "d1", "migrations", "apply", "DB", "--local", "-j"],
      {
        env: {
          ...process.env,
          CI: "true",
        },
      }
    ).on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `npx wrangler d1 migrations apply DB --local exited with code ${code}`
          )
        );
      }
    });
  });
}
