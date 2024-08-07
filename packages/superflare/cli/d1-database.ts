import type { D1Database as D1DatabaseType } from "@cloudflare/workers-types";
import { getWranglerJsonConfig } from "./config";

export async function createD1Database(
  sqliteDbPath: string,
  logger = console.log
): Promise<D1DatabaseType> {
  const { npxImport } = await import("npx-import");
  const [{ D1Database, D1DatabaseAPI }, { createSQLiteDB }] = await npxImport<
    [typeof import("@miniflare/d1"), typeof import("@miniflare/shared")]
  >(["@miniflare/d1", "@miniflare/shared"], logger);
  const sqliteDb = await createSQLiteDB(sqliteDbPath);
  const db = new D1Database(new D1DatabaseAPI(sqliteDb));
  return db as any as D1DatabaseType;
}

type DBConfig = {
  binding: string;
  database_id: string;
};

export async function getD1Database(
  dbName: string,
  logger = console.log
): Promise<D1DatabaseType | null> {
  const wranglerJsonConfig = await getWranglerJsonConfig(process.cwd());
  if (!wranglerJsonConfig) {
    logger("Unable to load wrangler.json");
    return null;
  }

  const databaseId = wranglerJsonConfig.d1_databases?.find(
    ({ binding }: DBConfig) => binding === dbName
  )?.database_id;

  if (!databaseId) {
    logger(`No d1_databases {"binding": "${dbName}"} item in wrangler.json`);
    return null;
  }

  const { npxImport } = await import("npx-import");
  const { Miniflare } = await npxImport<typeof import("miniflare")>(
    "miniflare",
    logger
  );

  const d1Databases = { [dbName]: databaseId };
  const mf = new Miniflare({ d1Databases, modules: true, script: "" });

  return await mf.getD1Database(dbName);
}
