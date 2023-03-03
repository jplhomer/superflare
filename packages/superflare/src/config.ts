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

export interface SupercloudUserConfig {
  database?: { default: D1Database } & Record<string, D1Database>;
  storage?: { default: StorageDiskConfig } & Record<string, StorageDiskConfig>;
  queues?: { default: Queue } & Record<string, Queue>;
}

export function config(userConfig: SupercloudUserConfig) {
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
    Config.queues = {
      connections: userConfig.queues,
    };
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

export class Config {
  static database?: {
    connections: SupercloudUserConfig["database"];
  };

  static storage?: {
    disks: SupercloudUserConfig["storage"];
  };

  static queues?: {
    connections: SupercloudUserConfig["queues"];
  };

  static models?: {
    [name: string]: any;
  };
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

export function defineConfig<Env = Record<string, any>>(
  callback: (ctx: DefineConfigContext<Env>) => SupercloudUserConfig
) {
  return (ctx: DefineConfigContext<Env>) => config(callback(ctx));
}
