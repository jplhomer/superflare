import {
  createRequestHandler,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";
import getConfig from "../superflare.config";

import * as build from "../build";
import { Auth, handleFetch } from "superflare";

let remixHandler: ReturnType<typeof createRequestHandler>;

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (!remixHandler) {
    remixHandler = createRequestHandler(
      build as any,
      ctx.env.CF_PAGES ? "production" : "development"
    );
  }

  const sessionStorage = createCookieSessionStorage({
    cookie: {
      httpOnly: true,
      path: "/",
      secure: /^(http|ws)s:\/\//.test(ctx.request.url),
      secrets: [ctx.env.APP_KEY],
    },
  });

  const session = await sessionStorage.getSession(
    ctx.request.headers.get("Cookie")
  );

  return handleFetch(
    {
      config: getConfig({
        request: ctx.request,
        env: ctx.env,
        ctx,
      }),
      getSessionCookie: () => sessionStorage.commitSession(session),
    },
    () =>
      remixHandler(ctx.request, {
        auth: new Auth(session),
        session,
        env: ctx.env,
      })
  );
};
