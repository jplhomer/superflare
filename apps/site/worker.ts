import {
  createCookieSessionStorage,
  createRequestHandler,
} from "@remix-run/cloudflare";
import * as build from "./build";
import {
  getAssetFromKV,
  NotFoundError,
  MethodNotAllowedError,
} from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";

let remixHandler: ReturnType<typeof createRequestHandler>;

const assetManifest = JSON.parse(manifestJSON);

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
        secrets: [env.SESSION_SECRET],
      },
    });

    const session = await sessionStorage.getSession(
      request.headers.get("Cookie")
    );

    try {
      return await remixHandler(request, {
        env,
      });
    } catch (reason) {
      console.error(reason);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
