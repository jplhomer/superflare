# Superflare

[Superflare](https://superflare.dev) is the missing full-stack toolkit for Cloudflare Workers. It features a relational ORM for [D1 databases](https://developers.cloudflare.com/d1/), utilities for [R2 storage](https://developers.cloudflare.com/workers/runtime-apis/r2), and more.

Superflare is _not_ a full-stack framework. In fact, Superflare works best when combined with [Remix](https://remix.run), [Next.js](https://nextjs.org) (soon!) or [Nuxt.js](https://nuxtjs.com) (soon!).

Check out various Superflare [example apps](https://github.com/jplhomer/superflare/tree/main/examples/) to get a feel for what you can build next, or get started with a new Superflare application below.

## Installation

(soon!) Spin up a brand-new Superflare project with the following command:

```bash
npx superflare init
```

Superflare will ask you which bindings you'd like to use for D1, R2 and KV. It will also offer to create the bindings if you haven't already!

Once you get your project created, you can start a local development server with:

```bash
npx superflare dev
```

## D1 Models

Superflare provides a simple ORM for D1 in the form of **Models**. It's a great way to get started with D1, and it's also a great way to get started with Superflare.

To get started with Superflare Models, you should create a new migration:

```bash
npx superflare generate migration create_users_table
```

This will create a new `.sql` file in your `migrations` directory. You can update this file with SQL to create your table:

```sql
create table users (
  id integer primary key,
  name text not null,
  email text not null,
  createdAt timestamp not null default current_timestamp
  updatedAt timestamp not null default current_timestamp
);
```

After creating your migration, you should migrate your database. Superflare can automatically create Models for you if you pass the `--create` flag:

```bash
npx superflare migrate --create
```

Behind the scenes, Superflare is using Wrangler to run your migrations against a local SQLite file. Then, it evaluates the schema of your database to infer the types of your columns. Finally, it generates a TypeScript Model for you in your projects `app/models` directory:

```typescript
import { Model } from "superflare";

export class User extends Model {
  toJSON(): UserRow {
    return super.toJSON();
  }
}

/* superflare-types-start */
interface UserRow {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends UserRow {}
/* superflare-types-end */
```

You can run `npx superflare migrate` any time you'd like to update your local database schema and Model type definitions.

Once you have [configured your Superflare app](#), you can start to query data using your models in your application:

```ts
import { User } from "~/models/User";

export async function loader() {
  const user = await User.find(1);
  return user;
}
```

[Learn more about D1 Models](./docs/d1-models.md)

### Seeding local data

Superflare provides a simple way to seed your local database with data.

To get started, update your `db/seed.ts` file with any seed data you'd like to use for local development:

```ts
import { seed } from "superflare";
import { UserFactory } from "./factories/UserFactory";

export default seed(async () => {
  await UserFactory.create();
});
```

Then, you can run the following command to seed your local database:

```bash
npx superflare db seed
```

You can also seed your database automatically when running migrations:

```bash
npx superflare migrate --seed
```

This can be very helpful for rapid prototyping when you want to quickly drop the local database and start from scratch. You can pass the `--fresh` command to drop the local database before running migrations:

```bash
npx superflare migrate --fresh --seed

# or:

npx superflare migrate -f -s
```

### Model Factories

(This is probably going to change)

Superflare offers a convenient way to generate fake data for your models. You can use this to seed your local database, or to generate test data.

(soon!) To get started, create a new factory:

```bash
npx superflare generate factory User
```

This will create a new file in your `db/factories` directory:

```ts
import { Factory } from "superflare";
import { User } from "~/models/User";
import { faker } from "@faker-js/faker";

export const UserFactory = Factory.for(User).definition(() => ({
  name: faker.name.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
}));
```

You can then use this factory to generate fake data for your models:

```ts
await UserFactory.create();
```

## R2 Storage

Superflare provides a simple interface for working with R2 storage. You can use this to store and retrieve files from Cloudflare Workers.

To interact with R2 storage, import the `storage` utility from Superflare:

```ts
import { storage } from "superflare";

export async function action() {
  const file = "...";
  const key = "my-file.txt";

  await storage().put(key, file);

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

### Serving public files

By default, Superflare does not serve your bucket contents to the pbulic. However, you can mark a disk as public by setting the `publicPath` property to a public route in your `superflare.config.ts` file:

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

### Serving public files from a public R2 bucket

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

# Future things that don't work yet

## Queues

Sometimes you want to handle a task asynchronously. For example, you might want to send an email after a user signs up for your application. Or, you might want to process a large file in the background.

The traditional way to handle this is by processing **Jobs** on a **Queue**.

Superflare provides a simple interface for working with [Cloudflare Queues](https://developers.cloudflare.com/queues/). You can use this to create and process jobs in your application.

### Creating Jobs

You can create a Superflare Job with the CLI:

```bash
npx superflare generate job ProcessPodcast
```

A new file will be created in your `app/jobs` directory:

```ts
// app/jobs/ProcessPodcast.ts

import { Job } from "superflare";

export class ProcessPodcast extends Job {
  async handle() {
    // ...
  }
}
```

You can define any data you'd like to pass to the job in the `constructor` property:

```ts
import { Job } from "superflare";
import type { Podcast } from "~/models/Podcast";

export class ProcessPodcast extends Job {
  constructor(public podcast: Podcast) {
    super();
  }

  async handle() {
    doSomethingWith(this.podcast);
  }
}
```

Notice that you can pass your Models directly to the job class. Superflare will automatically serialize and deserialize your data for you.

### Dispatching Jobs

You can dispatch a job to the queue with the `dispatch` method:

```ts
import { ProcessPodcast } from "~/jobs/ProcessPodcast";

export async function action() {
  const podcast = await Podcast.find(1);

  ProcessPodcast.dispatch(podcast);
}
```

By default, will enqueue the job asynchronously. If you want to run the job synchronously, you can call `dispatchSync`:

```ts
await ProcessPodcast.dispatchSync(podcast);
```

### Queue Workers

Superflare will automatically configure Cloudflare to use your production worker as both a **queue consumer** and a **queue producer**.

This means that your production worker will automatically process jobs as they are enqueued out of band.

To ensure that your worker is ready to process jobs, you should add a `queue` handler to your Cloudflare Pages function entrypoint.

For Remix apps, this file is `functions/[[remix]].ts`:

```ts
// functions/[[remix]].ts

import { handleQueue } from "superflare";
import config from "../superflare.config";

/**
 * For HTTP requests:
 */
export const onRequest: PagesFunction<Env> = async (ctx) => {
  config(ctx);
  // ...
};

/**
 * For Queue requests:
 */
export const onQueueRequest: QueueFunction<Env> = async (ctx) => {
  config(ctx);
  return handleQueue(request, config);
};
```

### Local Queue Workers

When developing locally, you will want to start a queue worker to process jobs manually.

In a separate tab from your local development server, you can start a queue worker with the `superflare` CLI:

```bash
npx superflare queue work
```

This will start a queue worker that will process jobs as they are enqueued. You will be able to view logs for your queue worker in the terminal.
