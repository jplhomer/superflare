import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import { createRequestHandler, type ServerBuild } from "@remix-run/cloudflare";
import { handleFetch } from "@superflare/remix";
import { handleQueue, handleScheduled } from "superflare";
import config from "./superflare.config";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore This file won’t exist if it hasn’t yet been built
import * as build from "./build/server"; // eslint-disable-line import/no-unresolved
// eslint-disable-next-line import/no-unresolved
import __STATIC_CONTENT_MANIFEST from "__STATIC_CONTENT_MANIFEST";

const MANIFEST = JSON.parse(__STATIC_CONTENT_MANIFEST);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleRemixRequest = createRequestHandler(build as any as ServerBuild);

export default {
  async fetch(request, env, ctx) {
    const waitUntil = ctx.waitUntil.bind(ctx);
    try {
      const url = new URL(request.url);
      const ttl = url.pathname.startsWith("/assets/")
        ? 60 * 60 * 24 * 365 // 1 year
        : 60 * 5; // 5 minutes
      return await getAssetFromKV(
        { request, waitUntil },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: MANIFEST,
          cacheControl: {
            browserTTL: ttl,
            edgeTTL: ttl,
          },
        }
      );
    } catch (error) {
      // No-op
    }

    try {
      return await handleFetch(request, env, ctx, config, handleRemixRequest);
    } catch (error) {
      console.log(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },

  async queue(batch, env, ctx) {
    return handleQueue(batch, env, ctx, config);
  },

  async scheduled(event, env, ctx) {
    return await handleScheduled(event, env, ctx, config, (schedule) => {
      // Define a schedule
    });
  },
} satisfies ExportedHandler<Env & { __STATIC_CONTENT: KVNamespace<string> }>;
