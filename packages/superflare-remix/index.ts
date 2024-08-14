import { type Request as WorkersRequest } from "@cloudflare/workers-types";
import { type AppLoadContext } from "@remix-run/cloudflare";
import { cloudflareDevProxyVitePlugin } from "@remix-run/dev";
import type {
  DefineConfigReturn,
  SuperflareAuth,
  SuperflareSession,
} from "superflare";
import { type Plugin, type ViteDevServer } from "vite";
import { type GetPlatformProxyOptions } from "wrangler";

import { type Cloudflare, getLoadContext } from "./load-context";

export type { Cloudflare } from "./load-context";

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    auth: InstanceType<typeof SuperflareAuth>;
    session: InstanceType<typeof SuperflareSession>;
    getSessionCookie: () => Promise<string>;
  }
}

/**
 * `handleFetch` is a Remix-specific wrapper around Superflare's function of the same name.
 * It calls getLoadContext to inject `auth` and `session` into the Remix load context.
 */
export async function handleFetch<Env extends { APP_KEY: string }>(
  request: WorkersRequest,
  env: Env,
  ctx: ExecutionContext,
  config: DefineConfigReturn<any>,
  remixHandler: (
    request: Request,
    loadContext: AppLoadContext
  ) => Promise<Response>
) {
  const superflare = await import("superflare");
  const loadContext = await getLoadContext<Env>({
    request,
    context: {
      // This object matches the return value from Wrangler's
      // `getPlatformProxy` used during development via Remix's
      // `cloudflareDevProxyVitePlugin`:
      // https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy
      cloudflare: { caches, ctx, env, cf: request.cf },
    },
    SuperflareAuth: superflare.SuperflareAuth,
    SuperflareSession: superflare.SuperflareSession,
  });

  return await superflare.handleFetch<Env>(
    {
      request,
      env,
      ctx,
      config,
      session: loadContext.session,
      getSessionCookie: loadContext.getSessionCookie,
    },
    () => {
      return remixHandler(
        request as any as Request,
        loadContext as any as AppLoadContext
      );
    }
  );
}

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
    request: WorkersRequest;
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
