import { CommonYargsArgv, StrictYargsOptionsToInterface } from "./yargs-types";
import {
  confirm,
  cancel,
  intro,
  isCancel,
  multiselect,
  outro,
  spinner,
  text,
  note,
} from "@clack/prompts";
import { cp, mkdtemp, readFile, rmdir, writeFile } from "fs/promises";
import { join, normalize } from "path";
import { tmpdir } from "os";
import { pipeline } from "stream/promises";
import gunzipMaybe from "gunzip-maybe";
import { extract } from "tar-fs";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import {
  hasAlreadySelectedAccount,
  parseAccountOutput,
  runWranglerCommand,
  selectAccount,
} from "./wrangler";

export function newOptions(yargs: CommonYargsArgv) {
  return yargs
    .option("template", {
      alias: "t",
      type: "string",
      description: "The template to use",
      default: "remix",
    })
    .option("ref", {
      type: "string",
      description: "Optional GitHub ref to use for templates",
      default: "main",
    })
    .option("repo", {
      type: "string",
      description: "Optional GitHub repo to use for templates",
      default: "jplhomer/superflare",
    })
    .positional("name", {
      type: "string",
      description: "The name of the app to create",
    });
}

interface Plan {
  d1?: string;
  r2?: string;
  queue?: string;
  durableOject?: string;
  scheduledTasks?: boolean;
}

