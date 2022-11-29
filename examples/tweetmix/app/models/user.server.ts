import invariant from "tiny-invariant";
import type { TweetmixContext } from "types";
import { db } from "~/lib/db.server";
import { unsafeHash } from "~/utils";

export interface UserData {
  id: number;
  email: string;
  username: string;
  name?: string;
  avatarUrl: string;
}

export class User {
  constructor(public data: UserData) {}

  get id() {
    return this.data.id;
  }

  get email() {
    return this.data.email;
  }

  get username() {
    return this.data.username;
  }

  get name() {
    return this.data.name;
  }

  get avatarUrl() {
    return this.data.avatarUrl;
  }

  static async find(userId: number, context: TweetmixContext): Promise<User> {
    const { results } = await db(context).fetchOne({
      tableName: "users",
      fields: "*",
      where: {
        conditions: "id = ?1",
        params: [userId],
      },
    });

    invariant(results, "User not found");

    return new User(await this.serializeResults(results));
  }

  static async findByUsername(
    username: string,
    context: TweetmixContext
  ): Promise<User> {
    const { results } = await db(context).fetchOne({
      tableName: "users",
      fields: "*",
      where: {
        conditions: "username = ?1",
        params: [username],
      },
    });

    invariant(results, "User not found");

    return new User(await this.serializeResults(results));
  }

  static async serializeResults(results: any) {
    return {
      id: results.id as number,
      email: results.email as string,
      username: results.username as string,
      name: results.name as string,
      avatarUrl:
        "https://www.gravatar.com/avatar/" +
        (await unsafeHash((results.email as string).toLowerCase(), "MD5")),
    };
  }

  toJSON() {
    return this.data;
  }
}
