import { CommonYargsArgv, StrictYargsOptionsToInterface } from "./yargs-types";
import path from "node:path";
import fs, { mkdir, readdir, writeFile } from "node:fs/promises";
import fsSync from "node:fs";
import { logger } from "./logger";
import { wranglerMigrate } from "./wrangler";
import { createD1Database } from "./d1-database";
import { generateTypesFromSqlite, syncSuperflareTypes } from "./d1-types";
import { seedDb } from "./db/seed";
import { Schema } from "../src/schema";
import { register } from "esbuild-register/dist/node";

export function defaultSuperflareMigrationsPath(rootPath = process.cwd()) {
  return path.join(rootPath, "db", "migrations");
}

export function defaultSuperflareDatabasePath(rootPath = process.cwd()) {
  try {
    const wranglerConfig = fsSync.readFileSync(
      path.join(rootPath, "wrangler.json"),
      "utf8"
    );
    const wranglerConfigJson = JSON.parse(wranglerConfig);
    const d1DatabaseId = wranglerConfigJson?.d1_databases?.[0]?.database_id;

    return path.join(
      rootPath,
      ".wrangler",
      "state",
      "v3",
      "d1",
      d1DatabaseId,
      "db.sqlite"
    );
  } catch (e) {
    return path.join(rootPath, ".wrangler", "state", "d1", "db.sqlite");
  }
}

export function migrateOptions(yargs: CommonYargsArgv) {
  return yargs
    .option("db", {
      alias: "d",
      describe: "Path to the database",

      // Default to the path in the .wrangler directory
      default: defaultSuperflareDatabasePath(),
    })
    .option("models", {
      alias: "m",
      describe: "Path to the models directory",

      // Default to the path in the app directory
      default: path.join(process.cwd(), "app", "models"),
    })
    .option("superflare-migrations", {
      describe: "Path to the Superflare migrations directory",

      // Default to the path in the app directory
      default: defaultSuperflareMigrationsPath(),
    })
    .option("wrangler-migrations", {
      describe: "Path to the Wrangler migrations directory",

      // Default to the path in the app directory
      default: path.join(process.cwd(), "migrations"),
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
  const superflareMigrationsPath = argv.superflareMigrations;
  const wranglerMigrationsPath = argv.wranglerMigrations;

  logger.info(`Compiling migrations...`);
  await compileMigrations(superflareMigrationsPath, wranglerMigrationsPath);

  if (fresh) {
    logger.info("Dropping existing database...");

    try {
      await fs.rm(dbPath);
    } catch (_e: any) {
      // We don't care if the file doesn't exist
    }
  }

  logger.info(`Migrating database...`);
  try {
    const results = await wranglerMigrate();

    // Always print results. Sometimes D1 errors with an exit code of 0, so we
    // can't rely on that. Plus, it might be nice to help the user with debugging.
    logger.info(results.stdout);
  } catch (e: any) {
    logger.error(
      "❌ An error occurred while running wrangler migrations:\n" + e.stderr ||
        e.stdout ||
        e.message
    );
    process.exit(1);
  }

  const db = await createD1Database(dbPath);

  const seed = argv.seed;
  const seedPath = argv.seedPath;
  if (seed && seedPath) {
    await seedDb(dbPath, seedPath);
  }

  logger.info("Generating types from database...");
  const types = await generateTypesFromSqlite(db);
  const results = syncSuperflareTypes(process.cwd(), modelsDirectory, types, {
    createIfNotFound: argv.create as boolean,
  });

  logger.table(results);

  logger.info("Done!");
}

/**
 * Compile Superflare migrations, defined as TypeScript Schema builders, into Wrangler migrations,
 * which are SQL files in a different directory.
 */
export async function compileMigrations(
  pathToSuperflareMigrations: string,
  pathToWranglerMigrations: string
) {
  const { unregister } = register({});

  // Make it if it doesn't exist
  await mkdir(pathToSuperflareMigrations, { recursive: true });

  const migrations = (await readdir(pathToSuperflareMigrations))
    .filter((filename) => filename.endsWith(".ts"))
    .map((filename) => {
      const migration = require(path.join(
        pathToSuperflareMigrations,
        filename
      ));

      return {
        filename,
        schema: migration.default() as Schema | Schema[],
      };
    });

  // Make it if it doesn't exist
  await mkdir(pathToWranglerMigrations, { recursive: true });

  for (const migration of migrations) {
    const sql = Array.isArray(migration.schema)
      ? migration.schema.map((s) => s.toSql()).join("\n\n")
      : migration.schema.toSql();
    const migrationNumber = migration.filename.split(/_/)[0];
    const timestamp = new Date().toISOString();
    let banner = `-- Migration number: ${migrationNumber} 	 ${timestamp}\n`;
    banner += `-- Autogenerated by Superflare. Do not edit this file directly.`;
    const contents = `${banner}\n${sql}`;

    await writeFile(
      path.join(
        pathToWranglerMigrations,
        migration.filename.replace(".ts", ".sql")
      ),
      contents
    );
  }

  unregister();
}