export async function newHandler(
  argv: StrictYargsOptionsToInterface<typeof newOptions>
) {
  intro(`Create a new Superflare app`);

  const s = spinner();

  s.start(
    "Welcome! Checking that the Wrangler CLI is installed and authenticated"
  );

  let [isLoggedIn, output] = await ensureWranglerAuthenticated();

  if (!isLoggedIn) {
    s.stop("Hmm. Looks like you're not logged in yet.");

    const wantsToLogIn = await confirm({
      message:
        "You need to be logged into Wrangler to create a Superflare app. Log in now?",
    });

    if (isCancel(wantsToLogIn) || !wantsToLogIn) {
      cancel(
        "You need to be logged into Wrangler to be able to create a Superflare app."
      );
      process.exit(0);
    }

    await wranglerLogin();

    isLoggedIn = true;
    [, output] = await ensureWranglerAuthenticated();
  }

  const hasMultipleAccounts = parseAccountOutput(output).length > 1;

  s.stop("Everything looks good!");

  note(
    "Before using R2, Queues, and Durable objects,\n" +
      "make sure you've enabled them in the Cloudflare Dashboard.\n" +
      "https://dash.cloudflare.com/\n" +
      "Otherwise, the following commands might fail! 😬",
    "👋 Heads-up:"
  );

  let path = "";

  if (!argv.name) {
    const defaultPath = "./my-superflare-app";

    const pathResponse = await text({
      message: "Where would you like to create your app?",
      placeholder: defaultPath,
    });

    if (isCancel(pathResponse)) {
      cancel("Never mind!");
      process.exit(0);
    }

    path = pathResponse || defaultPath;
  } else {
    path = argv.name;

    // Prepend a relative path if necessary
    if (!path.startsWith(".") && !path.startsWith("/")) {
      path = `./${path}`;
    }
  }

  const appName = path.split("/").pop();

  if (!appName) {
    throw new Error("Invalid path");
  }

  // Validate appName. It should just be a string of letters, numbers, and dashes.
  if (!appName.match(/^[a-z0-9-]+$/)) {
    throw new Error(
      `Invalid app name: ${appName}. App names can only contain lowercase letters, numbers, and dashes.`
    );
  }

  s.start(`Creating a new Remix Superflare app in ${path}`);

  await generateTemplate(
    path,
    appName,
    argv.template || "remix",
    argv.repo,
    argv.ref
  );

  s.stop(`App created!`);

  async function buildPlan(): Promise<Plan> {
    const selections = await multiselect({
      message: `What features of Superflare do you plan to use? We'll create the resources for you.`,
      options: [
        {
          value: "database",
          label: "Database Models",
          hint: "We'll create a D1 database for you",
        },
        {
          value: "storage",
          label: "Storage",
          hint: "We'll create a R2 bucket for you",
        },
        {
          value: "queue",
          label: "Queues",
          hint: "We'll create a Queue consumer and producer for you",
        },
        {
          value: "broadcasting",
          label: "Broadcasting",
          hint: "We'll set up a Durable Object for you",
        },
        {
          value: "scheduledTasks",
          label: "Scheduled Tasks",
          hint: "We'll set up a cron trigger for you",
        },
      ],
      initialValues: [
        "database",
        "storage",
        "queue",
        "broadcasting",
        "scheduledTasks",
      ],
    });

    if (isCancel(selections)) {
      cancel("Never mind!");
      process.exit(0);
    }

    const plan: Plan = {};

    selections.forEach((selection) => {
      switch (selection) {
        case "database":
          plan.d1 = `${appName}-db`;
          break;
        case "storage":
          plan.r2 = `${appName}-bucket`;
          break;
        case "queue":
          plan.queue = `${appName}-queue`;
          break;
        case "broadcasting":
          plan.durableOject = `Channel`;
          break;
        case "scheduledTasks":
          plan.scheduledTasks = true;
          break;

        default:
          break;
      }
    });

    const confirmMessage = `We'll create the following resources for you:

${plan.d1 ? `  - D1 Database: ${plan.d1} (bound as DB)` : ""}
${plan.r2 ? `  - R2 Bucket: ${plan.r2} (bound as BUCKET)` : ""}
${plan.queue ? `  - Queue: ${plan.queue} (bound as QUEUE)` : ""}
${plan.durableOject ? `  - Durable Object: Channel (bound as CHANNEL)` : ""}
${
  plan.scheduledTasks
    ? `  - Scheduled Tasks: A cron trigger for every minute`
    : ""
}

Do you want to continue?`;

    const confirmation = await confirm({
      message: confirmMessage,
    });

    if (!confirmation || isCancel(confirmation)) {
      return await buildPlan();
    }

    return plan;
  }

  const plan = await buildPlan();

  let accountId;

  if (
    planMightRequireAccountSelection(plan) &&
    hasMultipleAccounts &&
    !(await hasAlreadySelectedAccount())
  ) {
    accountId = await selectAccount();
  }

  s.start("Creating resources...");

  const promises: TaskResult[] = [];

  if (plan.d1) {
    promises.push(createD1Database(plan.d1, accountId));
  }

  if (plan.r2) {
    promises.push(createR2Bucket(plan.r2, accountId));
  }

  if (plan.queue) {
    promises.push(createQueue(plan.queue, accountId));
  }

  if (plan.durableOject) {
    promises.push(setUpDurableObject(path, appName));
  }

  if (plan.scheduledTasks) {
    promises.push(
      Promise.resolve({
        success: true,
        message: "✅ Scheduled Tasks: Set up cron trigger for every minute",
        wranglerConfig: {
          triggers: {
            crons: ["* * * * *"],
          },
        },
      })
    );
  }

  const results = await Promise.all(promises);

  let wranglerConfig = {
    name: appName,
  };

  results.forEach((result) => {
    if (result.wranglerConfig) {
      wranglerConfig = {
        ...wranglerConfig,
        ...result.wranglerConfig,
      };
    }
  });

  await addToWranglerConfig(wranglerConfig, path);
  await writeSuperflareConfig(
    results.map((r) => r.superflareConfig).filter(Boolean),
    path
  );

  // Set an APP_KEY secret.
  const appKey = randomBytes(256).toString("base64");
  await setSecret("APP_KEY", appKey, path);

  s.stop("Done creating resources!");

  const allResults = results.map((r) => r.message);

  note(allResults.join("\n"), "Here's what we did:");

  outro(
    `You're all set! \`cd ${path}\`, run \`npm install\`, and then \`npx superflare migrate\` to get started.`
  );
}

function planMightRequireAccountSelection(plan: Plan) {
  return plan.d1 || plan.r2 || plan.queue;
}

