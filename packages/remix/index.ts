import {
  AppLoadContext,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";
import {
  type DefineConfigResult,
  handleFetch as superflareHandleFetch,
  type Session,
} from "superflare";

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

  const loadContext: SuperflareAppLoadContext<Env> = {
    session,
    env: ctx.env as Env,
  };

  return await superflareHandleFetch(
    {
      config: userConfig,
      session,
      getSessionCookie: () => sessionStorage.commitSession(session),
    },
    async () => remixHandler(request, loadContext)
  );
}

export interface SuperflareAppLoadContext<Env> extends AppLoadContext {
  session: Session;
  env: Env;
}
