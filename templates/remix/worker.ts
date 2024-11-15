import { createRequestHandler, type ServerBuild } from "@remix-run/cloudflare";
import { handleFetch } from "@superflare/remix";
import { handleQueue, handleScheduled } from "superflare";
import config from "./superflare.config";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore This file won’t exist if it hasn’t yet been built
import * as build from "./build/server"; // eslint-disable-line import/no-unresolved

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleRequest = createRequestHandler(build as any as ServerBuild);

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleFetch<Env>(request, env, ctx, config, handleRequest);
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
} satisfies ExportedHandler<Env>;