async function generateTemplate(
  path: string,
  appName: string,
  template: string,
  repo: string,
  ref?: string
) {
  const templatePath = `templates/${template}`;

  // Download tarball to a temp directory
  const tempDir = await downloadGitHubTarball(repo, ref);

  // Copy the templatePath to the path
  await cp(join(tempDir, templatePath), path, { recursive: true });

  // Clean up
  await rmdir(tempDir, { recursive: true });

  // Update name in package.json
  const pkgJsonPath = join(path, "package.json");
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));
  pkgJson.name = appName;
  await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
}

async function downloadGitHubTarball(gitHubRepo: string, ref?: string) {
  const tempDir = await mkdtemp(join(tmpdir(), "superflare-"));

  // Get version of latest release from GitHub, and use that if no ref is specified.
  const release = await fetch(
    `https://api.github.com/repos/${gitHubRepo}/releases/latest`,
    { headers: { "user-agent": "Superflare CLI" } }
  );

  const { name } = (await release.json()) as { name: string };
  const gitHubRef = ref || name || "main";

  const downloadUrl = new URL(
    `https://api.github.com/repos/${gitHubRepo}/tarball/${gitHubRef}`
  );

  const response = await fetch(downloadUrl.toString(), {
    headers: { "user-agent": "Superflare CLI" },
  });

  await pipeline(
    // Download
    // @ts-ignore
    response.body!,
    // Decompress
    gunzipMaybe(),
    // Unpack
    extract(tempDir, {
      strip: 1,
      filter: (name) => {
        name = name.replace(tempDir, "");
        return !name.startsWith(normalize("/templates/"));
      },
    })
  );

  return tempDir;
}

type TaskResult = Promise<{
  success: boolean;
  message: string;
  wranglerConfig?: any;
  superflareConfig?: any;
}>;

