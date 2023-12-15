import { createRequestHandler } from "@remix-run/cloudflare";
import config from "./superflare.config";
import * as build from "./build";
import {
  getAssetFromKV,
  NotFoundError,
  MethodNotAllowedError,
} from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import { handleQueue, handleScheduled } from "superflare";
import { handleFetch } from "@superflare/remix";

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

    try {
      return handleFetch(request, env, ctx, config, remixHandler);
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
    return handleQueue(batch, env, ctx, config);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    return await handleScheduled(event, env, ctx, config, (schedule) => {
      // Define a schedule
    });
  },
};
