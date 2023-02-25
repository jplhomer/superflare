export interface SupercloudUserConfig {
  database?: D1Database;
  storage?: { default: R2Bucket } & Record<string, R2Bucket>;
}

export function config(userConfig: SupercloudUserConfig): void {
  if (userConfig.database) {
    Config.database = {
      connections: {
        default: userConfig.database,
      },
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
    connections: Record<string, D1Database>;
  };

  static storage?: {
    disks: { default: R2Bucket } & Record<string, R2Bucket>;
  };
}
