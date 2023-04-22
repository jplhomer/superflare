---
title: "Scheduled Tasks"
description: "Learn how to use the Scheduled Tasks feature of Superflare powered by cron triggers"
---

Superflare allows you to integrate with [Cloudflare's cron triggers feature](https://developers.cloudflare.com/workers/platform/cron-triggers) to schedule your Workers to run at specific times.

## Enabling Cron Triggers

To enable Cron Triggers on your app, you need to add the `triggers#crons` key to your `wrangler.json` file:

Or `wrangler.json`:

```json
{
  "triggers": {
    "crons": ["* * * * *"]
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

To schedule a task, call the `run` method on the `schedule` object passed to the callback function from `handleScheduled` function:

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

### Schedule Frequency Options

You can use the following methods to define the frequency of your scheduled tasks:

| Method                  | Description                                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| `everyMinute()`         | Runs the task every minute                                              |
| `hourly()`              | Runs the task every hour                                                |
| `daily()`               | Runs the task every day at midnight UTC                                 |
| `dailyAt('13:00')`      | Runs the task every day at the at 13:00 UTC                             |
| `weekly()`              | Runs the task every week at midnight UTC on Sunday                      |
| `weeklyOn(1, '13:00')`  | Runs the task every Monday at 13:00 UTC                                 |
| `monthly()`             | Runs the task every month at midnight UTC on the first day of the month |
| `monthlyOn(1, '13:00')` | Runs the task on the first day of the month at 13:00 UTC                |
| `yearly()`              | Runs the task every year at midnight UTC on January 1st                 |

### More Advanced Scheduling Options

If you need a more specific scheduling interval, you can manually validate the current time in your codebase or define a custom cron trigger schedule in your Wrangler config file:

```ts
schedule.run(async () => {
  if (isTheSecondTuesdayDuringAFullMoon(new Date(event.scheduledTime))) {
    // Run your quirky task here
  }
});
```

You can also choose to import a Date library like [Luxon](https://moment.github.io/luxon/) to make it easier to work with dates and timezones. This isn't included by default in Superflare because this is a heavy dependency, and it would slow down the invocation of every worker request.

## Testing Scheduled Tasks

To test your scheduled tasks, can open a browser visit `/__scheduled`. This will fire the `scheduled` function of your worker entrypoint.
