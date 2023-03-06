import {
  AppLoadContext,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";
import {
  type DefineConfigResult,
  handleFetch as superflareHandleFetch,
  type Session,
  Auth,
  setConfig,
} from "superflare";

/**
 * `handleFetch` is a Remix-specific wrapper around Superflare's function of the same name.
 * It handles properly injecting things like `session` and `env` into the Remix load context.
 */
export async function handleFetch<Env>(
  request: Request,
  config: DefineConfigResult<Env>,
  remixHandler: (
    request: Request,
    loadContext: SuperflareAppLoadContext<Env>
  ) => Promise<Response>
) {
  const { ctx, userConfig } = config;
  const appKey = userConfig.appKey;

  if (!appKey) {
    throw new Error(
      "appKey is required. Please provide it in `superflare.config`"
    );
  }

  setConfig(userConfig);

  const sessionStorage = createCookieSessionStorage({
    cookie: {
      httpOnly: true,
      path: "/",
      secure: Boolean(request.url.match(/^(http|ws)s:\/\//)),
      secrets: [appKey],
    },
  });

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  return await superflareHandleFetch(
    {
      config,
      getSessionCookie: () => sessionStorage.commitSession(session),
    },
    async () => {
      /**
       * We inject env and session into the Remix load context.
       * Someday, we could replace this with AsyncLocalStorage.
       */
      const loadContext: SuperflareAppLoadContext<Env> = {
        session,
        auth: new Auth(session),
        env: ctx.env as Env,
      };
      return await remixHandler(request, loadContext);
    }
  );
}

export interface SuperflareAppLoadContext<Env> extends AppLoadContext {
  session: Session;
  auth: Auth;
  env: Env;
}
