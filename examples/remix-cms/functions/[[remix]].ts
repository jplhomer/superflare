import {
  createRequestHandler,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";
import { type AppLoadContext } from "@remix-run/server-runtime";
import { config } from "superflare";

import * as build from "../build";

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
      secure: Boolean(ctx.request.url.match(/^(http|ws)s:\/\//)),
      secrets: [ctx.env.SESSION_SECRET],
    },
  });

  const session = await sessionStorage.getSession(
    ctx.request.headers.get("Cookie")
  );

  config({
    database: {
      default: ctx.env.DB,
    },
    storage: {
      default: {
        binding: ctx.env.REMIX_CMS_MEDIA,
        publicPath: "/storage/media",
      },
    },
  });

  const loadContext: AppLoadContext = {
    cf: ctx.request.cf,
    env: ctx.env,
    DB: ctx.env.DB,
    session,
  };

  const response = await remixHandler(ctx.request, loadContext);
  response.headers.set(
    "Set-Cookie",
    await sessionStorage.commitSession(session)
  );

  return response;
};
