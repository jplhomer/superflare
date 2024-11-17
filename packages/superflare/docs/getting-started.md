---
title: Getting Started
description: Getting started with Superflare
---

## Installation

The easiest way to start with Superflare is to spin up a brand-new project with the following command:

```bash
npx superflare@latest new
```

Superflare will ask you which bindings you'd like to use for D1, R2 and KV. It will also offer to create the bindings if you haven't already!

Once you get your project created, you can start a local development server with:

```bash
npx superflare dev
```

## Remix + Superflare

You're in luck! I built a package to make it super-duper easy to get started with Superflare and Remix.

In an existing Remix app on the Cloudflare Workers adapter, run:

```bash
npm install @superflare/remix
```

Then, in your `worker.ts` file, import the `handleFetch` function from `@superflare/remix`, and import your local `superflare.config.ts` as `config`. Superflare handles building and providing the load context, so you’ll be able to delete a lot of the code required with the [default Remix adapter](https://github.com/remix-run/remix/blob/main/templates/cloudflare-workers/server.ts):

```ts
import { createRequestHandler, type ServerBuild } from "@remix-run/cloudflare";
import { handleFetch } from "@superflare/remix";
import config from "./superflare.config";
import * as build from "./build/server";

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
} satisfies ExportedHandler<Env>;
```

If you plan to use [Queues](/queues), you’ll also need to import the `handleQueue` function from `superflare` and add that to your `worker.ts` file:

```ts
import { handleQueue } from 'superflare';
import config './superflare.config';

export default {
  // ...

  async queue(batch, env, ctx) {
    return handleQueue(batch, env, ctx, config);
  },
} satisfies ExportedHandler<Env>;
```

Likewise for using [Cron Triggers](/scheduled-tasks):

```ts
import { handleScheduled } from 'superflare';
import config './superflare.config';

export default {
  // ...

  async scheduled(event, env, ctx) {
    return await handleScheduled(event, env, ctx, config, (schedule) => {
      // Define a schedule
    });
  },
} satisfies ExportedHandler<Env>;
```

For local development, Remix uses Vite’s dev server with a [Cloudflare Proxy Vite plugin](https://remix.run/docs/en/main/guides/vite#cloudflare-proxy) that invokes [`getPlatformProxy`](https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy) to provide [bindings](https://developers.cloudflare.com/workers/wrangler/api/#supported-bindings) to your application from outside of the deployed `workersd` environment. Superflare has an additional entry point, `@superflare/remix/dev`, that exports `superflareDevProxyVitePlugin`, which adds Superflare support and can be used in place of Remix’s proxy plugin in your Vite config:

```ts
// vite.config.ts

import { vitePlugin as remix } from "@remix-run/dev";
import { superflareDevProxyVitePlugin } from "@superflare/remix/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    superflareDevProxyVitePlugin<Env>(),
    remix(),
    tsconfigPaths(),
  ],
  ssr: {
    resolve: {
      conditions: ["workerd", "worker", "browser"],
    },
  },
  resolve: {
    mainFields: ["browser", "module", "main"],
  },
});
```

{% callout title="Vite config" %}
**Do not** use `build: { minify: true }` in your Vite config. This will mangle the variable names of the `workerd` (SSR) build and change the names of your [models](/models), which will in turn break the mapping between those models and their corresponding DB tables. Vite’s [default minify behavior](https://vite.dev/config/build-options.html#build-minify) is to minify the client build and leave the SSR build untouched, which is what we want.
{% /callout %}

The Superflare Remix integration creates a [cookie-based session storage](https://remix.run/docs/en/main/utils/sessions#createcookiesessionstorage) and injects `auth`, `session`, and `cloudflare` objects into your load context (the `AppContext` type), which is provided to your loaders and actions. The `cloudflare` object matches the return value of [Wrangler’s `getPlatformProxy`](https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy).

{% callout title="Cookie Monster" %}
Superflare automatically commits your session data to the outgoing response's `set-cookie` header, so you don't need to worry about that like you do in a standard Remix app.
{% /callout %}

## Workers vs Pages

I’d _love_ to use Cloudflare Pages for all the things. It’s a nice abstraction on top of Workers and it already supports a ton of existing frameworks.

Unfortunately, support for the latest and greatest things, like Queues and Cron Triggers (i.e. scheduled tasks), is delayed on Pages. Cloudflare maintains a [support table](https://developers.cloudflare.com/workers/static-assets/compatibility-matrix/) comparing the two platforms’ support for Cloudflare features.

For the time being, Superflare is designed for Workers. But I’ve definitely built it with Pages in mind and hope to support it as soon as possible.

## `AsyncLocalStorage`

Gosh I would love to use [AsyncLocalStorage](https://nodejs.org/api/async_hooks.html#async_hooks_class_asynclocalstorage) in Workers. It _just_ landed, but I'm stuck behind a couple build issues in Remix, so I'm not leaning into it just yet.

However, when I can use it, we can reference per-request things like `auth()` and `session()` waaaay more easily. Just wait!
