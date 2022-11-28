export interface SupercloudUserConfig {
  database?: D1Database;
}

export function config(userConfig: SupercloudUserConfig): void {
  if (userConfig.database) {
    Config.database = {
      connections: {
        default: userConfig.database,
      },
    };
  }
}

export class Config {
  static database?: {
    connections: Record<string, D1Database>;
  };
}
