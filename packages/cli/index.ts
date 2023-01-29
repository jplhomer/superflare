#!/usr/bin/env node

import Database from "better-sqlite3";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import path from "path";
import {
  addTypesToModelsInDirectory,
  generateTypesFromSqlite,
} from "./d1-types";
import { logger } from "./logger";

yargs(hideBin(process.argv))
  .command(
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
    },
    (argv) => {
      const db = new Database(argv.db as string);
      const modelsDirectory = argv.models as string;
      const types = generateTypesFromSqlite(db);
      const results = addTypesToModelsInDirectory(modelsDirectory, types, {
        createIfNotFound: argv.create as boolean,
      });

      logger.table(results);
    }
  )
  .parse();

export {};
