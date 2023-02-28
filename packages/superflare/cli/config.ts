import { register } from "esbuild-register/dist/node";
import path from "node:path";

import type { Logger } from "./logger";

interface SuperflarePackageJsonConfig {
  d1?: string[];
  r2?: string[];
}

/**
 * Get the user's superflare.config.ts file, if it exists.
 * This contains a list of d1 and r2 bindings. We need to
 * load this file in order to know what bindings to pass
 * to `wrangler pages dev`, but we don't want to make
 * the dev define this information in two places.
 */
export async function getSuperflareConfig(
  workingDir: string,
  logger?: Logger
): Promise<SuperflarePackageJsonConfig | null> {
  register();

  /**
   * Use a Fun Trick™ to get the user's superflare.config.ts bindings by
   * passing a proxy to the `env` key. We can then inspect the proxy
   * to see what keys were accessed, and use those as the bindings.
   */
  const envProxies: Record<string, Symbol> = {};
  const ctxStub = {
    env: new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          console.log(`Getting ${prop} from ctx.env...`);
          // Define a new unique key so we can track it
          envProxies[prop] = Symbol(prop);

          return envProxies[prop];
        },
      }
    ),
  };

  try {
    const config = require(path.join(workingDir, "superflare.config.ts"));
    const results = config.default(ctxStub);
    const flippedEnvProxies = Object.entries(envProxies).reduce(
      (acc, [key, value]) => {
        acc[value as symbol] = key;
        return acc;
      },
      {} as Record<symbol, string>
    );

    // D1 configs are stored in the `database` key
    const d1Bindings = Object.keys(results.database)
      .map((key) => {
        const binding = results.database[key];

        if (typeof binding === "symbol") {
          return flippedEnvProxies[binding] as string;
        }
      })
      .filter(Boolean) as string[];

    // R2 configs are stored in the `storage` key
    const r2Bindings = Object.keys(results.storage)
      .map((key) => {
        const binding = results.storage[key].binding;

        if (typeof binding === "symbol") {
          return flippedEnvProxies[binding] as string;
        }
      })
      .filter(Boolean) as string[];

    return {
      d1: d1Bindings,
      r2: r2Bindings,
    };
  } catch (e: any) {
    logger?.debug(`Error loading superflare.config.ts: ${e.message}`);
    return null;
  }
}
