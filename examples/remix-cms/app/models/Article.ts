import { Model } from "superflare";
import { User } from "./User";

export class Article extends Model {
  /* superflare-types-start */
  id!: number;
  title!: string;
  slug!: string;
  content?: string;
  userId!: number;
  status!: string;
  createdAt!: string;
  updatedAt!: string;
  /* superflare-types-end */

  user!: User | Promise<User>;
  $user() {
    return this.belongsTo(User);
  }
}
