---
title: Getting Started
---

## Installation

The easiest way to start with Superflare is to spin up a brand-new project with the following command:

```bash
npx superflare new
```

Superflare will ask you which bindings you'd like to use for D1, R2 and KV. It will also offer to create the bindings if you haven't already!

Once you get your project created, you can start a local development server with:

```bash
npx superflare dev
```

## Startin' from Scratch

Oh, so you're one of _those_ people, eh?

That's fine. Here's some chicken scratches on how to get started with Superflare. They will probably be outdated by the time I commit this and push it to GitHub.

### Remix + Superflare

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

Behind the scenes, Superflare creates a [cookie-based session storage](https://remix.run/docs/en/1.14.1/utils/sessions#createcookiesessionstorage) for you and instantiates the Superflare request handler.

It also injects `auth`, `session`, `env`, and `ctx` to your `AppContext` which is available in your loaders and actions.

{% callout title="Cookie Monster" %}
Superflare automatically commits your session data to the outgoing response's `set-cookie` header, so you don't need to worry about that like you do in a standard Remix app.
{% /callout %}
