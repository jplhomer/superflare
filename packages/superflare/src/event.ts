import { getBindingForChannelName } from "./channels";
import {
  getChannel,
  getChannelNames,
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

  const binding = getBindingForChannelName(channelName);

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
