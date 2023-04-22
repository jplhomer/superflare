import { AsyncLocalStorage } from "node:async_hooks";
import type { SuperflareUserConfig } from "./config";
import { sanitizeModuleName } from "./string";

interface AppContextContainer {
  ctx?: AppContext;
}

/**
 * AppContext represents the context of the current request or job. It is added to the AsyncLocalStorage
 * so that it can be accessed from anywhere in the current request closure, which means it will not be
 * leaked between requests.
 */
export interface AppContext {
  appKey?: SuperflareUserConfig["appKey"];
  env?: any;
  ctx?: ExecutionContext;
  database?: {
    connections: SuperflareUserConfig["database"];
  };
  storage?: {
    disks: SuperflareUserConfig["storage"];
  };
  queues?: SuperflareUserConfig["queues"];
  listeners?: Map<string, any[]>;
  channels?: SuperflareUserConfig["channels"];
}

export const asyncLocalStorage = new AsyncLocalStorage<AppContextContainer>();

class TestContext implements AppContext {
  static appKey?: SuperflareUserConfig["appKey"];
  static database?: {
    connections: SuperflareUserConfig["database"];
  };
  static storage?: {
    disks: SuperflareUserConfig["storage"];
  };
  static queues?: SuperflareUserConfig["queues"];
  static listeners?: Map<string, any[]>;
  static channels?: SuperflareUserConfig["channels"];
}

export function setTestContext(userConfig: SuperflareUserConfig) {
  TestContext.appKey = userConfig.appKey;
  TestContext.database = {
    connections: userConfig.database,
  };
  TestContext.storage = {
    disks: userConfig.storage,
  };
  TestContext.queues = userConfig.queues;
  TestContext.channels = userConfig.channels;
  TestContext.listeners = new Map(Object.entries(userConfig.listeners ?? {}));
}

export function getContext(): AppContext {
  if (process.env.NODE_ENV === "test") {
    return TestContext;
  }

  const context = asyncLocalStorage.getStore();

  if (!context || !context.ctx) {
    throw new Error(
      "No context found. You must be inside the request lifecycle to access Superflare context."
    );
  }

  return context.ctx;
}

export async function runWithContext<T>(
  context: AppContext,
  fn: () => Promise<T>
) {
  return await asyncLocalStorage.run({}, async () => {
    /**
     * I'm being extra cautious to not set the object value until we're _inside_ the asyncLocalStorage.run
     * closure. This is to prevent accidental leaks between requests. I don't know if it's necessary.
     */
    asyncLocalStorage.getStore()!.ctx = context;
    return await fn();
  });
}

/**
 * Meant to be used for console and internal uses only.
 */
export async function enterWithConfig<T>(userConfig: SuperflareUserConfig) {
  asyncLocalStorage.enterWith({
    ctx: getContextFromUserConfig(userConfig),
  });
  console.log(getContext());
}

/**
 * Converts a SuperflareConfig into an AppContext value.
 */
export function getContextFromUserConfig(
  userConfig: SuperflareUserConfig
): AppContext {
  const context: AppContext = {};

  context.appKey = userConfig.appKey;

  if (userConfig.database) {
    context.database = {
      connections: userConfig.database,
    };
  }
  if (userConfig.storage) {
    context.storage = {
      disks: userConfig.storage,
    };
  }
  if (userConfig.queues) {
    context.queues = userConfig.queues;
  }
  if (userConfig.channels) {
    context.channels = userConfig.channels;
  }
  if (userConfig.listeners) {
    context.listeners = new Map(Object.entries(userConfig.listeners));
  }

  return context;
}

export function getQueue(name: string) {
  return getContext().queues?.[name];
}

export function getListenersForEventClass(eventClass: any) {
  const eventName = sanitizeModuleName(eventClass.name);
  return getContext().listeners?.get(eventName) || [];
}

export function getChannelNames() {
  return Object.keys(getContext().channels || {});
}

export function getChannel(name: string) {
  return getContext().channels?.[name];
}

export function getStorage() {
  return getContext().storage;
}

export function getDatabase() {
  return getContext().database;
}
