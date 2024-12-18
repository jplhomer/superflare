import { spawn } from "node:child_process";
import { getSuperflareConfig, getWranglerJsonConfig } from "./config";
import { logger } from "./logger";
import { CommonYargsArgv, StrictYargsOptionsToInterface } from "./yargs-types";

export function devOptions(yargs: CommonYargsArgv) {
  return yargs
    .option("mode", {
      type: "string",
      choices: ["workers", "pages"],
      description:
        "Whether to run in workers or pages mode. Defaults to workers.",
      default: "workers",
    })
    .positional("entrypoint", {
      type: "string",
      description: "The entrypoint to use for the workers dev server.",
    })
    .option("compatibility-date", {
      type: "string",
      description:
        "The date to use for compatibility mode. Defaults to the current date.",
      default: new Date().toISOString().split("T")[0],
    })
    .option("port", {
      type: "number",
      description: "The port to run the dev server on. Defaults to 8788.",
      default: 8788,
    })
    .option("binding", {
      alias: "b",
      type: "array",
      description:
        "A binding to pass to the dev command. Can be specified multiple times. Works for both workers and pages.",
      default: [],
    })
    .option("live-reload", {
      type: "boolean",
      description: "Whether to enable live reload. Defaults to true.",
      default: true,
    });
}

export async function devHandler(
  argv: StrictYargsOptionsToInterface<typeof devOptions>
) {
  const isPagesMode = argv.mode === "pages";
  const isWorkersMode = !isPagesMode;

  logger.info(
    `Starting "wrangler" and ViteDevServer in ${
      isPagesMode ? "pages" : "workers"
    } mode...`
  );

  const config = await getSuperflareConfig(process.cwd(), logger);
  if (!config) {
    logger.warn(
      "Warning: Did not find a `superflare.config.ts` in your project. " +
        "You will want to add one in order to provide your appKey and D1 and R2 bindings for Superflare to use.\n" +
        "More info: https://superflare.dev/reference/superflare-config"
    );
  }

  const d1Bindings = config?.d1;

  if (d1Bindings && Array.isArray(d1Bindings) && d1Bindings.length) {
    logger.info(`Using D1 binding: ${d1Bindings.join(", ")}`);
  }

  const r2Bindings = config?.r2;

  if (r2Bindings && Array.isArray(r2Bindings) && r2Bindings.length) {
    logger.info(`Using R2 bindings: ${r2Bindings.join(", ")}`);
  }

  const wranglerJsonConfig = await getWranglerJsonConfig(process.cwd(), logger);
  const workersEntrypoint = argv.entrypoint ?? wranglerJsonConfig?.main;

  if (isWorkersMode && !workersEntrypoint) {
    logger.error(
      "Error: You must set a `main` value pointing to your entrypoint in your `wrangler.json` in order to run in workers mode."
    );
    process.exit(1);
  }

  spawn("wrangler", ["dev", "--no-bundle"], {
    stdio: "ignore",
    shell: true,
    env: process.env,
  });

  spawn("remix", ["vite:dev"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
}
