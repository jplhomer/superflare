import { Model } from 'superflare';

export class User extends Model {
  /* superflare-types-start */
  id: number;
  name?: string;
  email: string;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
  /* superflare-types-end */
}