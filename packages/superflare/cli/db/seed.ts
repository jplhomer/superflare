import { register } from "esbuild-register/dist/node";
import path from "node:path";
import { getD1Database } from "../d1-database";
import { logger } from "../logger";
import { CommonYargsArgv, StrictYargsOptionsToInterface } from "../yargs-types";

export function seedOptions(yargs: CommonYargsArgv) {
  return yargs
    .option("db", {
      alias: "d",
      describe: "The name of the D1 database binding",
      default: "DB",
    })
    .option("seed-path", {
      describe: "Path to the seed file",
      default: path.join(process.cwd(), "db", "seed.ts"),
    });
}

export async function seedHandler(
  argv: StrictYargsOptionsToInterface<typeof seedOptions>
) {
  const dbName = argv.db;
  const seedPath = argv.seedPath;
  await seedDb(dbName, seedPath);
}

export async function seedDb(dbName: string, seedPath: string) {
  if (seedPath) {
    logger.info(`Seeding database...`);

    register();
    try {
      const seedModule = require(seedPath);
      const d1Database = await getD1Database(dbName, logger.log);
      if (!d1Database) {
        throw new Error(`Database ${dbName} not found`);
      }
      // TODO: Find out why errors in the seeder are not bubbled to this try/catch
      if (seedModule.default) {
        await seedModule.default(d1Database);
        logger.info(`Seeding complete!`);
      } else {
        logger.warn(`Warning: Did not find a default export in ${seedPath}.`);
      }
    } catch (e: any) {
      logger.error(`Error seeding database: ${e.message}`);
    }
  }
}
