import type { TweetmixContext } from "types";
import { D1QB } from "workers-qb";

export function db(context: TweetmixContext) {
  return new D1QB(context.DB);
}
