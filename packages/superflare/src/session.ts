import { Config } from "./config";

export interface Session {
  get(key: string): any;
  set(key: string, value: any): void;
  unset(key: string): void;
  flash(key: string, value: any): void;
}

export function session(): Session {
  if (!Config.session) {
    throw new Error(
      "Session is not available. Did you forget to pass a valid `Session` to `handleFetch`?"
    );
  }

  return Config.session;
}
