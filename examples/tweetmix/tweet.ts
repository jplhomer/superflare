import { Model } from "superflare";

export class Tweet extends Model {
  static tableName = "tweets";

  hello() {
    return `This tweet is: ${this.id}`;
  }
}
