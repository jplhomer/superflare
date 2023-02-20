import { Model } from "superflare";

class Post extends Model {
  static tableName = "posts";

  id!: number;
  title!: string;
  body?: string;
}
