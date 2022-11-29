import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import type { TweetmixDataFunctionArgs } from "types";
import { Heading } from "~/components/Text";
import { Tweet } from "~/components/Tweet";
import { getUserId } from "~/lib/session.server";
import { Tweet as TweetModel } from "~/models/tweet.server";

export async function loader({
  request,
  params,
  context,
}: TweetmixDataFunctionArgs) {
  invariant(params.tweetId, "Tweet ID is required");

  const userId = await getUserId(request);
  const tweet = await TweetModel.find(Number(params.tweetId), context, userId);

  invariant(tweet, "Tweet not found");
  invariant(tweet.user?.username === params.username, "Tweet not found");

  return json({ tweet });
}

export default function TweetDetail() {
  const { tweet } = useLoaderData<typeof loader>();

  return (
    <div className="relative pt-16">
      <Heading>Tweet</Heading>
      <Tweet tweet={tweet} />
    </div>
  );
}
