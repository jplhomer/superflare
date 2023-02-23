import { Model } from 'superflare';

export class Article extends Model {
  /* superflare-types-start */
  id!: number;
  title!: string;
  slug!: string;
  content?: string;
  user_id!: number;
  status!: string;
  created_at!: string;
  updated_at!: string;
  /* superflare-types-end */
}