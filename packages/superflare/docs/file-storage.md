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

### Handling file uploads

If your application accepts file uploads, you will likely have an endpoint, like a Remix action, which handles an incoming request.

The simplest approach to handling file uploads is to use the [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData) to parse the request body with `await request.formData()` and use the `storage().put(name, formData.get('file'))` method to store the file in your R2 bucket.

However, this approach requires you to read the entire file into memory before storing it. This can be problematic if you are uploading large files:

```ts
import { storage } from "superflare";

export async function action({ request }) {
  // ⚠️ Entire file is loaded into memory!
  const formData = await request.formData();
  const file = formData.get("file");
  const key = "my-file.txt";

  const r2Object = await storage().put(key, file);
}
```

Instead, a better option is to stream file uploads directly to R2. Superflare provides a `parseMultipartFormData` utility, [inspired by Remix](https://remix.run/docs/en/1.14.3/utils/parse-multipart-form-data#uploadhandler), to make parsing multipart form data requests easier:

```ts
import { storage, parseMultipartFormData } from "superflare";

export async function action({ request }) {
  const formData = await parseMultipartFormData(
    request,
    async ({ name, filename, stream, data }) => {
      // This is the name of your HTML file input
      if (name === "file") {
        const r2Object = await storage().put(filename, stream);
        return r2Object.key;
      }

      // Support other non-file fields
      return data;
    }
  );

  const url = storage.url(formData.get("file"));

  // ...
}
```

### Uploading files with random names

Sometimes you may want to upload a file with a random name to prevent conflicts between other uploads. You can use the `storage().putRandom(input)` method to do this:

```ts
const r2Object = await storage().putRandom(file, {
  // Optional extension
  extension: filename?.split(".").pop(),

  // Optional prefix
  prefix: "avatars",
});
```

By default, no extension or prefix will be added to the file name. You can override this by passing an `extension` or `prefix` option to the `putRandom` method. Prefixes and filenames are separated by a forward slash (`/`) similar to a folder structure.

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

## `storage()` API

### `R2Input`

The `R2Input` type is a union of the following types:

```ts
type R2Input = string | ReadableStream | ArrayBuffer | ArrayBufferView | Blob;
```

### `storage().put(key: string, input: R2Input, options?: R2PutOptions)`

Put a file in your R2 bucket.

### `storage().putRandom(input: R2Input, options?: R2PutOptions & { prefix?: string, extension?: string })`

Put a file in your R2 bucket with a random name.

### `storage().get(key: string)`

Get a file from your R2 bucket.

### `storage().delete(key: string)`

Delete a file from your R2 bucket.

### `storage().url(key: string)`

Get a URL to a file in your R2 bucket. Requires that the disk has a `publicPath` property defined.
