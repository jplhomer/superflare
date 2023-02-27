import { Model } from "superflare";
import { Article } from "./Article";

export class User extends Model {
  /* superflare-types-start */
  id!: number;
  name?: string;
  email!: string;
  password!: string;
  createdAt!: string;
  updatedAt!: string;
  /* superflare-types-end */

  articles?: Article[] | Promise<Article[]>;
  $articles() {
    return this.hasMany(Article);
  }
}
