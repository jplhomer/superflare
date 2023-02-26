import Database, { type Database as DatabaseType } from "better-sqlite3";
import { beforeEach, describe, expect, it, test } from "vitest";
import { config } from "../src/config";
import { Model } from "../src/model";
import type { BaseModel } from "../index.types";
import { createD1Database } from "../cli/d1-database";

let ModelConstructor = Model as unknown as BaseModel;

class Post extends ModelConstructor {
  id!: number;
  title!: string;
  body?: string;
}

function refreshDatabase(database: DatabaseType) {
  database.exec(`
    DROP TABLE IF EXISTS posts;
    CREATE TABLE posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT
    );
  `);

  return database;
}

describe("model", () => {
  const sqliteDb = new Database(":memory:");
  const database = createD1Database(sqliteDb);

  beforeEach(async () => {
    refreshDatabase(sqliteDb);
    config({
      database: {
        default: database,
      },
    });
  });

  // Class methods

  test("#create", async () => {
    const post = await Post.create({
      title: "Hello World",
      body: "This is a test post",
    });

    expect(post).toBeInstanceOf(Post);
    expect(post.id).toBe(1);
    expect(post.title).toBe("Hello World");
    expect(post.body).toBe("This is a test post");

    expect(await Post.count()).toBe(1);
  });

  test("#all", async () => {
    await database
      .prepare("INSERT INTO posts (title, body) VALUES (?, ?), (?, ?)")
      .bind(
        "Hello World",
        "This is a test post",
        "Hello World 2",
        "This is a test post 2"
      )
      .run();

    const posts = await Post.all();

    expect(posts).toHaveLength(2);
    expect(posts[0]).toBeInstanceOf(Post);
    expect(posts[0].id).toBe(1);
    expect(posts[0].title).toBe("Hello World");
  });

  test("#first", async () => {
    await database
      .prepare("INSERT INTO posts (title, body) VALUES (?, ?), (?, ?)")
      .bind(
        "Hello World",
        "This is a test post",
        "Hello World 2",
        "This is a test post 2"
      )
      .run();

    const post = await Post.first();

    expect(post).toBeTruthy();
    expect(post!.id).toBe(1);
    expect(post!.title).toBe("Hello World");
  });

  test("#where", async () => {
    await database
      .prepare("INSERT INTO posts (title, body) VALUES (?, ?), (?, ?)")
      .bind(
        "Hello World",
        "This is a test post",
        "Hello World 2",
        "This is a test post 2"
      )
      .run();

    const posts = await Post.where("title", "Hello World 2");

    expect(posts).toHaveLength(1);
    expect(posts[0]).toBeInstanceOf(Post);
    expect(posts[0].id).toBe(2);
    expect(posts[0].title).toBe("Hello World 2");

    // It's ok if the where clause is not found
    expect(await Post.where("title", "Hello World 3").first()).toBeNull();
  });

  test("#find", async () => {
    await database
      .prepare("INSERT INTO posts (title, body) VALUES (?, ?), (?, ?)")
      .bind(
        "Hello World",
        "This is a test post",
        "Hello World 2",
        "This is a test post 2"
      )
      .run();

    const post = await Post.find(2);

    expect(post).toBeTruthy();
    expect(post!.id).toBe(2);
    expect(post!.title).toBe("Hello World 2");
  });

  test("#orderBy", async () => {
    await database
      .prepare("INSERT INTO posts (title, body) VALUES (?, ?), (?, ?)")
      .bind(
        "Hello World",
        "This is a test post",
        "Hello World 2",
        "This is a test post 2"
      )
      .run();

    const posts = await Post.orderBy("title", "desc");

    expect(posts).toHaveLength(2);
    expect(posts[0]).toBeInstanceOf(Post);
    expect(posts[0].id).toBe(2);
  });

  // Instance methods

  describe("#save", async () => {
    it("saves a new model", async () => {
      const post = new Post({
        title: "Hello World",
        body: "This is a test post",
      });

      expect(post.id).toBe(undefined);
      expect(post.title).toBe("Hello World");
      expect(post.body).toBe("This is a test post");

      expect(await post.save()).toBeTruthy();

      expect(post.id).toBe(1);
      expect(post.title).toBe("Hello World");
      expect(post.body).toBe("This is a test post");
    });

    it("updates an existing model", async () => {
      const post = await Post.create({
        title: "Hello World",
        body: "This is a test post",
      });

      expect(post.id).toBe(1);
      expect(post.title).toBe("Hello World");
      expect(post.body).toBe("This is a test post");

      post.title = "Hello World 2";
      post.body = "This is a test post 2";

      expect(await post.save()).toBeTruthy();

      expect(post.id).toBe(1);
      expect(post.title).toBe("Hello World 2");
      expect(post.body).toBe("This is a test post 2");
    });
  });

  describe("#toJSON", () => {
    it("returns the attributes", () => {
      const post = new Post({
        title: "Hello World",
        body: "This is a test post",
      });

      expect(post.toJSON()).toEqual({
        title: "Hello World",
        body: "This is a test post",
      });
    });

    it("returns the attributes with ID if persisted", async () => {
      const post = new Post({
        title: "Hello World",
        body: "This is a test post",
      });

      await post.save();

      expect(post.toJSON()).toEqual({
        id: 1,
        title: "Hello World",
        body: "This is a test post",
      });
    });
  });

  test("it can be spread and retain attributes", async () => {
    const post = await Post.create({
      title: "Hello World",
      body: "This is a test post",
    });

    const newPost = { ...post };

    expect(newPost).toMatchObject({
      id: 1,
      title: "Hello World",
      body: "This is a test post",
    });
  });
});
