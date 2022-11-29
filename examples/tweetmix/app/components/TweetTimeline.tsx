import type { TweetData } from "~/models/tweet.server";
import { Tweet } from "~/components/Tweet";

export function TweetTimeline({ tweets }: { tweets: TweetData[] }) {
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-800">
      {tweets.map((tweet) => (
        <li key={tweet.id}>
          <Tweet tweet={tweet} />
        </li>
      ))}
    </ul>
  );
}
