import { spawnSync } from "node:child_process";
import { Argv } from "yargs";
import { getSuperflareConfigFromPackageJson } from "./config";
import { logger } from "./logger";

export function generate(yargs: Argv) {
  return yargs.command(
    "migration <name>",
    "Generate a migration",
    async (yargs) => {
      const config = await getSuperflareConfigFromPackageJson(
        process.cwd(),
        logger
      );

      yargs.positional("name", {
        describe: "The name of the migration",
        type: "string",
      });

      yargs.option("db", {
        describe: "The local database binding to use for the migration",
        default: config?.d1?.[0] ?? "DB",
      });
    },
    async (argv) => {
      const name = argv.name as string;
      const db = argv.db as string;

      logger.info("Generating migration...");
      spawnSync("npx", ["wrangler", "d1", "migrations", "create", db, name], {
        stdio: "inherit",
        env: {
          ...process.env,
          NO_D1_WARNING: "true",
        },
      });
      logger.info("Migration generated!");
    }
  );
}
