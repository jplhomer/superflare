---
title: superflare.config
description: Configuration options for Superflare apps
---

## Defining Superflare configuration

Superflare apps are configured using a `superflare.config.ts` file in the root of your project. This file should export a function wrapped with `defineConfig` that returns an object.

```ts
import { defineConfig } from "superflare";

export default defineConfig((ctx) => {
  return {
    // ...
  };
});
```

It receives a single `ctx` argument that contains the following properties:

- `env`: The current `Env` values passed from Cloudflare. These contain your resource bindings and secrets.
- `ctx`: This is `waitUntil` and various other runtime things. You probably won't use this.
- `request`: The current request. **You should not assume this is available.** Superflare parses this config file for other non-request related things, like handling incoming queue messages.

## Available configuration options

### `appKey`

**Required**. The `APP_KEY` secret that you set in Cloudflare. This is used to sign session cookies and more.

### `database`

This is an object which contains strings for [database connections](/database/getting-started) which refer to bindings. At a minimum, you should provide a `default` connection:

```ts
database: {
  default: env.DB,
  otherConnection: env.OTHER_DB,
},
```

### `storage`

This is an object which contains strings for [storage disks](/storage) which refer to bindings. At a minimum, you should provide a `default` disk:

```ts
storage: {
  default: env.STORAGE,
  otherDisk: env.OTHER_STORAGE,
},
```

### `queues`

This is an object which contains strings for [queue connections](/queues) which refer to bindings. At a minimum, you should provide a `default` connection:

```ts
queues: {
  default: env.QUEUE,
  otherConnection: env.OTHER_QUEUE,
},
```

### `listeners`

This is an object which contains a mapping between [`Events`](/events) and `Listener`s. The keys of the object are the Event class names, and the values are an array of`Listener` classes.

```ts
listeners: {
  'UserCreated': [UserCreatedListener],
},
```

### `channels`

This is an object which contains configuration for [`Broadcasting`](/broadcasting) Channels. If you plan to broadcast real-time events to your users, you'll need to configure at minimum a default binding.

You may also configure private channels using `authorize` functions which correspond to the channel names you use when calling `broadcastTo()` on [`Event`](/events) classes.

```ts
channels: {
  default: {
    binding: env.CHANNEL,
  },
  "posts.*": {
    async authorize(user, channelId) => {
      // ...
    },
  },
}
```
