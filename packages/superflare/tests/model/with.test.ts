import { assertType, beforeEach, expect, expectTypeOf, it, test } from 'vitest'
import { BaseModel, setConfig } from "../../index.types";
import { Model } from "../../src/model";
import { HasMany } from '../../src/relations/has-many'
import { createTestDatabase } from "../db";

let ModelConstructor = Model as unknown as BaseModel;

class Post extends ModelConstructor {
  id!: number;
  text!: string;
  createdAt!: string;
  updatedAt!: string;
  userId!: number;
}

class Profile extends ModelConstructor {
  id!: number;
  text!: string;
  userId!: number;
  createdAt!: string;
  updatedAt!: string;
}

class User extends ModelConstructor {
  id!: number;
  name!: string;
  createdAt!: string;
  updatedAt!: string;
  profileId?: number;

  static $with = ["posts", "profile"];

  posts?: Post[] | Promise<Post[]>;
  $posts() {
    return this.hasMany(Post);
  }

  profile?: Profile | Promise<Profile>;
  $profile() {
    return this.hasOne(Profile);
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

    DROP TABLE IF EXISTS profiles;
    CREATE TABLE profiles (
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

it("errors if a relation is passed but doesn't exist", async () => {
  class User extends ModelConstructor {
    id!: number;
    name!: string;
    createdAt!: string;
    updatedAt!: string;
    profileId?: number;

    static $with = ["posts"];
  }

  await expect(User.create({
    name: "John Doe",
  })).rejects.toThrowError(`Relation "posts" does not exist. Please remove "posts" from $with in User2.`)
})

test("#withOnly", async () => {
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
  await Profile.create({
    text: "Hello World",
    userId: user.id,
  });

  const userWithoutPostsButWithAProfile = await User.withOnly("profile").find(user.id);

  expect(userWithoutPostsButWithAProfile).toBeTruthy();
  expect(userWithoutPostsButWithAProfile!.posts).toBeInstanceOf(HasMany);

  expect(userWithoutPostsButWithAProfile!.profile).toBeInstanceOf(Profile);
  expect((userWithoutPostsButWithAProfile!.profile as Profile).id).toBe(1);
  expect((userWithoutPostsButWithAProfile!.profile as Profile).text).toBe("Hello World");
});

test("#without", async () => {
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
  await Profile.create({
    text: "Hello World",
    userId: user.id,
  });

  const userWithoutPostsButWithAProfile = await User.without("posts").find(user.id);

  expect(userWithoutPostsButWithAProfile).toBeTruthy();
  expect(userWithoutPostsButWithAProfile!.posts).toBeInstanceOf(HasMany);

  expect(userWithoutPostsButWithAProfile!.profile).toBeInstanceOf(Profile);
  expect((userWithoutPostsButWithAProfile!.profile as Profile).id).toBe(1);
  expect((userWithoutPostsButWithAProfile!.profile as Profile).text).toBe("Hello World");
});
