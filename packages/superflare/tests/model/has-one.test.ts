import { beforeEach, expect, it } from "vitest";
import { setConfig } from "../../src/config";
import { Model } from "../../src/model";
import type { BaseModel } from "../../index.types";
import { createTestDatabase } from "../db";

let ModelConstructor = Model as unknown as BaseModel;

class Profile extends ModelConstructor {
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

  profile?: Profile | Promise<Profile>;
  $profile() {
    return this.hasOne(Profile);
  }
}

let database: D1Database;

beforeEach(async () => {
  database = await createTestDatabase(`
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
      profileId INTEGER,
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
  await Profile.create({
    text: "Hello World",
    userId: user.id,
  });

  const userFromDB = await User.find(1);
  const profileFromDB = await userFromDB!.profile;

  expect(profileFromDB).toBeTruthy();
  expect(profileFromDB!.id).toBe(1);
  expect(profileFromDB!.text).toBe("Hello World");

  // The second call should be cached:
  const profileFromDB2 = userFromDB!.profile;
  expect(profileFromDB2).toBeInstanceOf(Profile);
});

it("saves", async () => {
  const user = await User.create({
    name: "John Doe",
  });
  const profile = new Profile({
    text: "Hello World",
  });

  expect(user.profileId).toBeUndefined();

  const savedProfile = await user.$profile().save(profile);

  expect(savedProfile.id).toBe(1);
  expect(savedProfile.text).toBe("Hello World");

  const userFromDB = await User.find(1);
  const profileFromDB = await userFromDB!.profile;

  profileFromDB!.text = "Goodbye World";
  await profileFromDB!.save();

  const profileFromDB2 = await userFromDB!.profile;
  expect(profileFromDB2!.text).toBe("Goodbye World");

  // The second call should be cached:
  const profileFromDB3 = userFromDB!.profile;
  expect(profileFromDB3).toBeInstanceOf(Profile);
});

it("creates", async () => {
  const user = await User.create({
    name: "John Doe",
  });

  expect(user.profileId).toBeUndefined();

  const profile = await user.$profile().create({
    text: "Hello World",
  });

  expect(profile.id).toBe(1);
  expect(profile.text).toBe("Hello World");

  const userFromDB = await User.find(1);
  const profileFromDB = await userFromDB!.profile;

  expect(profileFromDB).toBeTruthy();
  expect(profileFromDB!.id).toBe(1);
  expect(profileFromDB!.text).toBe("Hello World");
});

it("supports eager loading", async () => {
  const user = await User.create({
    name: "John Doe",
  });
  await Profile.create({
    text: "Hello World",
    userId: user.id,
  });

  const userFromDB = await User.query().with("profile").first();

  expect(userFromDB).toBeTruthy();
  expect(userFromDB!.profile).toBeInstanceOf(Profile);

  // Test serialization:
  const serialized = userFromDB!.toJSON();

  expect(serialized.profile.text).toBe("Hello World");
});
