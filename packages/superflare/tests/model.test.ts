import Database, { type Database as DatabaseType } from "better-sqlite3";
import { beforeEach, describe, expect, it, test } from "vitest";
import { config } from "../config";
import { Model } from "../model";
import { D1Database, D1DatabaseAPI } from "../d1js";

class Post extends Model {
  static tableName = "posts";

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
  const database = new D1Database(new D1DatabaseAPI(sqliteDb));

  beforeEach(async () => {
    refreshDatabase(sqliteDb);
    config({
      database,
    });
  });

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
});
