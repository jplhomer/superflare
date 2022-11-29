import invariant from "tiny-invariant";
import { db } from "~/lib/db.server";
import { Model } from "./model.server";
import type { UserData } from "./user.server";
import { User } from "./user.server";

export interface TweetData {
  id: number;
  userId: number;
  text: string;
  createdAt: string;
  user?: UserData | null;
  numberLikes: number;
  numberRetweets: number;
  numberReplies: number;
  hasLiked?: boolean;
}

export class Tweet extends Model<TweetData> {
  get id() {
    return this.data.id;
  }

  get user() {
    return this.data.user;
  }

  get text() {
    return this.data.text;
  }

  get createdAt() {
    return this.data.createdAt;
  }

  async like(userId: number, context: TweetmixContext) {
    await context.TWEETS_DB.prepare(
      `
      insert into tweet_likes (tweet_id, user_id)
      values (?1, ?2)
    `
    )
      .bind(this.id, userId)
      .run();
  }

  async unlike(userId: number, context: TweetmixContext) {
    await context.TWEETS_DB.prepare(
      `delete from tweet_likes where tweet_id = ?1 and user_id = ?2`
    )
      .bind(this.id, userId)
      .run();
  }

  async totalLikes(context: TweetmixContext) {
    const total = await context.TWEETS_DB.prepare(
      `
      select count(*) as total_likes
      from tweet_likes
      where tweet_id = ?1
    `
    )
      .bind(this.id)
      .first("total_likes");

    return Number(total);
  }

  async updateTotalLikes(totalLikes: number, context: TweetmixContext) {
    await context.TWEETS_DB.prepare(
      `
      update tweets
      set number_likes = ?1
      where id = ?2
    `
    )
      .bind(totalLikes, this.id)
      .run();
  }

  async userHasLiked(
    userId: number,
    context: TweetmixContext
  ): Promise<boolean> {
    const { results } = await db(context).fetchOne({
      tableName: "tweet_likes",
      fields: "count(*) as count",
      where: {
        conditions: "tweet_id = ?1 and user_id = ?2",
        params: [this.id, userId],
      },
    });

    return results!.count === 1;
  }

  static async create(
    { text, userId }: { text: string; userId: number },
    context: TweetmixContext
  ) {
    const { results } = await db(context).insert({
      tableName: "tweets",
      data: {
        created_at: new Date().toUTCString(),
        user_id: userId,
        text,
      },
      returning: "*",
    });

    return new Tweet(await this.serializeResults(results));
  }

  static async all(
    context: TweetmixContext,
    where = "",
    userId?: number
  ): Promise<Tweet[]> {
    const bindValues = userId ? [userId] : [];
    const { results } = await context.DB.prepare(
      `select
        tweets.*,
        users.username as user_username,
        users.email as user_email,
        users.name as user_name
        ${
          userId
            ? `, (
          select count(*) from tweet_likes where tweet_likes.tweet_id = tweets.id and tweet_likes.user_id = ?1
        ) has_liked`
            : ""
        }
      from tweets
      left join users
      on tweets.user_id = users.id
      ${where ? `where ${where}` : ""}
      order by tweets.created_at desc`
    )
      .bind(...bindValues)
      .all();

    invariant(results, "Could not fetch tweets");

    // TODO: Learn TypeScript
    return (await this.convertResultsToModels(results)) as unknown as Tweet[];
  }

  static async where(
    column: string,
    value: any,
    context: TweetmixContext,
    userId?: number
  ): Promise<Tweet[]> {
    return this.all(context, `${column} = '${value}'`, userId);
  }

  static async find(
    tweetId: number,
    context: TweetmixContext,
    userId?: number
  ): Promise<Tweet> {
    const results = await this.where("tweets.id", tweetId, context, userId);

    return results[0];
  }

  static async serializeResults(results: any) {
    const user = await this.convertRelationsToModels<User>(
      results,
      User,
      "user"
    );

    return {
      id: results.id as number,
      userId: results.user_id as number,
      text: results.text as string,
      createdAt: results.created_at,
      numberLikes: results.number_likes as number,
      numberRetweets: results.number_retweets as number,
      numberReplies: results.number_replies as number,
      hasLiked: Boolean(results.has_liked),
      user,
    };
  }
}
