import { Listener } from "superflare";
import type { ArticleUpdated } from "~/events/ArticleUpdated";

export class LogArticleUpdated extends Listener {
  handle(event: ArticleUpdated) {
    console.log(`Article ${event.article.title} updated!`);
  }
}
