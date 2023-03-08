import {
  createCookieSessionStorage,
  createRequestHandler,
} from "@remix-run/cloudflare";
import getConfig from "./superflare.config";
import * as build from "./build";
import {
  getAssetFromKV,
  NotFoundError,
  MethodNotAllowedError,
} from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import { Auth, handleQueue } from "superflare";
import { handleFetch, SuperflareSession } from "superflare";

export { Channel } from "./app/objects/Channel";

let remixHandler: ReturnType<typeof createRequestHandler>;

const assetManifest = JSON.parse(manifestJSON);

declare const process: {
  env: {
    NODE_ENV: "development" | "production";
  };
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil(promise) {
            return ctx.waitUntil(promise);
          },
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );
    } catch (e) {
      if (e instanceof NotFoundError || e instanceof MethodNotAllowedError) {
        // fall through to the remix handler
      } else {
        return new Response("An unexpected error occurred", { status: 500 });
      }
    }

    if (!remixHandler) {
      remixHandler = createRequestHandler(build as any, process.env.NODE_ENV);
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

    const loadContext = { session, auth: new Auth(session), env };

    try {
      const config = getConfig({ request, env, ctx });

      return handleFetch(
        {
          config,
          session,
          getSessionCookie: () =>
            sessionStorage.commitSession(session.getSession()),
        },
        () => remixHandler(request, loadContext)
      );
    } catch (reason) {
      console.error(reason);
      return new Response("Internal Server Error", { status: 500 });
    }
  },

  async queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void[]> {
    const config = getConfig({ env, ctx });

    return handleQueue(config, batch);
  },
};
