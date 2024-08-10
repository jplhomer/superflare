import { type Request } from "@cloudflare/workers-types";
import { type AppLoadContext } from "@remix-run/cloudflare";
import { cloudflareDevProxyVitePlugin } from "@remix-run/dev";
import {
  defineConfig,
  handleFetch as superflareHandleFetch,
  SuperflareAuth,
  SuperflareSession,
} from "superflare";
import { type Plugin } from "vite";
import { type GetPlatformProxyOptions } from "wrangler";

import { getLoadContext } from "./load-context";

/**
 * `handleFetch` is a Remix-specific wrapper around Superflare's function of the same name.
 * It calls getLoadContext to inject `auth` and `session` into the Remix load context.
 */
export async function handleFetch<Env extends { APP_KEY: string }>(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  config: ReturnType<typeof defineConfig<any>>,
  remixHandler: (
    request: Request,
    loadContext: AppLoadContext
  ) => Promise<Response>
) {
  const loadContext = await getLoadContext(config, ctx, {
    request,
    context: {
      // This object matches the return value from Wrangler's
      // `getPlatformProxy` used during development via Remix's
      // `cloudflareDevProxyVitePlugin`:
      // https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy
      cloudflare: { caches, ctx, env, cf: request.cf },
    },
  });

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

export const superflareDevProxyVitePlugin = (
  config: ReturnType<typeof defineConfig<any>>,
  options: GetPlatformProxyOptions = {}
): Plugin =>
  cloudflareDevProxyVitePlugin({
    ...options,
    experimentalJsonConfig: true,
    // @cloudflare/workers-types’ Request type incompatible with global used here:
    // https://github.com/remix-run/remix/blob/main/packages/remix-dev/vite/cloudflare-proxy-plugin.ts
    getLoadContext: getLoadContext.bind(
      null,
      config,
      new ExecutionContext()
    ) as any,
  });
