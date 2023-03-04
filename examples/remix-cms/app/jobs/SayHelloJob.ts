import { Job } from "superflare";
import type { Article } from "~/models/Article";

export class SayHelloJob extends Job {
  constructor(public article: Article) {
    super();
  }

  async handle(): Promise<void> {
    console.log(`Hello, ${this.article.title}!`);
  }
}

Job.register(SayHelloJob);
