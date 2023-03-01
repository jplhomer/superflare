import { CommonYargsArgv, StrictYargsOptionsToInterface } from "./yargs-types";
import path from "node:path";
import fs from "node:fs/promises";
import { logger } from "./logger";
import { wranglerMigrate } from "./wrangler";
import {
  addTypesToModelsInDirectory,
  generateTypesFromSqlite,
} from "./d1-types";
import { seedDb } from "./db/seed";
import { createSQLiteDB } from "./d1-database";

export function migrateOptions(yargs: CommonYargsArgv) {
  return yargs
    .option("db", {
      alias: "d",
      describe: "Path to the database",

      // Default to the path in the .wrangler directory
      default: path.join(
        process.cwd(),
        ".wrangler",
        "state",
        "d1",
        "DB.sqlite3"
      ),
    })
    .option("models", {
      alias: "m",
      describe: "Path to the models directory",

      // Default to the path in the app directory
      default: path.join(process.cwd(), "app", "models"),
    })
    .option("create", {
      boolean: true,
      alias: "c",
      describe: "Create a model if it doesn't exist",
      default: false,
    })
    .option("fresh", {
      alias: "f",
      boolean: true,
      default: false,
      describe: "Run a fresh migration by dropping the existing database",
    })
    .option("seed", {
      alias: "s",
      describe: "Seed the database after migrating",
      boolean: true,
      default: false,
    })
    .option("seed-path", {
      describe: "Path to the seed file",
      default: path.join(process.cwd(), "db", "seed.ts"),
    });
}

export async function migrateHandler(
  argv: StrictYargsOptionsToInterface<typeof migrateOptions>
) {
  const fresh = argv.fresh;
  const modelsDirectory = argv.models;
  const dbPath = argv.db;

  logger.info(`Migrating database...`);

  if (fresh) {
    logger.info("Dropping existing database...");

    try {
      await fs.rm(dbPath);
    } catch (_e: any) {
      // We don't care if the file doesn't exist
    }
  }

  await wranglerMigrate();

  const db = await createSQLiteDB(dbPath, logger.log);

  const seed = argv.seed;
  const seedPath = argv.seedPath;
  if (seed && seedPath) {
    await seedDb(dbPath, seedPath);
  }

  logger.info("Generating types from database...");
  const types = generateTypesFromSqlite(db);
  const results = addTypesToModelsInDirectory(modelsDirectory, types, {
    createIfNotFound: argv.create as boolean,
  });

  logger.table(results);

  logger.info("Done!");
}
