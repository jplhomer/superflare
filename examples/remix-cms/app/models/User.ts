import { Model } from 'superflare';

export class User extends Model {
  /* superflare-types-start */
  id!: number;
  name?: string;
  email!: string;
  password!: string;
  createdAt!: string;
  updatedAt!: string;
  /* superflare-types-end */
}