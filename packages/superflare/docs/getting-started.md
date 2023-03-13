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

Then, in your `worker.ts` file, import the `handleFetch` function from `@superflare/remix`, and import your local `superflare.config.ts` as `config`:

```ts
import { handleFetch } from "@superflare/remix";
import config from "./superflare.config";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // ...

    return handleFetch(request, env, ctx, config, remixHandler);
  },
};
```

If you plan to use [Queues](/queues), you'll also need to import the `handleQueue` function from `superflare` and handle that in your `worker.ts` file:

```ts
import { handleQueue } from 'superflare';
import config './superflare.config';

export default {
  // ...

  async queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void[]> {
    return handleQueue(batch, env, ctx, config);
  },
}
```

Behind the scenes, Superflare creates a [cookie-based session storage](https://remix.run/docs/en/1.14.1/utils/sessions#createcookiesessionstorage) for you and instantiates the Superflare request handler.

It also injects `auth`, `session`, `env`, and `ctx` to your `AppContext` which is available in your loaders and actions.

{% callout title="Cookie Monster" %}
Superflare automatically commits your session data to the outgoing response's `set-cookie` header, so you don't need to worry about that like you do in a standard Remix app.
{% /callout %}

## Workers vs Pages

I'd _love_ to use Cloudflare Pages for all the things. It's a nice abstraction on top of Workers and it already supports a ton of existing frameworks.

Unfortunately, support for the latest and greatest things, like Queues, is delayed on Pages. For the time being, Superflare is designed for Workers. But I've definitely built it with Pages in mind and hope to switch to it as soon as I can!

## `AsyncLocalStorage`

Gosh I would love to use [AsyncLocalStorage](https://nodejs.org/api/async_hooks.html#async_hooks_class_asynclocalstorage) in Workers. It _just_ landed, but I'm stuck behind a couple build issues in Remix, so I'm not leaning into it just yet.

However, when I can use it, we can reference per-request things like `auth()` and `session()` waaaay more easily. Just wait!
