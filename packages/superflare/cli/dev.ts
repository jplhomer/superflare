import { spawn } from "node:child_process";
import { getSuperflareConfigFromPackageJson } from "./config";
import { logger } from "./logger";
import { CommonYargsArgv, StrictYargsOptionsToInterface } from "./yargs-types";

export function devOptions(yargs: CommonYargsArgv) {
  return yargs;
}

export async function devHandler(
  argv: StrictYargsOptionsToInterface<typeof devOptions>
) {
  logger.info('Starting "wrangler pages dev"...');

  const config = await getSuperflareConfigFromPackageJson(
    process.cwd(),
    logger
  );
  if (!config) {
    logger.warn(
      "Warning: Did not find a `superflare` config in your package.json. " +
        "You will want to add one in order to specify D1 and R2 bindings for Superflare to use."
    );
  }

  const d1Bindings = config?.d1;

  if (d1Bindings && Array.isArray(d1Bindings)) {
    logger.info(`Using D1 binding: ${d1Bindings.join(", ")}`);
  }

  const r2Bindings = config?.r2;

  if (r2Bindings && Array.isArray(r2Bindings)) {
    logger.info(`Using R2 bindings: ${r2Bindings.join(", ")}`);
  }

  const args = [
    "wrangler",
    "pages",
    "dev",
    "public",
    "--compatibility-date=2023-01-18",
    d1Bindings?.length &&
      d1Bindings.map((d1Binding) => `--d1 ${d1Binding}`).join(" "),
    r2Bindings?.length &&
      r2Bindings.map((r2Binding) => `--r2 ${r2Binding}`).join(" "),
    "--binding",
    "SESSION_SECRET=secret",
    "--local",
    "--persist",
    "--live-reload",
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
