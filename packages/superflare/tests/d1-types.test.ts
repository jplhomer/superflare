import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  addTypesToModelClass,
  addTypesToModelsInDirectory,
  generateTypesFromSqlite,
  SuperflareType,
  SUPERFLARE_TYPES_END_MARKER,
  SUPERFLARE_TYPES_START_MARKER,
  wrapWithTypeMarkers,
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
}`;

describe("addTypesToModelClass", () => {
  it("adds types and JSON utilities to a model class", () => {
    const modelClass = "User";
    const modelContents = baseModel(modelClass);
    const source = modelContents;
    const types: SuperflareType[] = [
      { name: "id", type: "string", nullable: false },
      { name: "name", type: "string", nullable: false },
      { name: "email", type: "string", nullable: false },
      { name: "password", type: "string", nullable: false },
    ];

    const result = addTypesToModelClass(source, modelClass, types);

    expect(result).toBe(
      `${modelContents}\n\n` +
        wrapWithTypeMarkers(`interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
}\n\nexport interface User extends UserRow {}`)
    );
  });

  it("takes nullable into account", () => {
    const modelClass = "User";
    const modelContents = baseModel(modelClass);
    const source = modelContents;
    const types: SuperflareType[] = [
      { name: "id", type: "string", nullable: false },
      { name: "name", type: "string", nullable: false },
      { name: "email", type: "string", nullable: false },
      { name: "password", type: "string", nullable: true },
    ];

    const result = addTypesToModelClass(source, modelClass, types);

    expect(result).toBe(
      `${modelContents}\n\n` +
        wrapWithTypeMarkers(`interface UserRow {
  id: string;
  name: string;
  email: string;
  password?: string;
}\n\nexport interface User extends UserRow {}`)
    );
  });

  it("replaces existing types if they exist", () => {
    const modelClass = "User";
    const modelContents = baseModel(modelClass);
    const source =
      `${modelContents}\n\n` +
      wrapWithTypeMarkers(`interface UserRow {
  id: string;
  name: string;
  email: string;
}\n\nexport interface User extends UserRow {}`);

    const types: SuperflareType[] = [
      { name: "id", type: "string", nullable: false },
      { name: "name", type: "string", nullable: false },
      { name: "email", type: "string", nullable: false },
      { name: "password", type: "string", nullable: false },
    ];

    const result = addTypesToModelClass(source, modelClass, types);

    expect(result).toBe(
      `${modelContents}\n\n` +
        wrapWithTypeMarkers(`interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
}\n\nexport interface User extends UserRow {}`)
    );
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

  let db: any;
  const osTmpDir = os.tmpdir();
  let tmpDir: string;

  function populateDirectoryWithFiles(files: Record<string, string>) {
    Object.entries(files).forEach(([filename, file]) => {
      fs.writeFileSync(path.join(tmpDir, filename), file);
    });
  }

  beforeEach(async () => {
    db = await createSQLiteDB(":memory:");
    db.exec(sql);
    tmpDir = fs.mkdtempSync(path.join(osTmpDir, "superflare-test-models"));
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
    addTypesToModelsInDirectory(tmpDir, types);

    expect(fs.readFileSync(path.join(tmpDir, "User.ts"), "utf8")).toBe(
      baseModel("User") +
        "\n\n" +
        wrapWithTypeMarkers(`interface UserRow {
  id: number;
  email: string;
  name: string;
}\n\nexport interface User extends UserRow {}`)
    );

    expect(fs.readFileSync(path.join(tmpDir, "Post.ts"), "utf8")).toBe(
      baseModel("Post") +
        "\n\n" +
        wrapWithTypeMarkers(`interface PostRow {
  id: number;
  title: string;
  description?: string;
  user_id: number;
}\n\nexport interface Post extends PostRow {}`)
    );
  });

  it("ignores javascript models models in a directory", () => {
    populateDirectoryWithFiles({
      "User.js": `import { Model } from 'superflare';\n\nexport class User extends Model {\n}`,
      "Post.ts": baseModel("Post"),
    });

    const types = generateTypesFromSqlite(db);
    const results = addTypesToModelsInDirectory(tmpDir, types);

    expect(fs.readFileSync(path.join(tmpDir, "User.js"), "utf8")).toBe(
      `import { Model } from 'superflare';\n\nexport class User extends Model {\n}`
    );

    expect(fs.readFileSync(path.join(tmpDir, "Post.ts"), "utf8")).toBe(
      baseModel("Post") +
        "\n\n" +
        wrapWithTypeMarkers(`interface PostRow {
  id: number;
  title: string;
  description?: string;
  user_id: number;
}\n\nexport interface Post extends PostRow {}`)
    );

    expect(results.find((r) => r.model === "User")).toEqual({
      model: "User",
      status: "not-found",
    });
    expect(results.find((r) => r.model === "Post")).toEqual({
      model: "Post",
      status: "updated",
    });
  });

  it("does not create new files by default", () => {
    populateDirectoryWithFiles({
      "Post.ts": baseModel("Post"),
    });

    const types = generateTypesFromSqlite(db);
    const results = addTypesToModelsInDirectory(tmpDir, types);

    // Expect `user.ts` to not exist
    expect(fs.existsSync(path.join(tmpDir, "User.ts"))).toBe(false);

    expect(fs.readFileSync(path.join(tmpDir, "Post.ts"), "utf8")).toBe(
      baseModel("Post") +
        "\n\n" +
        wrapWithTypeMarkers(`interface PostRow {
  id: number;
  title: string;
  description?: string;
  user_id: number;
}\n\nexport interface Post extends PostRow {}`)
    );

    expect(results.find((r) => r.model === "User")).toEqual({
      model: "User",
      status: "not-found",
    });
    expect(results.find((r) => r.model === "Post")).toEqual({
      model: "Post",
      status: "updated",
    });
  });

  it("creates new model files if requested", () => {
    populateDirectoryWithFiles({
      "Post.ts": baseModel("Post"),
    });

    const types = generateTypesFromSqlite(db);
    const results = addTypesToModelsInDirectory(tmpDir, types, {
      createIfNotFound: true,
    });

    // Expect `user.ts` to have been created
    expect(fs.existsSync(path.join(tmpDir, "User.ts"))).toBe(true);
    expect(fs.readFileSync(path.join(tmpDir, "User.ts"), "utf8")).toBe(
      "import { Model } from 'superflare';\n\n" +
        baseModel("User") +
        "\n\n" +
        wrapWithTypeMarkers(`interface UserRow {
  id: number;
  email: string;
  name: string;
}\n\nexport interface User extends UserRow {}`)
    );

    expect(fs.readFileSync(path.join(tmpDir, "Post.ts"), "utf8")).toBe(
      baseModel("Post") +
        "\n\n" +
        wrapWithTypeMarkers(`interface PostRow {
  id: number;
  title: string;
  description?: string;
  user_id: number;
}\n\nexport interface Post extends PostRow {}`)
    );

    expect(results.find((r) => r.model === "User")).toEqual({
      model: "User",
      status: "created",
    });
    expect(results.find((r) => r.model === "Post")).toEqual({
      model: "Post",
      status: "updated",
    });
  });
});
