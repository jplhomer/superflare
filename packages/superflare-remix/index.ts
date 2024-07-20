import { type Request } from "@cloudflare/workers-types";
import {
  createCookieSessionStorage,
  type AppLoadContext,
} from "@remix-run/cloudflare";
import {
  defineConfig,
  handleFetch as superflareHandleFetch,
  SuperflareAuth,
  SuperflareSession,
} from "superflare";

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
    loadContext: SuperflareAppLoadContext
  ) => Promise<Response>
) {
  if (!env.APP_KEY) {
    throw new Error(
      "APP_KEY is required. Please ensure you have defined it as an environment variable."
    );
  }

  const sessionStorage = createCookieSessionStorage({
    cookie: {
      httpOnly: true,
      path: "/",
      secure: Boolean(request.url.match(/^(http|ws)s:\/\//)),
      secrets: [env.APP_KEY],
    },
  });

  const session = new SuperflareSession(
    await sessionStorage.getSession(request.headers.get("Cookie"))
  );

  return await superflareHandleFetch<Env>(
    {
      request,
      env,
      ctx,
      config,
      session,
      getSessionCookie: () =>
        sessionStorage.commitSession(session.getSession()),
    },
    async () => {
      /**
       * We inject env and session into the Remix load context.
       * Someday, we could replace this with AsyncLocalStorage.
       */
      const loadContext: SuperflareAppLoadContext = {
        cloudflare: {
          // This object matches the return value from Wrangler's
          // `getPlatformProxy` used during development via Remix's
          // `cloudflareDevProxyVitePlugin`:
          // https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy
          cf: request.cf,
          ctx: {
            passThroughOnException: ctx.passThroughOnException.bind(ctx),
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          caches,
          env,
        },
        session,
        auth: new SuperflareAuth(session),
      };
      return await remixHandler(request, loadContext);
    }
  );
}

export interface SuperflareAppLoadContext extends AppLoadContext {
  session: SuperflareSession;
  auth: SuperflareAuth;
}
