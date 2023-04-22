---
title: "Scheduled Tasks"
description: "Learn how to use the Scheduled Tasks feature of Superflare powered by cron triggers"
---

Superflare allows you to integrate with [Cloudflare's cron triggers feature](https://developers.cloudflare.com/workers/platform/cron-triggers) to schedule your Workers to run at specific times.

## Enabling Cron Triggers

To enable Cron Triggers on your app, you need to add the `cron` key to your `wrangler.json` file:

Or `wrangler.json`:

```json
{
  "triggers": {
    "cron": ["* * * * *"]
  }
}
```

This will tell Cloudflare to run your Worker every minute. This is a "set it and forget it" approach which allows you to define flexible scheduled tasks using Superflare in your codebase. However, you can also specify a more specific schedule, for example `0 0 * * *` to run your Worker every day at midnight.

## Defining Schedules

To define scheduled tasks, add a `scheduled` export to your `worker.ts` file which calls Superflare's `handleScheduled`:

```ts
import { handleScheduled } from "superflare";

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    return await handleScheduled(event, env, ctx, config, (schedule) => {
      // Define your schedules here
    });
  },

  // fetch
  // queue
};
```

## Scheduling Tasks

To schedule a task, call the `schedule` method on the `schedule` object passed to your `scheduled` function:

```ts
import { handleScheduled } from "superflare";

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    return await handleScheduled(event, env, ctx, config, (schedule) => {
      schedule
        .run(async () => {
          // Some task that runs every day at midnight UTC
        })
        .daily();
    });
  },
};
```

In addition to arbitrary tasks, you can also schedule [Jobs](./queues):

```ts
schedule.job(new MyJob()).weeklyOn(1, "8:00");
```
