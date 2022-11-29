import { json, redirect } from "@remix-run/cloudflare";
import type { ShouldReloadFunction } from "@remix-run/react";
import { useLoaderData, useMatches } from "@remix-run/react";
import type { TweetmixDataFunctionArgs } from "types";
import { Heading } from "~/components/Text";
import { TweetTimeline } from "~/components/TweetTimeline";
import { getUserId } from "~/lib/session.server";
import { Tweet as TweetModel } from "~/models/tweet.server";
import { TweetComposer } from "./resources/tweets/compose";

/**
 * When Remix actions run, loaders are re-validated with new results.
 * However, this would create a poor experience for users engaging with a tweet,
 * because it would shift the tweet timeline as latest tweets are rendered.
 * Instead, we will tell Remix *not* to re-validate this loader unless
 * we explicitly want it to.
 */
export const unstable_shouldReload: ShouldReloadFunction = () => {
  // TODO: Implement a "should reload" param or action.
  return false;
};

export async function loader({ request, context }: TweetmixDataFunctionArgs) {
  const userId = await getUserId(request);

  if (!userId) {
    return redirect("/");
  }

  return json({
    tweets: await TweetModel.all(context, "", userId),
  });
}

export default function Home() {
  // TODO: Find better way to access this?
  const { user } = useMatches()[0].data;
  const { tweets } = useLoaderData<typeof loader>();

  return (
    <div className="relative pt-16">
      <Heading>Latest Tweets</Heading>
      <TweetComposer user={user} />
      <div className="border-t border-gray-300 dark:border-gray-600">
        <TweetTimeline tweets={tweets} />
      </div>
    </div>
  );
}