async function createD1Database(name: string, accountId?: string): TaskResult {
  try {
    const result = await runWranglerCommand(["d1", "create", name], accountId);

    // Parse the ID out of the stdout:
    // database_id = "79da141d-acd3-4d64-adb1-9a50f8ed7e2b"
    const databaseId = result.stdout
      .split("\n")
      .find((line) => line.startsWith("database_id"))
      ?.split("=")[1]
      ?.trim()
      .replace(/"/g, "");

    if (!databaseId) {
      return {
        success: false,
        message: `🤔 D1 Database: ${name} created, but we couldn't parse the ID. Check your Cloudflare Dashboard to find it.`,
      };
    }

    return {
      success: true,
      message: `✅ D1 Database: ${name} created!`,
      wranglerConfig: {
        d1_databases: [
          {
            binding: "DB",
            database_name: name,
            database_id: databaseId,
          },
        ],
      },
      superflareConfig: `database: {\n  default: ctx.env.DB,\n},`,
    };
  } catch (e: any) {
    return {
      success: false,
      message: `❌ D1 Database: ${e.stderr || e.stdout || e.message}`,
    };
  }
}

async function createR2Bucket(name: string, accountId?: string): TaskResult {
  try {
    await runWranglerCommand(["r2", "bucket", "create", name], accountId);

    return {
      success: true,
      message: `✅ R2 Bucket: ${name} created!`,
      wranglerConfig: {
        r2_buckets: [
          {
            binding: "BUCKET",
            bucket_name: name,
            preview_bucket_name: "BUCKET",
          },
        ],
      },
      superflareConfig: `storage: {
  default: {
    binding: ctx.env.BUCKET,
  },
},`,
    };
  } catch (e: any) {
    return {
      success: false,
      message: `❌ R2 Bucket: ${e.stderr || e.stdout || e.message}`,
    };
  }
}

async function createQueue(name: string, accountId?: string): TaskResult {
  try {
    await runWranglerCommand(["queues", "create", name], accountId);

    return {
      success: true,
      message: `✅ Queue: ${name} created!`,
      wranglerConfig: {
        queues: {
          producers: [
            {
              queue: name,
              binding: "QUEUE",
            },
          ],
          consumers: [
            {
              queue: name,
            },
          ],
        },
      },
      superflareConfig: `queues: {\n  default: ctx.env.QUEUE,\n},`,
    };
  } catch (e: any) {
    return {
      success: false,
      message: `❌ Queue: ${e.stderr || e.stdout || e.message}`,
    };
  }
}

async function setUpDurableObject(pathName: string, appName: string) {
  // Add `export { Channel } from "superflare";` to the end of `worker.ts`:
  const workerPath = join(pathName, "worker.ts");
  const contents = await readFile(workerPath, "utf-8");
  await writeFile(
    workerPath,
    `${contents}\nexport { Channel } from "superflare";`
  );

  return {
    success: true,
    message: `✅ Durable Object: Added binding and Channel export to worker.ts`,
    wranglerConfig: {
      durable_objects: {
        bindings: [
          {
            name: "CHANNELS",
            class_name: "Channel",
            script_name: appName,
          },
        ],
      },
      migrations: [
        {
          tag: "v1",
          new_classes: ["Channel"],
        },
      ],
    },
    superflareConfig: `channels: {\n  default: {\n    binding: ctx.env.CHANNELS,\n  },\n},`,
  };
}

/**
 * Update the project's wrangler config with some new config.
 */
async function addToWranglerConfig(
  config: Record<string, any>,
  pathName: string
) {
  let wranglerConfigPath = join(pathName, "wrangler.toml");

  try {
    throw new Error("not implemented for TOML yet");
    // const wranglerConfig = await readToml(wranglerConfigPath);

    // await writeToml(wranglerConfigPath, {
    //   ...wranglerConfig,
    //   ...config,
    // });
  } catch (e) {
    // Must be using wrangler.json...
    wranglerConfigPath = join(pathName, "wrangler.json");
    const wranglerConfig = JSON.parse(
      await readFile(wranglerConfigPath, "utf-8")
    );

    await writeFile(
      wranglerConfigPath,
      JSON.stringify(
        {
          ...wranglerConfig,
          ...config,
        },
        null,
        2
      )
    );
  }
}

/**
 * Write the superflare.config.ts file from scratch. This is pretty jank.
 */
async function writeSuperflareConfig(chunks: string[], pathName: string) {
  const superflareConfigPath = join(pathName, "superflare.config.ts");

  let contents = `import { defineConfig } from "superflare";\n\nexport default defineConfig<Env>((ctx) => {\n  return {\n`;

  const indentation = "    ";

  contents += indentation + "appKey: ctx.env.APP_KEY,\n";

  chunks.forEach((chunk) => {
    chunk.split("\n").forEach((line) => {
      contents += `${indentation}${line}\n`;
    });
  });

  contents += `  };\n});`;

  await writeFile(superflareConfigPath, contents);
}

/**
 * Check to see whether the user is logged in.
 * BONUS: I think this also forces Wrangler to check for an existing auth token,
 * which will help us later on when we need to create resources without making
 * the user complete the auth flow over again.
 *
 * @returns [boolean, string] - [isLoggedIn, output]
 */
async function ensureWranglerAuthenticated(): Promise<[boolean, string]> {
  try {
    const result = await runWranglerCommand(["whoami"]);

    return [
      !result.stdout.includes("You are not authenticated"),
      result.stdout,
    ];
  } catch (_e: any) {
    // Some older versions of Wrangler return a non-zero exit code when
    // you're not logged in.
    return [false, _e.toString()];
  }
}

/**
 * Pop open the Wrangler login flow.
 */
async function wranglerLogin() {
  return await new Promise<void>((resolve, reject) => {
    spawn("npx", ["wrangler", "login"], { stdio: "inherit" }).on(
      "close",
      (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject();
        }
      }
    );
  });
}

async function setSecret(key: string, value: string, path: string) {
  const devVarsPath = join(path, ".dev.vars");
  let contents = "";

  try {
    contents = await readFile(devVarsPath, "utf-8");
  } catch (_e) {
    // Ignore
  }

  contents += `${key}=${value}`;

  await writeFile(devVarsPath, contents);

  // TODO: Set the secret in Wrangler, someday. I don't know how right now.
}
