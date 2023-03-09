---
title: Events
---

## Introduction

Events are a powerful way to tell other parts of your application that something changed. For example, you might want to alert a user when a long-running task has complete.

Superflare provides `Events` to emit changes to other parts of the application, and `Listeners` to subscribe to those events.

Imagine that you a file upload has finished processing. You might emit a `FileProcessed` event, and then a listener `SendFileProcessedNotification` could be used to alert the user via email or Slack that the file has been processed.

## Defining Events

To create an event, use the generate command:

```bash
npx superflare generate event FileProcessed
```

This will create a new file in `app/events/FileProcessed.ts`:

```ts
import { Event } from "superflare";

export class FileProcessed extends Event {
  //
}

Event.register(FileProcessed);
```

You can update this class's constructor to accept any data you want to pass to the event:

```ts
export class FileProcessed extends Event {
  constructor(public file: File) {
    super();
  }
}
```

Then, you can dispatch the event wherever it needs to be emitted in your application:

```ts
FileProcessed.dispatch(File);
```

## Defining Listeners

To create a listener, use the generate command:

```bash
npx superflare generate listener SendFileProcessedNotification
```

You can optionally pass the event class name with the `--event` flag:

```bash
npx superflare generate listener SendFileProcessedNotification --event FileProcessed
```

This will create a new file in `app/listeners/SendFileProcessedNotification.ts`:

```ts
import { Listener } from "superflare";
import { FileProcessed } from "~/events/FileProcessed";

export class SendFileProcessedNotification extends Listener {
  async handle(event: FileProcessed) {
    //
  }
}
```

You can update the `handle` method of your listener to do whatever you want to do when the event is dispatched.

### Registering Listeners

You must register every listener in your `superflare.config.ts` file under the `listeners` key. Listeners belong in an array whose key is the string value of the event name:

```ts
import { defineConfig } from "superflare";
import { SendFileProcessedNotification } from "~/listeners/SendFileProcessedNotification";

export default defineConfig((ctx) => {
  return {
    // ...
    listeners: {
      FileProcessed: [SendFileProcessedNotification],
    },
  };
});
```

## Dispatching Events

You can dispatch events from anywhere in your application. For example, you might dispatch an event when a user is created:

```ts
import { UserCreated } from "~/events/UserCreated";

UserCreated.dispatch(user);
```

### Queuing Events

By default, events are dispatched synchronously. This means that if an event is dispatched from a controller, the controller will wait for the event to be handled before returning a response.

If you want to dispatch an event asynchronously, you can set the static `shouldQueue = true` property on the Event class:

```ts
export class UserCreated extends Event {
  static shouldQueue = true;

  constructor(public user: User) {
    super();
  }
}
```

When an event is queued, it will be handled by a background job. This means that the controller will return a response immediately, and the event will be handled later.
