import { registerListener } from "./config";

export abstract class Listener {
  abstract handle(event: any): void;

  static register(listener: any, event: any): void {
    registerListener(listener, event);
  }
}

export function registerListeners(_listeners: any) {
  // No-op.
}
