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
}

export function config(userConfig: SupercloudUserConfig): void {
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
}

export class Config {
  static database?: {
    connections: SupercloudUserConfig["database"];
  };

  static storage?: {
    disks: SupercloudUserConfig["storage"];
  };
}
