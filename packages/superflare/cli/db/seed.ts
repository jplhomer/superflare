import { register } from "esbuild-register/dist/node";
import path from "node:path";
import { createD1Database } from "../d1-database";
import { logger } from "../logger";
import { CommonYargsArgv, StrictYargsOptionsToInterface } from "../yargs-types";

export function seedOptions(yargs: CommonYargsArgv) {
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
        "db.sqlite"
      ),
    })
    .option("seed-path", {
      describe: "Path to the seed file",
      default: path.join(process.cwd(), "db", "seed.ts"),
    });
}

export async function seedHandler(
  argv: StrictYargsOptionsToInterface<typeof seedOptions>
) {
  const dbPath = argv.db;
  const seedPath = argv.seedPath;
  await seedDb(dbPath, seedPath);
}

export async function seedDb(dbPath: string, seedPath: string) {
  if (seedPath) {
    logger.info(`Seeding database...`);

    register();
    try {
      const seedModule = require(seedPath);
      const d1Database = await createD1Database(dbPath, logger.log);
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
