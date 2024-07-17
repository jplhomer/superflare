import type { SqliteDB } from "@miniflare/shared";

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

  return new D1DatabaseAdaptor(await create(dbPath));
}

class D1DatabaseAdaptor {
  constructor(private readonly db: SqliteDB) {}

  exec = this.db.exec.bind(this.db);

  prepare(query: string) {
    return {
      all: async <T>() => {
        return {
          results: this.db.prepare(query).all() as T[],
        };
      },
    };
  }
}
