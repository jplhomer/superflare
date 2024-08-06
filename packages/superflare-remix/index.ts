import { type Request } from "@cloudflare/workers-types";
import { type AppLoadContext } from "@remix-run/cloudflare";
import {
  defineConfig,
  handleFetch as superflareHandleFetch,
  SuperflareAuth,
  SuperflareSession,
} from "superflare";

import { getLoadContext } from "./load-context";

/**
 * `handleFetch` is a Remix-specific wrapper around Superflare's function of the same name.
 * It handles properly injecting things like `session` and `env` into the Remix load context.
 */
export async function handleFetch<Env extends { APP_KEY: string }>(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  config: ReturnType<typeof defineConfig<Env>>,
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
    async () => {
      return await remixHandler(request, loadContext);
    }
  );
}
