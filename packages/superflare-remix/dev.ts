import { type Request } from "@cloudflare/workers-types";
import { cloudflareDevProxyVitePlugin } from "@remix-run/dev";
import { type Cloudflare, getLoadContext } from "./load-context";
import { type Plugin, type ViteDevServer } from "vite";
import { type GetPlatformProxyOptions } from "wrangler";

/**
 * This is copied from the workers-sdk repo (used for wrangler’s getPlatformProxy).
 * Using `waitUntil` means invoking the async function, so a no-op works in dev.
 * @see https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/api/integrations/platform/executionContext.ts
 */
class ExecutionContext {
  waitUntil(promise: Promise<any>): void {
    if (!(this instanceof ExecutionContext)) {
      throw new Error("Illegal invocation");
    }
  }
  passThroughOnException(): void {
    if (!(this instanceof ExecutionContext)) {
      throw new Error("Illegal invocation");
    }
  }
}

export function superflareDevProxyVitePlugin<Env extends { APP_KEY: string }>(
  options: GetPlatformProxyOptions = {}
): Plugin {
  const ctx = new ExecutionContext();
  let server: ViteDevServer;

  const getLoadContextWrapper = async ({
    request,
    context,
  }: {
    request: Request;
    context: { cloudflare: Cloudflare<Env> };
  }) => {
    // Use vite dev server to import singleton-dependent modules,
    // ensuring the Config singleton class is correct and consistent
    const superflare = (await server.ssrLoadModule("superflare")) as any;
    const config = (await server.ssrLoadModule("./superflare.config")).default;

    const loadContext = await getLoadContext<Env>({
      request,
      context,
      SuperflareAuth: superflare.SuperflareAuth,
      SuperflareSession: superflare.SuperflareSession,
    });

    // Initialize config here (instead of in superflare#handleFetch)
    config({ request, ctx, env: loadContext.cloudflare.env });
    return loadContext;
  };

  const remixVitePlugin = cloudflareDevProxyVitePlugin({
    ...options,
    experimentalJsonConfig: true,
    // @cloudflare/workers-types’ Request type incompatible with global used here:
    // https://github.com/remix-run/remix/blob/main/packages/remix-dev/vite/cloudflare-proxy-plugin.ts
    getLoadContext: getLoadContextWrapper as any,
  });

  return {
    ...remixVitePlugin,
    configureServer: async (viteDevServer: ViteDevServer) => {
      server = viteDevServer;
      // Hand off middleware installation to cloudflareDevProxyVitePlugin
      return (remixVitePlugin.configureServer as any)(viteDevServer);
    },
  };
}
