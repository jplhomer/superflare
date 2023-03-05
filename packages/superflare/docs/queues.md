---
title: Queues
---

Sometimes you want to handle a task asynchronously. For example, you might want to send an email after a user signs up for your application. Or, you might want to process a large file in the background.

The traditional way to handle this is by processing **Jobs** on a **Queue**.

Superflare provides a simple interface for working with [Cloudflare Queues](https://developers.cloudflare.com/queues/). You can use this to create and process jobs in your application.

## Creating Jobs

You can create a Superflare Job with the CLI:

```bash
npx superflare generate job ProcessPodcast
```

A new file will be created in your `app/jobs` directory:

```ts
// app/jobs/ProcessPodcast.ts

import { Job } from "superflare";

export class ProcessPodcast extends Job {
  async handle(): Promise<void> {
    // ...
  }
}

Job.register(ProcessPodcast);
```

You can define any data you'd like to pass to the job in the `constructor` property:

```ts
import { Job } from "superflare";
import type { Podcast } from "~/models/Podcast";

export class ProcessPodcast extends Job {
  constructor(public podcast: Podcast) {
    super();
  }

  async handle(): Promise<void> {
    doSomethingWith(this.podcast);
  }
}
```

Notice that you can pass your Models directly to the job class. Superflare will automatically serialize and deserialize your data for you.

## Dispatching Jobs

You can dispatch a job to the queue with the `dispatch` method:

```ts
import { ProcessPodcast } from "~/jobs/ProcessPodcast";

export async function action() {
  const podcast = await Podcast.find(1);

  await ProcessPodcast.dispatch(podcast);
}
```

By default, will enqueue the job asynchronously. If you want to run the job synchronously, you can call `dispatchSync`:

```ts
await ProcessPodcast.dispatchSync(podcast);
```

## Queue Workers

Superflare will automatically configure Cloudflare to use your production worker as both a **queue consumer** and a **queue producer**.

This means that your production worker will automatically process jobs as they are enqueued out of band.

To ensure that your worker is ready to process jobs, you should add a `queue` handler to your Cloudflare Pages function entrypoint.

For Remix apps using Workers mode, this file is `worker.ts`:

```ts
// worker.ts

import { handleQueue } from "superflare";
import config from "../superflare.config";

export default {
  /**
   * For HTTP requests:
   */
  async fetch() {
    // ...
  },

  /**
   * For Queues:
   */
   async queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void[]> {
    return handleQueue(
      config({
        env,
        ctx,
      }),
      batch,
      ctx
    );
  },
```

### Local Queue Workers

When developing locally, jobs added to you local queue will be routed automatically to the consumer in your local worker.

You can check your terminal logs to see when jobs are processed as well as any `console` output you provide in your job handler.
