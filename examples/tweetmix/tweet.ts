import { Tweet as BaseTweet } from "./types/superflare";

export class Tweet extends BaseTweet {
  static tableName = "tweets";

  hello() {
    return `This tweet is: ${this.id}`;
  }
}
