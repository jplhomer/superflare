import Database from "better-sqlite3";
import { D1Database, D1DatabaseAPI } from "../d1js";

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

  // Using local `/d1js` due to type mismatches in the @miniflare/d1 package :(
  return new D1Database(new D1DatabaseAPI(sqliteDb));
}
