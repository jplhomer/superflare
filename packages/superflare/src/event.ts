import {
  getChannel,
  getChannelNames,
  getEnv,
  getListenersForEventClass,
  registerEvent,
} from "./config";
import { sanitizeModuleName } from "./string";

export class Event {
  public static shouldQueue = false;

  public static dispatch<T extends Event>(
    this: { new (...arg: any[]): T; shouldQueue: boolean },
    ...args: any[]
  ): void {
    if (this.shouldQueue) {
      // TODO: Queue the event.
    } else {
      const event = new this(...args);
      dispatchEvent(event);

      if (event.broadcastTo) {
        const channelName = event.broadcastTo();
        if (channelName) {
          broadcastEvent(event, channelName);
        }
      }
    }
  }

  broadcastTo?(): string;

  public static register(event: any): void {
    registerEvent(event);
  }
}

function dispatchEvent(event: Event): void {
  console.log(`dispatching`, sanitizeModuleName(event.constructor.name));
  getListenersForEventClass(event.constructor).forEach((listener) => {
    const instance = new listener();
    instance.handle(event);
  });
}

async function broadcastEvent(event: Event, channelName: string) {
  console.log(`broadcasting`, sanitizeModuleName(event.constructor.name));

  const defaultChannel = getChannel("default");
  const specificChannelName = channelNameToConfigName(
    channelName,
    getChannelNames()
  );

  const config = specificChannelName
    ? getChannel(specificChannelName)
    : defaultChannel;

  const binding = config?.binding || defaultChannel?.binding;

  if (!binding) {
    throw new Error(
      `No channel binding found for ${channelName}. Please update your superflare.config.`
    );
  }

  const id = binding.idFromName(channelName);
  const channel = binding.get(id);

  const data = {
    event: sanitizeModuleName(event.constructor.name),
    data: event,
  };

  await channel.fetch("https://example.com/", {
    method: "POST",
    body: JSON.stringify(data),
  });
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
