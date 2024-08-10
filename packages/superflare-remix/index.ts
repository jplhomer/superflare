import { type Request } from "@cloudflare/workers-types";
import { type AppLoadContext } from "@remix-run/cloudflare";
import { cloudflareDevProxyVitePlugin } from "@remix-run/dev";
import {
  SuperflareAuth,
  SuperflareSession,
  type DefineConfigReturn,
} from "superflare";
import { type Plugin, type ViteDevServer } from "vite";
import { type GetPlatformProxyOptions } from "wrangler";

import { type Cloudflare, getLoadContext } from "./load-context";

/**
 * `handleFetch` is a Remix-specific wrapper around Superflare's function of the same name.
 * It calls getLoadContext to inject `auth` and `session` into the Remix load context.
 */
export async function handleFetch<Env extends { APP_KEY: string }>(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  config: DefineConfigReturn<any>,
  remixHandler: (
    request: Request,
    loadContext: AppLoadContext
  ) => Promise<Response>
) {
  const loadContext = await getLoadContext({
    request,
    context: {
      // This object matches the return value from Wrangler's
      // `getPlatformProxy` used during development via Remix's
      // `cloudflareDevProxyVitePlugin`:
      // https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy
      cloudflare: { caches, ctx, env, cf: request.cf },
    },
    config,
    ctx,
    SuperflareAuth,
    SuperflareSession,
  });

  const { handleFetch: superflareHandleFetch } = await import("superflare");

  return await superflareHandleFetch<Env>(
    {
      request,
      env,
      ctx,
      config,
      session: loadContext.session,
      getSessionCookie: () =>
        sessionStorage.commitSession(loadContext.session.getSession()),
    },
    () => remixHandler(request, loadContext)
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

type ConfigureServer = (viteDevServer: ViteDevServer) => Promise<() => void>;

export const superflareDevProxyVitePlugin = (
  options: GetPlatformProxyOptions = {}
): Plugin => {
  let viteDevServer: ViteDevServer | null = null;

  const getLoadContextWrapper = async ({
    request,
    context,
  }: {
    request: Request;
    context: { cloudflare: Cloudflare };
  }) => {
    if (!viteDevServer) return context;
    // use vite dev server to import singleton-dependent modules
    // ensures the Config singleton class is correct and consistent
    const superflare = await viteDevServer.ssrLoadModule("superflare");
    const config = await viteDevServer.ssrLoadModule("./superflare.config");
    return getLoadContext({
      request,
      context,
      ctx: new ExecutionContext(),
      config: config.default,
      SuperflareAuth: superflare.SuperflareAuth,
      SuperflareSession: superflare.SuperflareSession,
    });
  };

  const vitePlugin = cloudflareDevProxyVitePlugin({
    ...options,
    experimentalJsonConfig: true,
    // @cloudflare/workers-types’ Request type incompatible with global used here:
    // https://github.com/remix-run/remix/blob/main/packages/remix-dev/vite/cloudflare-proxy-plugin.ts
    getLoadContext: getLoadContextWrapper as any,
  });

  return {
    ...vitePlugin,
    configureServer: (_viteDevServer: ViteDevServer) => {
      viteDevServer = _viteDevServer;
      return (vitePlugin.configureServer as ConfigureServer)(_viteDevServer);
    },
  };
};
