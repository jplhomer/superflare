# Supercloud

## Installation (new project)

```bash
npx create-supercloud@latest my-app
```

## Installation (existing project)

Install Supercloud into an existing app:

```bash
npm i supercloud
```

## Features

### Models

Supercloud comes with a fully-featured ORM powered by [Cloudflare D1](https://developers.cloudflare.com/d1/). It allows you to define models and their relationships, and provides a simple API for querying and mutating data.

```ts
// models/User.ts

import { Model } from "supercloud";

export class User extends Model {
  static table = "users";
}
```

```ts
// models/Post.ts

import { Model, belongsTo } from "supercloud";
import { User } from "./User";

export class Post extends Model {
  static table = "posts";

  user() {
    return belongsTo(this, User);
  }
}
```

Create, mutate and query models using a familiar API:

```ts
const user = await User.create({ name: "John Doe" });
user.name = "Jane Doe";
await user.save();

const post = await Post.create({ title: "Hello World", user });

const posts = await user.posts;
```

### Authentication

```ts
// models/User.ts

// TODO: Add example
```

### Events

```ts
class UserCreated extends Event {
  static type = "user.created";
}

event(new UserCreated(user));
```

### Listeners

```ts
class UserCreatedListener extends Listener {
  static type = "user.created";

  async handle(event: UserCreated) {
    event.user.notify(new WelcomeNotification(event.user));
  }
}
```

### Queues

```ts
import { Job } from "supercloud";

class AnalyzePost extends Job {
  async handle(post: Post) {
    await Post.analyze();
  }
}

AnalyzePost.dispatch(post);
```

### Mail

```ts
import { Mail } from "supercloud";

class WelcomeMail extends Mail {
  envelope() {
    return {
      subject: "Welcome to Supercloud",
    }
  },

  content() {
    return "Welcome to Supercloud!";
  }
}

Mail.to(user).send(new WelcomeMail());
```

### Notifications

```ts
// notifications/WelcomeNotification.ts

import { Notification } from "supercloud";

export class WelcomeNotification extends Notification {
  via = ["mail"];

  toMail() {
    return {
      subject: "Welcome to Supercloud!",
      text: "Welcome to Supercloud!",
    };
  }
}

const user = await User.create({
  name: "John Doe",
  email: "john.doe@example.com",
});

user.notify(new WelcomeNotification());
```

### File Storage

Powered by [Cloudflare R2](https://developers.cloudflare.com/r2/).

```ts
import { Storage } from "supercloud";

const contents = formData.get("avatar");

// Store a file
const path = await Storage.put("avatars/1", contents);

// Fetch a file
const exists = await Storage.exists(path);
const contents = await Storage.get(path);
const url = Storage.url(path);
```

### Live Video Streaming

Powered by [Cloudflare Stream](https://developers.cloudflare.com/stream/).

```ts
import { Stream } from "supercloud";

const stream = await Stream.create();

await ChatRoom.create({
  streamId: stream.id,
  creatorUrl: stream.creatorUrl,
  playerUrl: stream.playerUrl,
});
```

### Realtime Communication

Powered by [Cloudflare Durable Objects](https://developers.cloudflare.com/workers/learning/using-durable-objects).

### Task Scheduling

```ts
import { config, runSchedule } from "supercloud";

// index.ts
function configureSupercloud(env: Env) {
  return config({
    database: env.DB,
  });
}

export default {
  async fetch(request, env, ctx) {
    configureSupercloud(env);
    // ...
  }

  async scheduled(event, env, ctx) {
    configureSupercloud(env);
    await runSchedule(event, ctx, (schedule) => {
      schedule
        .job(new CleanUpBucketJob())
        .dailyAt("midnight")
        .timezone("America/New_York");
    });
  },
};
```
