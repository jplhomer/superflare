import { describe, expect, it, beforeEach } from "vitest";
import {
  addTypesToModelClass,
  generateTypesFromSqlite,
  SuperflareType,
  SUPERFLARE_TYPES_END_MARKER,
  SUPERFLARE_TYPES_START_MARKER,
} from "../d1-types";
import Database, { type Database as DatabaseType } from "better-sqlite3";

describe("addTypesToModelClass", () => {
  it("adds types to a model class", () => {
    const source = `export class User extends Model {
}`;
    const modelClass = "User";
    const types: SuperflareType[] = [
      { name: "id", type: "string", nullable: false },
      { name: "name", type: "string", nullable: false },
      { name: "email", type: "string", nullable: false },
      { name: "password", type: "string", nullable: false },
    ];

    const result = addTypesToModelClass(source, modelClass, types);

    expect(result).toBe(`export class User extends Model {
  ${SUPERFLARE_TYPES_START_MARKER}
  id: string;
  name: string;
  email: string;
  password: string;
  ${SUPERFLARE_TYPES_END_MARKER}
}`);
  });

  it("takes nullable into account", () => {
    const source = `export class User extends Model {
}`;

    const modelClass = "User";
    const types: SuperflareType[] = [
      { name: "id", type: "string", nullable: false },
      { name: "name", type: "string", nullable: false },
      { name: "email", type: "string", nullable: false },
      { name: "password", type: "string", nullable: true },
    ];

    const result = addTypesToModelClass(source, modelClass, types);

    expect(result).toBe(`export class User extends Model {
  ${SUPERFLARE_TYPES_START_MARKER}
  id: string;
  name: string;
  email: string;
  password?: string;
  ${SUPERFLARE_TYPES_END_MARKER}
}`);
  });

  it("replaces existing types if they exist", () => {
    const source = `export class User extends Model {
  ${SUPERFLARE_TYPES_START_MARKER}
  id: string;
  name: string;
  email: string;
  ${SUPERFLARE_TYPES_END_MARKER}
}`;

    const modelClass = "User";
    const types: SuperflareType[] = [
      { name: "id", type: "string", nullable: false },
      { name: "name", type: "string", nullable: false },
      { name: "email", type: "string", nullable: false },
      { name: "password", type: "string", nullable: false },
    ];

    const result = addTypesToModelClass(source, modelClass, types);

    expect(result).toBe(`export class User extends Model {
  ${SUPERFLARE_TYPES_START_MARKER}
  id: string;
  name: string;
  email: string;
  password: string;
  ${SUPERFLARE_TYPES_END_MARKER}
}`);
  });
});

describe("generateTypesFromSqlite", () => {
  const sql = `
    CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255),
    name VARCHAR(255)
  );

  CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255),
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  `;

  const dbPath = ":memory:";
  let db: DatabaseType;

  beforeEach(() => {
    db = new Database(dbPath);
    db.exec(sql);
  });

  it("creates types from a sqlite database", () => {
    const result = generateTypesFromSqlite(db);
    console.log({ result });
  });
});
