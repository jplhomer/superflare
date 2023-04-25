import { beforeEach, expect, it } from "vitest";
import { BaseModel, setConfig } from "../../index.types";
import { Model } from "../../src/model";
import { createTestDatabase } from "../db";

let ModelConstructor = Model as unknown as BaseModel;

class Post extends ModelConstructor {
  id!: number;
  text!: string;
  createdAt!: string;
  updatedAt!: string;
  userId!: number;
}

class User extends ModelConstructor {
  id!: number;
  name!: string;
  createdAt!: string;
  updatedAt!: string;
  profileId?: number;

  static $with = ["posts"];

  posts?: Post[] | Promise<Post[]>;
  $posts() {
    return this.hasMany(Post);
  }
}
let database: D1Database;

beforeEach(async () => {
  database = await createTestDatabase(`
    DROP TABLE IF EXISTS posts;
    CREATE TABLE posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
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
  setConfig({
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
    text: "Hello World",
    userId: user.id,
  });
  await Post.create({
    text: "Hello again",
    userId: user.id,
  });

  const userWithPosts = await User.find(user.id);
  expect(userWithPosts!.posts).toHaveLength(2);
});
