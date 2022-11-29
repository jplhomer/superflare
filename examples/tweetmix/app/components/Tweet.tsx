import {
  ArrowPathRoundedSquareIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { Link } from "@remix-run/react";
import type { TweetData } from "~/models/tweet.server";
import { LikeButton, ReplyButton } from "~/routes/resources/tweets/stats";
import { getRelativeTime } from "~/utils";
import { UserAvatar } from "./UserAvatar";

export function Tweet({ tweet }: { tweet: TweetData }) {
  return (
    <div className="block p-4">
      <UserAvatar user={tweet.user!}>
        <div className="space-x-1">
          <Link
            to={`/${tweet.user!.username}`}
            className="font-bold hover:underline"
          >
            {tweet.user!.name ?? tweet.user!.username}
          </Link>
          <Link to={`/${tweet.user!.username}`} className="text-gray-500">
            @{tweet.user!.username}
          </Link>
          <span className="text-gray-500">&bull;</span>
          <Link
            className="text-gray-500 hover:underline"
            to={`/${tweet.user!.username}/status/${tweet.id}`}
          >
            {getRelativeTime(new Date(tweet.createdAt))}
          </Link>
        </div>
        <div>{tweet.text}</div>
        <ul className="mt-2 grid grid-cols-4">
          <li>
            <ReplyButton tweet={tweet} />
          </li>
          <li>
            <button className="hover:bg-green-200 rounded-full p-2 transition-all group">
              <ArrowPathRoundedSquareIcon className="h-4 w-4 text-gray-500 group-hover:text-green-600" />
              <span className="sr-only">Retweet</span>
            </button>
          </li>
          <li>
            <LikeButton tweet={tweet} />
          </li>
          <li>
            <button className="hover:bg-blue-200 rounded-full p-2 transition-all group">
              <ArrowUpTrayIcon className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
              <span className="sr-only">Share</span>
            </button>
          </li>
        </ul>
      </UserAvatar>
    </div>
  );
}
