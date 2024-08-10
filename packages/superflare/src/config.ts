import { type Request } from "@cloudflare/workers-types";
import { sanitizeModuleName } from "./string";

export interface StorageDiskConfig {
  binding: R2Bucket;
  /**
   * Optional. The public URL to the disk. If you have made your R2 bucket public, you can
   * set this to the URL of the bucket. If your R2 bucket is private but you want to allow
   * access to objects, you can set this to a local route like `/storage/<diskname>` where you are
   * proxying the R2 bucket.
   *
   * If you do not set this, `storage()->url(key)` for objects in this disk will return `null`.
   */
  publicPath?: string;
}

type ChannelAuthorizeFunction = (
  user: any,
  ...args: any
) => boolean | Promise<boolean>;

type ChannelPresenceFunction = (user: any, ...args: any) => any | Promise<any>;

export type ChannelConfig = {
  binding?: DurableObjectNamespace;
  authorize?: ChannelAuthorizeFunction;
  presence?: ChannelPresenceFunction;
};

interface ChannelsConfig {
  default: {
    binding: DurableObjectNamespace;
  };
  [name: string]: ChannelConfig;
}

export interface SuperflareUserConfig {
  /**
   * A secret key used to sign cookies and other sensitive data.
   */
  appKey?: string;
  database?: { default: D1Database } & Record<string, D1Database>;
  storage?: { default: StorageDiskConfig } & Record<string, StorageDiskConfig>;
  queues?: { default: Queue } & Record<string, Queue>;
  listeners?: {
    [name: string]: any[];
  };
  channels?: ChannelsConfig;
}

export function setConfig(userConfig: SuperflareUserConfig) {
  Config.appKey = userConfig.appKey;

  if (userConfig.database) {
    Config.database = {
      connections: userConfig.database,
    };
  }
  if (userConfig.storage) {
    Config.storage = {
      disks: userConfig.storage,
    };
  }
  if (userConfig.queues) {
    Config.queues = userConfig.queues;
  }
  if (userConfig.channels) {
    Config.channels = userConfig.channels;
  }
  if (userConfig.listeners) {
    Config.listeners = new Map(Object.entries(userConfig.listeners));
  }

  return userConfig;
}

/**
 * Register a model into the Superflare config.
 */
export function registerModel(model: any) {
  Config.models = Config.models || {};
  Config.models[model.name] = model;
}

export function getModel(name: string) {
  return Config.models?.[name];
}

/**
 * Register a job into the Superflare config.
 */
export function registerJob(job: any) {
  const jobName = sanitizeModuleName(job.name);
  Config.jobs = Config.jobs || {};
  Config.jobs[jobName] = job;
}

export function getJob(name: string) {
  return Config.jobs?.[name];
}

export function getQueue(name: string) {
  return Config.queues?.[name];
}

export function registerEvent(event: any) {
  const eventName = sanitizeModuleName(event.name);
  Config.events = Config.events || {};
  Config.events[eventName] = event;
}

export function getEvent(name: string) {
  return Config.events?.[name];
}

export function getListenersForEventClass(eventClass: any) {
  const eventName = sanitizeModuleName(eventClass.name);
  return Config.listeners.get(eventName) || [];
}

export function setEnv(env: any) {
  Config.env = env;
}

export function getEnv() {
  return Config.env;
}

export function getChannelNames() {
  return Object.keys(Config.channels || {});
}

export function getChannel(name: string) {
  return Config.channels?.[name as keyof typeof Config.channels];
}

export class Config {
  static appKey: SuperflareUserConfig["appKey"];

  static env: any;

  static ctx: ExecutionContext;

  static database?: {
    connections: SuperflareUserConfig["database"];
  };

  static storage?: {
    disks: SuperflareUserConfig["storage"];
  };

  static queues?: SuperflareUserConfig["queues"];

  static models?: {
    [name: string]: any;
  };

  static jobs?: {
    [name: string]: any;
  };

  static events?: {
    [name: string]: any;
  };

  static listeners: Map<string, any[]> = new Map();

  static channels: SuperflareUserConfig["channels"];
}

/**
 * Accept a general set of request attributes in order to work
 * with both Cloudflare Workers and Pages.
 */
type DefineConfigContext<Env = Record<string, any>> = {
  /**
   * Request will not always be present, e.g. if the context is a queue worker.
   */
  request?: Request;
  env: Env;
  ctx: ExecutionContext;
};

/**
 * Return both the userConfig and the ctx so we can re-use that in the request
 * handlers without asking the user to pass them again.
 */
export type DefineConfigReturn<Env> = (
  ctx: DefineConfigContext<Env>
) => SuperflareUserConfig;

export function defineConfig<Env = Record<string, any>>(
  callback: (ctx: DefineConfigContext<Env>) => SuperflareUserConfig
): DefineConfigReturn<Env> {
  return (ctx: DefineConfigContext<Env>) => {
    setEnv(ctx.env);
    return setConfig(callback(ctx));
  };
}
