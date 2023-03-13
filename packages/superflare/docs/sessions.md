---
title: Sessions
description: Storing information about users across requests with HTTP sessions.
---

Sessions provide a way to store information about users across requests. Superflare provides a `SuperflareSession` class which acts as a wrapper around a simple `Session` object.

The `SuperflareSession` instance keeps track of any changes to the session, and Superflare automatically commits the changes to the session store on the outgoing response.

## Creating a `SuperflareSession`

_The following examples assume you are using Remix. They will be updated when Superflare supports other frameworks._

To create a `SuperflareSession` instance, pass a valid `Session` instance:

```ts
// worker.ts

import { SuperflareSession } from "superflare";

// Create a Remix `session`...
const session = "...";

const superflareSession = new SuperflareSession(session);
```

Then, you can inject the session into your Remix `loadContext`:

```ts
// worker.ts

const loadContext = { session, env };

try {
  const config = getConfig({ request, env, ctx });

  return handleFetch(
    {
      config,
      session,
      getSessionCookie: () =>
        sessionStorage.commitSession(session.getSession()),
    },
    () => remixHandler(request, loadContext)
  );
} catch (error) {
  return new Response("Internal Server Error", { status: 500 });
}
```

## Using sessions

To use your sessions, you can pull the `session` out of your loader and action context you injected above:

```ts
export async function action({ context: { session } }) {
  session.set("theme", "dark");

  // ...
}

export async function loader({ context: { session } }) {
  const theme = session.get("theme");

  return json({ theme });
}
```

## Flash messages

You may want to issue a message to your session which disappears after it is read once. This is useful for things like displaying a success message after a form submission.

To do this, you can use the `flash` method:

```ts
export async function loader({ context: { session } }) {
  session.flash("success", "Your form was submitted successfully!");

  return json({ success: true });
}
```

Then, you can read the flash message in your action using the `getFlash` method:

```ts
export async function action({ context: { session } }) {
  const success = session.getFlash("success");

  return json({ success });
}
```

{% callout title="Using getFlash" %}
Superflare tracks when you modify a session and automatically commits the changes to the session store on the outgoing response. Since reading flash messages involves modifying the session, you should use `getFlash` to read flash messages and not `get` to ensure your session is updated.
{% /callout %}
