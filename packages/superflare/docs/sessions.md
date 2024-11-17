---
title: Sessions
description: Storing information about users across requests with HTTP sessions.
---

Sessions provide a way to store information about users across requests. Superflare provides a `SuperflareSession` class which acts as a wrapper around a simple `Session` object.

The `SuperflareSession` instance keeps track of any changes to the session, and Superflare automatically commits the changes to the session store on the outgoing response.

## Creating sessions

_The following instructions assume you are using Remix. They will be updated when Superflare supports other frameworks._

The `@superflare/remix` package exports `handleFetch`, which takes care of session creation and makes the session available on your Remix `AppContext` in deployed workers. There is an additional entry point, `@superflare/remix/dev`, that exports `superflareDevProxyVitePlugin` to provide the same automatic session handling in local dev when using the Vite dev server. See the [Getting Started](/getting-started) guide for details.

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
