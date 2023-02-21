import { Model } from "superflare";

export class Tweet extends Model {
  static tableName = "tweets";

  /* superflare-types-start */
  id!: number;
  user_id!: number;
  text!: string;
  created_at!: string;
  updated_at!: string;
  number_likes!: number;
  number_retweets!: number;
  number_replies!: number;

  attributes!: {
    id: number;
    user_id: number;
    text: string;
    created_at: string;
    updated_at: string;
    number_likes: number;
    number_retweets: number;
    number_replies: number;
  };
  /* superflare-types-end */

  toJSON() {
    return this.attributes;
  }
}
