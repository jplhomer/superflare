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
    () => {},
    (argv) => {
      const db = new Database(
        path.join(process.cwd(), ".wrangler", "state", "d1", "DB.sqlite3")
      );
      const modelsDirectory = path.join(process.cwd(), "app", "models");
      const types = generateTypesFromSqlite(db);
      const results = addTypesToModelsInDirectory(modelsDirectory, types, {
        createIfNotFound: true,
      });

      logger.table(results);
    }
  )
  .parse();

export {};
