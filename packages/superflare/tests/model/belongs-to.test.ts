import Database, { type Database as DatabaseType } from "better-sqlite3";
import { beforeEach, expect, it } from "vitest";
import { config } from "../../src/config";
import { Model } from "../../src/model";
import type { BaseModel } from "../../index.types";
import { createD1Database } from "../../cli/d1-database";

let ModelConstructor = Model as unknown as BaseModel;

class Post extends ModelConstructor {
  id!: number;
  title!: string;
  body?: string;
  createdAt!: string;
  updatedAt!: string;
  userId!: number;

  user!: User | Promise<User>;
  $user() {
    return this.belongsTo(User);
  }
}

class User extends ModelConstructor {
  id!: number;
  name!: string;
  createdAt!: string;
  updatedAt!: string;
}

function refreshDatabase(database: DatabaseType) {
  database.exec(`
    DROP TABLE IF EXISTS posts;
    CREATE TABLE posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT,
      userId INTEGER NOT NULL,
      createdAt timestamp not null default current_timestamp,
      updatedAt timestamp not null default current_timestamp
    );

    DROP TABLE IF EXISTS users;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdAt timestamp not null default current_timestamp,
      updatedAt timestamp not null default current_timestamp
    );
  `);

  return database;
}

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

it("works", async () => {
  const user = await User.create({
    name: "John Doe",
  });
  await Post.create({
    title: "Hello World",
    body: "This is a test post",
    userId: user.id,
  });

  const postFromDB = await Post.find(1);

  const userFromDB = await postFromDB!.user;

  expect(userFromDB).toBeTruthy();
  expect(userFromDB.id).toBe(1);
  expect(userFromDB.name).toBe("John Doe");

  // The second call should be cached:
  const userFromDB2 = postFromDB!.user;
  expect(userFromDB2).toBeInstanceOf(User);
});

it("associates and dissociates", async () => {
  const user = await User.create({
    name: "John Doe",
  });
  const post = new Post({
    title: "Hello World",
    body: "This is a test post",
  });

  post.$user().associate(user);

  expect(post.userId).toBe(1);

  await post.save();

  const postFromDB = await Post.find(1);

  const userFromDB = await postFromDB!.user;

  expect(userFromDB).toBeTruthy();
  expect(userFromDB.id).toBe(1);

  post.$user().dissociate();

  expect(post.userId).toBeNull();
});

it("supports eager loading", async () => {
  const user = await User.create({
    name: "John Doe",
  });
  await Post.create({
    title: "Hello World",
    body: "This is a test post",
    userId: user.id,
  });

  const postsFromDB = await Post.with("user").get();

  expect(postsFromDB).toBeTruthy();
  expect(postsFromDB[0].user).toBeInstanceOf(User);

  // Test that serialization works
  const results = postsFromDB.map((post) => post.toJSON());
  expect(results[0].user.id).toBe(1);
  expect(results[0].user.name).toBe("John Doe");
});
