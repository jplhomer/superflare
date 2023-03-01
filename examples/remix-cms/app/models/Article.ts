import { Model } from "superflare";
import { User } from "./User";

export class Article extends Model {
  user!: User | Promise<User>;
  $user() {
    return this.belongsTo(User);
  }

  toJSON(): ArticleRow {
    return super.toJSON();
  }
}

/* superflare-types-start */
interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  content?: string;
  userId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Article extends ArticleRow {}
/* superflare-types-end */
