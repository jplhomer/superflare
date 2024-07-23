import type { D1Database as D1DatabaseType } from "@cloudflare/workers-types";
import { D1Database, D1DatabaseAPI } from "@miniflare/d1";
import Database from "better-sqlite3";

/**
 * This should only be exported locally for tests, not in places that are used in the package,
 * because it depends on an installed version of `better-sqlite3`.nvm
 */
export async function createTestDatabase(sql: string) {
  const sqliteDb = new Database(":memory:");

  /**
   * Migrating at this step because D1 doesn't allow multi-statement execs.
   */
  sqliteDb.exec(sql);
  const db = new D1Database(new D1DatabaseAPI(sqliteDb));
  return db as any as D1DatabaseType;
}
