import {
  AppLoadContext,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";
import {
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
  remixHandler: (
    request: Request,
    loadContext: SuperflareAppLoadContext<Env>
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

  return await superflareHandleFetch(
    {
      session,
      getSessionCookie: () =>
        sessionStorage.commitSession(session.getSession()),
    },
    async () => {
      /**
       * We inject env and session into the Remix load context.
       * Someday, we could replace this with AsyncLocalStorage.
       */
      const loadContext: SuperflareAppLoadContext<Env> = {
        session,
        auth: new SuperflareAuth(session),
        env,
        ctx,
      };
      return await remixHandler(request, loadContext);
    }
  );
}

export interface SuperflareAppLoadContext<Env> extends AppLoadContext {
  session: SuperflareSession;
  auth: SuperflareAuth;
  env: Env;
  ctx: ExecutionContext;
}
