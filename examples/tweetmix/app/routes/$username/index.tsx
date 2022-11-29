import { json } from "@remix-run/cloudflare";
import type { ShouldReloadFunction } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import type { TweetmixDataFunctionArgs } from "types";
import { TweetTimeline } from "~/components/TweetTimeline";
import { getUserId } from "~/lib/session.server";
import { Tweet as TweetModel } from "~/models/tweet.server";
import { User } from "~/models/user.server";

export async function loader({
  request,
  params,
  context,
}: TweetmixDataFunctionArgs) {
  const userId = await getUserId(request);

  invariant(params.username, "Username is required");

  const user = await User.findByUsername(params.username, context);

  invariant(user, "User not found");

  return json({
    tweets: await TweetModel.where("user_id", user.id, context, userId),
  });
}

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

export default function UsernameIndex() {
  const { tweets } = useLoaderData<typeof loader>();

  return <TweetTimeline tweets={tweets} />;
}
