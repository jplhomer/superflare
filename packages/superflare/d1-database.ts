import type { Database } from "better-sqlite3";
import { D1Database, D1DatabaseAPI } from "./d1js";

export function createD1Database(sqliteDb: Database) {
  return new D1Database(new D1DatabaseAPI(sqliteDb));
}
