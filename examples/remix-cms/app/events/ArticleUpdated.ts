import { Event } from "superflare";
import type { Article } from "~/models/Article";

export class ArticleUpdated extends Event {
  constructor(public article: Article) {
    super();
  }
}

Event.register(ArticleUpdated);
