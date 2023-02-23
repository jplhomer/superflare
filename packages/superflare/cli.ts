#!/usr/bin/env node

import Database from "better-sqlite3";
import makeCLI from "yargs";
import { hideBin } from "yargs/helpers";
import path from "path";
import fs from "fs";
import {
  addTypesToModelsInDirectory,
  generateTypesFromSqlite,
} from "./d1-types";
import { logger } from "./logger";
import { wranglerMigrate } from "./wrangler";

function createCLIParser(argv: string[]) {
  const superflare = makeCLI(argv).strict().scriptName("superflare");

  superflare.help().alias("help", "h");

  // Migrate
  superflare.command(
    "migrate",
    "⚡️ migrate your database and update types",
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
    },
    async (argv) => {
      const fresh = argv.fresh as boolean;
      const modelsDirectory = argv.models as string;
      const dbPath = argv.db as string;

      if (fresh) {
        if (fs.existsSync(dbPath)) {
          fs.rmSync(dbPath);
        }
        await wranglerMigrate();
      }

      const db = new Database(dbPath);

      const types = generateTypesFromSqlite(db);
      const results = addTypesToModelsInDirectory(modelsDirectory, types, {
        createIfNotFound: argv.create as boolean,
      });

      logger.table(results);
    }
  );

  return superflare;
}

createCLIParser(hideBin(process.argv)).parse();
