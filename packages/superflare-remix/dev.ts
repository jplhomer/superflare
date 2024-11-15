import {
  type IncomingRequestCfProperties,
  type Request,
} from "@cloudflare/workers-types";
import { cloudflareDevProxyVitePlugin } from "@remix-run/dev";
import {
  fromNodeRequest,
  toNodeRequest,
} from "@remix-run/dev/dist/vite/node-adapter.js";
import {
  createRequestHandler,
  type ServerBuild,
} from "@remix-run/server-runtime";
import { type Plugin, type ViteDevServer } from "vite";
import { type GetPlatformProxyOptions } from "wrangler";
import { type Cloudflare, getLoadContext } from "./load-context";

type WorkersRequest = Request<unknown, IncomingRequestCfProperties<unknown>>;

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

function importWrangler() {
  try {
    return import("wrangler");
  } catch (_) {
    throw Error("Could not import `wrangler`. Do you have it installed?");
  }
}

export function superflareDevProxyVitePlugin<Env extends { APP_KEY: string }>(
  options: GetPlatformProxyOptions = {}
): Plugin {
  const ctx = new ExecutionContext();
  options = { experimentalJsonConfig: true, ...options };

  const remixVitePlugin = cloudflareDevProxyVitePlugin(options);

  return {
    ...remixVitePlugin,
    configureServer: async (server: ViteDevServer) => {
      // Adapted from:
      // https://github.com/remix-run/remix/blob/main/packages/remix-dev/vite/cloudflare-proxy-plugin.ts
      const { getPlatformProxy } = await importWrangler();
      // Do not include `dispose` in Cloudflare context
      const { dispose, ...cloudflare } = await getPlatformProxy<Env>(options);
      const context: { cloudflare: Cloudflare<Env> } = { cloudflare } as any;

      return () => {
        if (!server.config.server.middlewareMode) {
          server.middlewares.use(async (nodeReq, nodeRes, next) => {
            try {
              // Import singleton-dependent modules via viteDevServer to get
              // the same instance of the Config singleton class as in app code.
              const superflare = await server.ssrLoadModule("superflare");
              const build = (await server.ssrLoadModule(
                "virtual:remix/server-build"
              )) as ServerBuild;

              const handler = createRequestHandler(build, "development");
              const request = fromNodeRequest(nodeReq, nodeRes);
              const loadContext = await getLoadContext<Env>({
                context,
                request: request as unknown as WorkersRequest,
                SuperflareAuth: superflare.SuperflareAuth,
                SuperflareSession: superflare.SuperflareSession,
              });

              // Initialize config here (instead of in superflare#handleFetch).
              const config = await server.ssrLoadModule("./superflare.config");
              config.default({ request, ctx, env: loadContext.cloudflare.env });

              const response = await handler(request, loadContext);

              // If changed, commit session as cookie on outgoing response’s headers.
              if (loadContext.session.isDirty()) {
                response.headers.set(
                  "Set-Cookie",
                  await loadContext.getSessionCookie()
                );
              }
              await toNodeRequest(response, nodeRes);
            } catch (error) {
              next(error);
            }
          });
        }
      };
    },
  };
}
