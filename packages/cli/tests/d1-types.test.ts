import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  addTypesToModelClass,
  addTypesToModelsInDirectory,
  generateTypesFromSqlite,
  SuperflareType,
  SUPERFLARE_TYPES_END_MARKER,
  SUPERFLARE_TYPES_START_MARKER,
} from "../d1-types";
import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "path";
import fs from "fs";

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
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
  );

  CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER NOT NULL,
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

    expect(result.length).toBe(2);

    expect(result.find((r) => r.model === "User")).toEqual({
      model: "User",
      types: [
        { name: "id", type: "number", nullable: false },
        { name: "email", type: "string", nullable: false },
        { name: "name", type: "string", nullable: false },
      ],
    });

    expect(result.find((r) => r.model === "Post")).toEqual({
      model: "Post",
      types: [
        { name: "id", type: "number", nullable: false },
        { name: "title", type: "string", nullable: false },
        { name: "description", type: "string", nullable: true },
        { name: "user_id", type: "number", nullable: false },
      ],
    });
  });
});

describe("addTypesToModelsInDirectory", () => {
  const sql = `
    CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
  );

  CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  `;

  const dbPath = ":memory:";
  let db: DatabaseType;
  let tmpDir: string;

  beforeEach(() => {
    db = new Database(dbPath);
    db.exec(sql);
    tmpDir = fs.mkdtempSync("superflare-test-models");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("adds types to all existing typescript models in a directory", () => {
    const files = {
      "User.ts": `import { Model } from 'superflare';\n\nexport class User extends Model {
}`,
      "Post.ts": `import { Model } from 'superflare';\n\nexport class Post extends Model {
}`,
    };

    Object.entries(files).forEach(([filename, file]) => {
      fs.writeFileSync(path.join(tmpDir, filename), file);
    });

    const types = generateTypesFromSqlite(db);
    addTypesToModelsInDirectory(tmpDir, types);

    expect(fs.readFileSync(path.join(tmpDir, "User.ts"), "utf8"))
      .toBe(`import { Model } from 'superflare';\n\nexport class User extends Model {
  ${SUPERFLARE_TYPES_START_MARKER}
  id: number;
  email: string;
  name: string;
  ${SUPERFLARE_TYPES_END_MARKER}
}`);

    expect(fs.readFileSync(path.join(tmpDir, "Post.ts"), "utf8"))
      .toBe(`import { Model } from 'superflare';\n\nexport class Post extends Model {
  ${SUPERFLARE_TYPES_START_MARKER}
  id: number;
  title: string;
  description?: string;
  user_id: number;
  ${SUPERFLARE_TYPES_END_MARKER}
}`);
  });

  it("ignores javascript models models in a directory", () => {
    const files = {
      "User.js": `import { Model } from 'superflare';\n\nexport class User extends Model {
}`,
      "Post.ts": `import { Model } from 'superflare';\n\nexport class Post extends Model {
}`,
    };

    Object.entries(files).forEach(([filename, file]) => {
      fs.writeFileSync(path.join(tmpDir, filename), file);
    });

    const types = generateTypesFromSqlite(db);
    const results = addTypesToModelsInDirectory(tmpDir, types);

    expect(fs.readFileSync(path.join(tmpDir, "user.js"), "utf8")).toBe(
      `import { Model } from 'superflare';\n\nexport class User extends Model {\n}`
    );

    expect(fs.readFileSync(path.join(tmpDir, "Post.ts"), "utf8"))
      .toBe(`import { Model } from 'superflare';\n\nexport class Post extends Model {
  ${SUPERFLARE_TYPES_START_MARKER}
  id: number;
  title: string;
  description?: string;
  user_id: number;
  ${SUPERFLARE_TYPES_END_MARKER}
}`);

    expect(results.find((r) => r.model === "User")).toEqual({
      model: "User",
      status: "not-found",
    });
    expect(results.find((r) => r.model === "Post")).toEqual({
      model: "Post",
      status: "updated",
    });
  });
});
