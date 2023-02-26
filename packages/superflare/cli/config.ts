import path from "node:path";

import type { Logger } from "./logger";

interface SuperflarePackageJsonConfig {
  d1?: string[];
  r2?: string[];
}

export async function getSuperflareConfigFromPackageJson(
  workingDir: string,
  logger?: Logger
): Promise<SuperflarePackageJsonConfig | null> {
  try {
    const pkg = require(path.join(workingDir, "package.json"));
    return pkg.superflare;
  } catch (e: any) {
    logger?.debug(`Error loading package.json: ${e.message}`);
    return null;
  }
}
