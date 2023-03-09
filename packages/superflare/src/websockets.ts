import invariant from "tiny-invariant";
import { Auth } from "./auth";
import { getBindingForChannelName, getConfigForChannelName } from "./channels";
import { SuperflareSession } from "./session";

export async function handleWebSockets(
  request: Request,
  {
    auth,
    session,
    userModel,
    channelName: specifiedChannelName,
  }: {
    auth?: Auth;
    session?: SuperflareSession;
    userModel?: any;
    channelName?: string;
  } = {}
) {
  const url = new URL(request.url);
  const channelNameFrompath = url.pathname.split("/").pop();

  const channelName = specifiedChannelName || channelNameFrompath;

  invariant(channelName, "Channel name is required");

  const [config, configName] = getConfigForChannelName(channelName);

  if (config && config.authorize) {
    if (!auth) {
      throw new Error(
        "You must provide `auth` to `handleWebSockets` in order to authorize the request"
      );
    }

    if (!userModel) {
      throw new Error(
        "You must provide `userModel` to `handleWebSockets` in order to authorize the request"
      );
    }

    const user = await auth.user(userModel);

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get the channel configuration name with asterisks and convert them to real values
    const inputValues = channelName.split(".");
    const configValues = configName.split(".");
    const dynamicValues = configValues
      .map((value, index) => {
        if (value === "*") {
          return inputValues[index];
        }
      })
      .filter(Boolean) as string[];

    // Call the authorize function with the user + the values as arguments
    const isAuthorized = await config.authorize(user, ...dynamicValues);

    if (!isAuthorized) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const binding = getBindingForChannelName(channelName);

  if (!binding) {
    throw new Error(
      `No channel binding found for "${channelName}". Please update your superflare.config.`
    );
  }

  const id = binding.idFromName(channelName);
  const channel = binding.get(id);

  return channel.fetch("https://example.com/", request);
}
