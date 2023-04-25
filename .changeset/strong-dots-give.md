---
"superflare": minor
---

Adds support for scheduled tasks using Cron Triggers.

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

Learn more about [Scheduled Tasks](https://superflare.dev/scheduled-tasks).
