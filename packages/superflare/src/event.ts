import { getEnv, getListenersForEventClass, registerEvent } from "./config";
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

async function broadcastEvent(event: Event, channelName: String) {
  console.log(`broadcasting`, sanitizeModuleName(event.constructor.name));

  const id = getEnv().CHANNELS.idFromName(channelName);
  const channel = getEnv().CHANNELS.get(id);

  const data = {
    event: sanitizeModuleName(event.constructor.name),
    data: event,
  };

  // TODO: Read user-defined channel from config
  await channel.fetch(new URL("https://example.com/"), {
    method: "POST",
    body: JSON.stringify(data),
  });
}
