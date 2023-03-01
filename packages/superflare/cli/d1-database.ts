import { D1Database, D1DatabaseAPI } from "../d1js";

export async function createD1Database(
  sqliteDbPath: string,
  logger = console.log
) {
  const { npxImport } = await import("npx-import");
  const [{ D1Database, D1DatabaseAPI }, { createSQLiteDB }] = await npxImport<
    [typeof import("@miniflare/d1"), typeof import("@miniflare/shared")]
  >(["@miniflare/d1", "@miniflare/shared"], logger);
  const sqliteDb = await createSQLiteDB(sqliteDbPath);

  return new D1Database(new D1DatabaseAPI(sqliteDb));
}

export async function createSQLiteDB(
  dbPath: string,
  logger = console.log
): Promise<any> {
  const { npxImport } = await import("npx-import");
  const { createSQLiteDB: create } = await npxImport<
    typeof import("@miniflare/shared")
  >("@miniflare/shared", logger);

  return create(dbPath);
}

export async function createTestDatabase(sql: string) {
  const sqliteDb = await createSQLiteDB(":memory:");

  /**
   * Migrating at this step because D1 doesn't allow multi-statement execs.
   */
  sqliteDb.exec(sql);

  // Using local `/d1js` due to type mismatches in the @miniflare/d1 package :(
  return new D1Database(new D1DatabaseAPI(sqliteDb));
}
