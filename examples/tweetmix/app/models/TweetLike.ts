import { Model } from 'superflare';

export class TweetLike extends Model {
  /* superflare-types-start */
  id: number;
  user_id: number;
  tweet_id: number;
  created_at: string;
  updated_at: string;
  /* superflare-types-end */
}