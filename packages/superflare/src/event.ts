import { getListenersForEventClass, registerEvent } from "./config";

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
    }
  }

  public static register<T extends Event>(event: T): void {
    registerEvent(event);
  }
}

function dispatchEvent(event: Event): void {
  console.log(`dispatching`, event.constructor.name);
  getListenersForEventClass(event.constructor).forEach((listener) => {
    const instance = new listener();
    instance.handle(event);
  });
}
