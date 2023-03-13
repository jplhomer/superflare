---
title: File Storage
description: Storing and retrieving files from Cloudflare's R2 storage
---

Superflare provides a simple interface for working with [R2 storage](https://www.cloudflare.com/products/r2/). You can use this to store and retrieve files from Cloudflare Workers.

## Getting Started

To interact with R2 storage, import the `storage` utility from Superflare:

```ts
import { storage } from "superflare";

export async function action() {
  const file = "...";
  const key = "my-file.txt";

  const r2Object = await storage().put(key, file);

  // Later:

  const file = await storage().get(key);
}
```

By default, Superflare will use the `default` storage disk and underlying R2 storage bucket defined in the `storage#default` property of your `superflare.config.ts` file.

You can override this by passing a different disk name to the `storage` function:

```ts
import { storage } from "superflare";

export async function action() {
  await storage("my-disk").put(key, file);
}
```

## Serving public files

By default, Superflare does not serve your bucket contents to the public. However, you can mark a disk as public by setting the `publicPath` property to a public route in your `superflare.config.ts` file:

```ts
// superflare.config.ts

import { defineConfig } from "superflare";

export default defineConfig((ctx) => {
  return {
    // ...
    storage: {
      default: {
        binding: ctx.env.MY_BUCKET,
        publicPath: "/storage/files",
      },
    },
  };
});
```

### File URLs

You can use the `storage().url()` method to get a URL to a file in your bucket if you have defined a public path:

```ts
const url = storage().url("my-file.txt");
```

If your bucket does not have a public path, the `storage().url()` will return `null`.

### `servePublicPathFromStorage`

Superflare provides a helpful utility `servePublicPathFromStorage` to serve public files from your app by proxying requests to an R2 bucket.

You can import this utility in a route handler and pass it the current pathname to serve:

```ts
// app/routes/storage.$.ts

import { type LoaderArgs } from "@remix-run/cloudflare";
import { servePublicPathFromStorage } from "superflare";

export async function loader({ request }: LoaderArgs) {
  const { pathname } = new URL(request.url);
  return servePublicPathFromStorage(pathname);
}
```

Superflare will determine the correct disk to use based on the `publicPath` property of your `storage` config. In this example, Superflare will use the `default` disk to serve files from the `MY_BUCKET` R2 bucket.

You can add any authentication or authorization mechanisms to this route to restrict access to your files.

### Using a public R2 bucket

You can also serve public files from a R2 bucket's public domain. To do this, you can make the R2 bucket public by [following Cloudflare's instructions](https://developers.cloudflare.com/r2/data-access/public-buckets/).

Then, you can configure your `storage` config to use the public domain:

```ts
// superflare.config.ts

import { defineConfig } from "superflare";

export default defineConfig((ctx) => {
  return {
    // ...
    storage: {
      default: {
        binding: ctx.env.MY_BUCKET,
        publicPath: "https://my-bucket.storage.example.com",
      },
    },
  };
});
```
