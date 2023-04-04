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
export type DefineConfigResult = SuperflareUserConfig;

export function defineConfig<Env = Record<string, any>>(
  callback: (ctx: DefineConfigContext<Env>) => SuperflareUserConfig
): (ctx: DefineConfigContext<Env>) => DefineConfigResult {
  return (ctx: DefineConfigContext<Env>) => callback(ctx);
}
