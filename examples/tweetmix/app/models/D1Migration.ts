import { Model } from 'superflare';

export class D1Migration extends Model {
  /* superflare-types-start */
  id!: number;
  name?: string;
  applied_at!: string;
  /* superflare-types-end */
}