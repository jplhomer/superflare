import { Model } from "superflare";

class Tweet extends Model {
  static tableName = "tweets";

  foo!: string;

  hello() {
    return `This tweet is: ${this.id}`;
  }
}

Tweet.all();
Tweet.count();

const tweet = await Tweet.first();
tweet?.hello();
