#!/usr/bin/env node

import Database from "better-sqlite3";
import makeCLI from "yargs";
import { hideBin } from "yargs/helpers";
import path from "node:path";
import fs from "node:fs";
import {
  addTypesToModelsInDirectory,
  generateTypesFromSqlite,
} from "./d1-types";
import { Logger, logger } from "./logger";
import { wranglerMigrate } from "./wrangler";
import { register } from "esbuild-register/dist/node";
import { createD1Database } from "./d1-database";
import { spawn } from "node:child_process";

export class CommandLineArgsError extends Error {}

function createCLIParser(argv: string[]) {
  const superflare = makeCLI(argv).strict().scriptName("superflare");

  superflare.help().alias("help", "h");

  // Help
  superflare.command(
    ["*"],
    false,
    () => {},
    async (args) => {
      if (args._.length > 0) {
        throw new CommandLineArgsError(`Unknown command: ${args._}.`);
      } else {
        superflare.showHelp("log");
      }
    }
  );

  // Migrate
  superflare.command(
    "migrate",
    "🏗️  migrate your database and update types",
    (yargs) => {
      // Option to specify the path to the database
      yargs.option("db", {
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
      });

      // Option to specify the path to the models directory
      yargs.option("models", {
        alias: "m",
        describe: "Path to the models directory",

        // Default to the path in the app directory
        default: path.join(process.cwd(), "app", "models"),
      });

      // Option to create a model if it doesn't exist
      yargs.option("create", {
        boolean: true,
        alias: "c",
        describe: "Create a model if it doesn't exist",
        default: false,
      });

      // Option to run a "fresh" migration by dropping the existing database first
      yargs.option("fresh", {
        alias: "f",
        boolean: true,
        default: false,
        describe: "Run a fresh migration by dropping the existing database",
      });

      yargs.option("seed", {
        alias: "s",
        describe: "Seed the database after migrating",
        boolean: true,
        default: false,
      });

      yargs.option("seed-path", {
        describe: "Path to the seed file",
        default: path.join(process.cwd(), "db", "seed.ts"),
      });
    },
    async (argv) => {
      const fresh = argv.fresh as boolean;
      const modelsDirectory = argv.models as string;
      const dbPath = argv.db as string;

      logger.info(`Migrating database...`);

      if (fresh) {
        logger.info("Dropping existing database...");

        if (fs.existsSync(dbPath)) {
          fs.rmSync(dbPath);
        }
      }

      await wranglerMigrate();

      const db = new Database(dbPath);

      const seed = argv.seed as string;
      const seedPath = argv["seed-path"] as string;
      if (seed && seedPath && fs.existsSync(seedPath)) {
        logger.info(`Seeding database...`);

        register();
        const seedModule = require(seedPath);
        const d1Database = createD1Database(db);
        // TODO: Find out why errors in the seeder are not bubbled to this try/catch
        try {
          if (seedModule.default) {
            await seedModule.default(d1Database);
            logger.info(`Seeding complete!`);
          } else {
            logger.warn(
              `Warning: Did not find a default export in ${seedPath}.`
            );
          }
        } catch (e: any) {
          logger.error(`Error seeding database: ${e.message}`);
        }
      }

      logger.info("Generating types from database...");
      const types = generateTypesFromSqlite(db);
      const results = addTypesToModelsInDirectory(modelsDirectory, types, {
        createIfNotFound: argv.create as boolean,
      });

      logger.table(results);

      logger.info("Done!");
    }
  );

  superflare.command(
    "dev",
    "🏄 start the development server",
    (yargs) => {},
    async (argv) => {
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

      const d1Binding = config?.d1;

      if (d1Binding) {
        logger.info(`Using D1 binding: ${d1Binding}`);
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
        d1Binding && `--d1 ${d1Binding}`,
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
  );

  return superflare;
}

interface SuperflarePackageJsonConfig {
  d1?: string;
  r2?: string[];
}

export async function getSuperflareConfigFromPackageJson(
  workingDir: string,
  logger?: Logger
): Promise<SuperflarePackageJsonConfig | null> {
  try {
    const pkg = require(path.join(workingDir, "package.json"));
    return pkg.superflare;
  } catch (e: any) {
    logger?.debug(`Error loading package.json: ${e.message}`);
    return null;
  }
}

createCLIParser(hideBin(process.argv)).parse();
