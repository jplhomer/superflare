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
    `Starting "wrangler" in ${isPagesMode ? "pages" : "workers"} mode...`
  );

  const config = await getSuperflareConfig(process.cwd(), logger);
  if (!config) {
    logger.warn(
      "Warning: Did not find a `superflare.config.ts` in your project. " +
        "You will want to add one in order to specify D1 and R2 bindings for Superflare to use."
    );
  }

  const d1Bindings = config?.d1;

  if (
    isPagesMode &&
    d1Bindings &&
    Array.isArray(d1Bindings) &&
    d1Bindings.length
  ) {
    logger.info(`Using D1 binding: ${d1Bindings.join(", ")}`);
  }

  const r2Bindings = config?.r2;

  if (
    isPagesMode &&
    r2Bindings &&
    Array.isArray(r2Bindings) &&
    r2Bindings.length
  ) {
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

  /**
   * Normalize bindings. :sigh:
   * - `workers pages dev` expects bindings in the shape of `binding KEY=VALUE`
   * - `wrangler dev` expects bindings in the shape of `--var KEY:VALUE`
   */
  const normalizedBindings = argv.binding.map((binding) => {
    if (typeof binding !== "string") return binding;

    const [key, value] = binding.split("=");
    return isWorkersMode ? `${key}:${value}` : `${key}=${value}`;
  });

  const args = [
    "wrangler",
    isPagesMode && "pages",
    "dev",
    isPagesMode && "public",
    isWorkersMode && workersEntrypoint,
    isWorkersMode && "--site public",
    "--compatibility-date",
    argv.compatibilityDate,
    "---compatibility-flag",
    "nodejs_compat",
    "--port",
    argv.port,
    isPagesMode &&
      d1Bindings?.length &&
      d1Bindings.map((d1Binding) => `--d1 ${d1Binding}`).join(" "),
    isPagesMode &&
      r2Bindings?.length &&
      r2Bindings.map((r2Binding) => `--r2 ${r2Binding}`).join(" "),
    ...normalizedBindings.map(
      (binding) => "--" + `${isPagesMode ? "binding" : "var"} ${binding}`
    ),
    "--local",
    "--persist",
    "--experimental-json-config",
    "--test-scheduled",
    argv.liveReload && "--live-reload",
  ].filter(Boolean) as string[];

  spawn("npx", args, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      // TODO: Remove this when D1 is stable
      NO_D1_WARNING: "true",
    },
  });
}
