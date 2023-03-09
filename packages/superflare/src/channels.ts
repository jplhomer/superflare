import { ChannelConfig, getChannel, getChannelNames } from "./config";

export function getConfigForChannelName(
  channelName: string
): [channelConfig: ChannelConfig | undefined, channelName: string] {
  const defaultChannel = getChannel("default");
  const specificChannelName = channelNameToConfigName(
    channelName,
    getChannelNames()
  );

  return specificChannelName
    ? [getChannel(specificChannelName), specificChannelName]
    : [defaultChannel, "default"];
}

export function getBindingForChannelName(channelName: string) {
  const defaultChannel = getChannel("default");
  const [config] = getConfigForChannelName(channelName);

  return config?.binding || defaultChannel?.binding;
}

/**
 * Given that the user may have defined channel names with period-separated *,
 * this function attempts to match a given channel name to one of the channel
 * names defined in the config.
 *
 * We use a regex to replace all asterisks with match patterns, then we use
 * the match method to find the first match.
 */
export function channelNameToConfigName(
  channelName: string,
  channelNames: string[]
): string {
  const exactMatch = channelNames.find((name) => name === channelName);

  if (exactMatch) {
    return exactMatch;
  }

  const channelNamesWithRegexes = channelNames.map((name) => {
    return {
      name,
      regex: new RegExp(name.replace(/\*/g, "[^.]+")),
    };
  });

  const matches = channelNamesWithRegexes.filter((name) => {
    return name.regex.exec(channelName);
  });

  return matches.sort(
    (a, b) => b.name.split(".").length - a.name.split(".").length
  )[0]?.name;
}
