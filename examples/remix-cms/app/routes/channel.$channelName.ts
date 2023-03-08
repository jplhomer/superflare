import type { LoaderArgs } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";

export async function loader({
  request,
  params,
  context: { env },
}: LoaderArgs) {
  const channelName = params.channelName;

  invariant(channelName, "Channel name is required");

  // TODO: Verify user is allowed to access this channel

  const id = env.CHANNELS.idFromName(channelName);
  const channel = env.CHANNELS.get(id);

  const url = new URL(request.url);
  const urlWithoutChannel = new URL(
    url.pathname.replace(/^\/channel\/[^/]+/, "") + "subscribe",
    url.origin
  );
  const newRequest = new Request(urlWithoutChannel);

  return channel.fetch(newRequest, request);
}
