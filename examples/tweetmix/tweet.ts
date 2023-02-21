import { Model } from "superflare";

class Tweet extends Model {
  static tableName = "tweets";

  hello() {
    return `This tweet is: ${this.id}`;
  }
}

Tweet.all();
Tweet.count();

const tweet = await Tweet.first();
tweet?.hello();
