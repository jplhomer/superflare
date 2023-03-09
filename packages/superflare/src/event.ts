import { getBindingForChannelName } from "./channels";
import { getListenersForEventClass, getQueue, registerEvent } from "./config";
import { serializeArguments } from "./serialize";
import { sanitizeModuleName } from "./string";

export class Event {
  public static shouldQueue = false;
  public static queue = "default";

  public static async dispatch<T extends Event>(
    this: { new (...arg: any[]): T; shouldQueue: boolean; queue: string },
    ...args: any[]
  ): Promise<void> {
    const event = new this(...args);
    if (this.shouldQueue) {
      /**
       * We can't use an internal Job for this, because that creates circular reference issues between
       * `job.ts` and `event.ts`. Instead, we stick it directly on the queue.
       */
      const queueName = this.queue ?? "default";
      const queue = getQueue(queueName);

      if (!queue) {
        throw new Error(`Queue ${queueName} not found.`);
      }

      // TODO: Wrap this in ctx.waitUntil
      queue.send({
        event: sanitizeModuleName(this.name),
        payload: serializeArguments(args),
      });
    } else {
      dispatchEvent(event);
    }
  }

  broadcastTo?(): string;

  public static register(event: any): void {
    registerEvent(event);
  }
}

export function dispatchEvent(event: any): void {
  // console.log(`dispatching`, sanitizeModuleName(event.constructor.name));

  getListenersForEventClass(event.constructor).forEach((listener) => {
    const instance = new listener();
    instance.handle(event);
  });

  if (event.broadcastTo) {
    const channelName = event.broadcastTo();
    if (channelName) {
      broadcastEvent(event, channelName);
    }
  }
}

async function broadcastEvent(event: Event, channelName: string) {
  // console.log(`broadcasting`, sanitizeModuleName(event.constructor.name));

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
