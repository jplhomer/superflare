import { Event } from "superflare";
import type { Article } from "~/models/Article";

export class ArticleUpdated extends Event {
  static shouldQueue = true;

  constructor(public article: Article) {
    super();
  }

  broadcastTo() {
    return `article.${this.article.slug}`;
  }
}

Event.register(ArticleUpdated);
