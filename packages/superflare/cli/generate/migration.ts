import { spawnSync } from "node:child_process";
import { getSuperflareConfig } from "../config";
import { logger } from "../logger";
import { CommonYargsArgv, StrictYargsOptionsToInterface } from "../yargs-types";

export function migrationOptions(yargs: CommonYargsArgv) {
  return yargs
    .positional("name", {
      describe: "The name of the migration",
      type: "string",
    })
    .option("db", {
      describe: "The local database binding to use for the migration",
      default: "",
    });
}

export async function migrationHandler(
  argv: StrictYargsOptionsToInterface<typeof migrationOptions>
) {
  // Tried including this in the options function but then TS failure :(
  const config = await getSuperflareConfig(process.cwd(), logger);

  const name = argv.name as string;
  const db = argv.db || config?.d1?.[0] || "DB";

  logger.info("Generating migration...");
  generateMigration(db, name);
  logger.info("Migration generated!");
}

export function generateMigration(db: string, name: string) {
  spawnSync("npx", ["wrangler", "d1", "migrations", "create", db, name, "-j"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NO_D1_WARNING: "true",
    },
  });
}
