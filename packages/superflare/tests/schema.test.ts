import { expect, it } from "vitest";
import { Schema, SchemaBuilder } from "../src/schema";

it("converts a schema migration to a SQL migration", () => {
  const schema = Schema.create("articles", (builder: SchemaBuilder) => {
    builder.increments("id");
    builder.string("title");
  });

  expect(schema.toSql()).toEqual(
    "CREATE TABLE articles (\n  id INTEGER PRIMARY KEY,\n  title TEXT NOT NULL\n);"
  );
});

it("supports nullable columns", () => {
  const schema = Schema.create("articles", (builder: SchemaBuilder) => {
    builder.increments("id");
    builder.string("title").nullable();
  });

  expect(schema.toSql()).toEqual(
    "CREATE TABLE articles (\n  id INTEGER PRIMARY KEY,\n  title TEXT\n);"
  );
});

it("supports all common data types", () => {
  const schema = Schema.create("articles", (builder: SchemaBuilder) => {
    builder.increments("id");
    builder.string("title");
    builder.text("body");
    builder.integer("views");
    builder.float("rating");
    builder.boolean("published");
    builder.date("published_at");
    builder.dateTime("created_at");
    builder.blob("image");
  });

  expect(schema.toSql()).toEqual(
    `CREATE TABLE articles (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  views INTEGER NOT NULL,
  rating FLOAT NOT NULL,
  published BOOLEAN NOT NULL,
  published_at DATE NOT NULL,
  created_at DATETIME NOT NULL,
  image BLOB NOT NULL
);`
  );
});

it("supports timestamps", () => {
  const schema = Schema.create("articles", (builder: SchemaBuilder) => {
    builder.increments("id");
    builder.timestamps();
  });

  expect(schema.toSql()).toEqual(
    `CREATE TABLE articles (
  id INTEGER PRIMARY KEY,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);`
  );
});

it("supports a unique constraint", () => {
  const schema = Schema.create("articles", (builder: SchemaBuilder) => {
    builder.increments("id");
    builder.string("title").unique();
  });

  expect(schema.toSql()).toEqual(
    `CREATE TABLE articles (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL UNIQUE
);`
  );
});

it("supports adding a column to a table", () => {
  const schema = Schema.update("articles", (builder: SchemaBuilder) => {
    builder.string("slug").nullable();
  });

  expect(schema.toSql()).toEqual(`ALTER TABLE articles\nADD COLUMN slug TEXT;`);
});

it("supports renaming a column on a table", () => {
  const schema = Schema.update("articles", (builder: SchemaBuilder) => {
    builder.renameColumn("slug", "handle");
  });

  expect(schema.toSql()).toEqual(
    `ALTER TABLE articles\nRENAME COLUMN slug TO handle;`
  );
});

it("supports renaming a column and adding a column on a table", () => {
  const schema = Schema.update("articles", (builder: SchemaBuilder) => {
    builder.renameColumn("slug", "handle");
    builder.string("thing").nullable();
  });

  expect(schema.toSql()).toEqual(
    `ALTER TABLE articles\nRENAME COLUMN slug TO handle,\nADD COLUMN thing TEXT;`
  );
});

it("supports renaming a table", () => {
  const schema = Schema.rename("articles", "posts");

  expect(schema.toSql()).toEqual(`ALTER TABLE articles\nRENAME TO posts;`);
});

it("supports dropping a table", () => {
  const schema = Schema.drop("articles");

  expect(schema.toSql()).toEqual(`DROP TABLE articles;`);
});
