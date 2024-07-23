import type { D1Database as D1DatabaseType } from "@cloudflare/workers-types";

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
