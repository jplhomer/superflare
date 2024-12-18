import { select } from "@clack/prompts";
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
  command: string[],
  accountId?: string
): Promise<WranglerCommandResponse> {
  let stdout = "";
  let stderr = "";

  const env = {
    ...process.env,
  };

  if (accountId) {
    env.CLOUDFLARE_ACCOUNT_ID = accountId;
  }

  const child = spawn("npx", ["wrangler", ...command], {
    shell: true,
    env,
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
 * Select an account if there are multiple accounts available.
 *
 * @returns The selected account ID
 */
export async function selectAccount(): Promise<string> {
  const response = await runWranglerCommand(["whoami"]);
  const accounts = parseAccountOutput(response.stdout);

  if (accounts.length === 0) {
    throw new Error("No accounts found");
  }

  if (accounts.length === 1) {
    return accounts[0].accountID;
  }

  const selected = (await select({
    message:
      "Please select an account which Cloudflare account you'd like to use",
    options: accounts.map((account) => ({
      label: account.accountName,
      value: account.accountID,
    })),
  })) as string;

  return selected;
}

export function parseAccountOutput(
  output: string
): { accountName: string; accountID: string }[] {
  const lines = output.split("\n");
  const accounts: { accountName: string; accountID: string }[] = [];

  // Skip the header and footer lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip separator/irrelevant lines
    if (!line.startsWith("│") || line.includes("Account Name")) {
      continue;
    }

    const [_, accountName, accountID] = line.split("│").map((x) => x.trim());
    accounts.push({ accountName, accountID });
  }

  return accounts;
}

/**
 * Run a wrangler command to see if we're prompted to select an account.
 * We do this to check if Wrangler has cached it yet; we don't want to prompt the user
 * every single time for an account if they've recently chosen one.
 *
 * @returns true if the user has already selected an account
 */
export async function hasAlreadySelectedAccount(): Promise<boolean> {
  const matchingText = "More than one account available";
  try {
    const response = await runWranglerCommand(["d1", "list"]);
    return !response.stdout.includes(matchingText);
  } catch (error: any) {
    if (error.stderr.includes(matchingText)) {
      return false;
    }
    throw error;
  }
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
  ]);
}
