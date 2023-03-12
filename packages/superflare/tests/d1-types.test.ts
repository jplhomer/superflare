import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  syncSuperflareTypes,
  generateTypesFromSqlite,
  SUPERFLARE_TYPES_FILE,
} from "../cli/d1-types";
import path from "path";
import fs from "fs";
import os from "os";
import { createSQLiteDB } from "../cli/d1-database";

const baseModel = (
  modelName: string
) => `export class ${modelName} extends Model {
  toJSON(): ${modelName}Row {
    return super.toJSON();
  }
}\n\Model.register(${modelName});`;

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

  CREATE TABLE d1_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT
  );
  `;

  let db: any;

  beforeEach(async () => {
    db = await createSQLiteDB(":memory:");
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

describe("syncSuperflareTypes", () => {
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

  let db: any;
  const osTmpDir = os.tmpdir();
  let tmpDir: string;
  let modelsDir: string;

  function populateDirectoryWithFiles(files: Record<string, string>) {
    fs.mkdirSync(path.join(tmpDir, "app", "models"), {
      recursive: true,
    });
    Object.entries(files).forEach(([filename, file]) => {
      fs.writeFileSync(path.join(modelsDir, filename), file);
    });
  }

  beforeEach(async () => {
    db = await createSQLiteDB(":memory:");
    db.exec(sql);
    tmpDir = fs.mkdtempSync(path.join(osTmpDir, "superflare-test-models"));
    modelsDir = path.join(tmpDir, "app", "models");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("adds types to all existing typescript models in a directory", () => {
    populateDirectoryWithFiles({
      "User.ts": baseModel("User"),
      "Post.ts": baseModel("Post"),
    });

    const types = generateTypesFromSqlite(db);
    syncSuperflareTypes(tmpDir, modelsDir, types);
    const generated = fs.readFileSync(
      path.join(tmpDir, SUPERFLARE_TYPES_FILE),
      "utf8"
    );

    expect(generated).toContain(`interface UserRow {
  id: number;
  email: string;
  name: string;
}`);

    expect(generated).toContain(`interface PostRow {
  id: number;
  title: string;
  description?: string;
  user_id: number;
}`);
  });

  it("does not create new files by default", () => {
    populateDirectoryWithFiles({
      "Post.ts": baseModel("Post"),
    });

    const types = generateTypesFromSqlite(db);
    const results = syncSuperflareTypes(tmpDir, modelsDir, types);

    // Expect `user.ts` to not exist
    expect(fs.existsSync(path.join(tmpDir, "User.ts"))).toBe(false);

    expect(fs.readFileSync(path.join(modelsDir, "Post.ts"), "utf8")).toBe(
      baseModel("Post")
    );

    expect(results.find((r) => r.model === "User")).toEqual({
      model: "User",
      status: "not-found",
    });
    expect(results.find((r) => r.model === "Post")).toEqual({
      model: "Post",
      status: "synced",
    });
  });

  it("creates new model files if requested", () => {
    populateDirectoryWithFiles({
      "Post.ts": baseModel("Post"),
    });

    const types = generateTypesFromSqlite(db);
    const results = syncSuperflareTypes(tmpDir, modelsDir, types, {
      createIfNotFound: true,
    });

    // Expect `user.ts` to have been created
    expect(fs.existsSync(path.join(modelsDir, "User.ts"))).toBe(true);
    expect(fs.readFileSync(path.join(modelsDir, "User.ts"), "utf8")).toBe(
      "import { Model } from 'superflare';\n\n" +
        baseModel("User") +
        `\n\nexport interface User extends UserRow {};`
    );

    expect(fs.readFileSync(path.join(modelsDir, "Post.ts"), "utf8")).toBe(
      baseModel("Post")
    );

    expect(results.find((r) => r.model === "User")).toEqual({
      model: "User",
      status: "created",
    });
    expect(results.find((r) => r.model === "Post")).toEqual({
      model: "Post",
      status: "synced",
    });
  });
});
