import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { toSnakeCase } from "../../src/string";
import { getSuperflareConfig } from "../config";
import { logger } from "../logger";
import { defaultSuperflareMigrationsPath } from "../migrate";
import { blankMigration } from "../stubs/migration.stub";
import { CommonYargsArgv, StrictYargsOptionsToInterface } from "../yargs-types";

export function migrationOptions(yargs: CommonYargsArgv) {
  return yargs.positional("name", {
    describe: "The name of the migration",
    type: "string",
  });
}

export async function migrationHandler(
  argv: StrictYargsOptionsToInterface<typeof migrationOptions>
) {
  const name = argv.name as string;

  generateMigration(name);
}

export async function generateMigration(
  name: string,
  rootPath = process.cwd()
) {
  const wranglerMigrationsPath = join(rootPath, "migrations");

  let nextMigrationNumberInteger = 0;

  try {
    const existingMigrations = await readdir(wranglerMigrationsPath);
    nextMigrationNumberInteger = getNextMigrationNumber(existingMigrations);
  } catch (_e) {
    // No migrations folder exists yet; start with 0.
  }

  // Make the next migration number a string with leading zeros.
  const nextMigrationNumber = nextMigrationNumberInteger
    .toString()
    .padStart(4, "0");
  const migrationName = `${nextMigrationNumber}_${toSnakeCase(name)}`;
  const migrationsPath = defaultSuperflareMigrationsPath(rootPath);
  await mkdir(migrationsPath, { recursive: true });

  const migrationPath = join(migrationsPath, `${migrationName}.ts`);
  await writeFile(migrationPath, blankMigration());

  logger.info(`Migration generated at ${migrationPath}`);
}

function getNextMigrationNumber(existingMigrations: string[]) {
  if (!existingMigrations.length) {
    return 0;
  }

  const mostRecentMigration = existingMigrations
    .filter((migration) => migration.match(/^[0-9]{4}_/))
    .sort()
    .pop();
  const mostRecentMigrationNumber = mostRecentMigration?.split("_")[0];

  if (!mostRecentMigrationNumber) {
    throw new Error("Could not determine most recent migration number");
  }

  return parseInt(mostRecentMigrationNumber, 10) + 1;
}
