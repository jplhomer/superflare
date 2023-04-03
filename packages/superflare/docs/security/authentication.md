---
title: Authentication
description: Find out how to use Superflare's Authentication system
---

## Introduction

Authentication is something you're probably gonna want to have in your application. This ensures users can register and log in to your application and see things that weirdo anons cannot.

You can also add _Authorization_, which is different than Authentication, and ensures that users can only access resources they are allowed to access. Superflare doesn't offer anything in terms of Authorization, but you can do whatever you want.

However, Superflare takes the stance that **authentication should be built in**, so it is.

## Set up Authentication

To set up authentication, you need to do a few things:

1. Add a `User` model (and a `users` table)
2. Ensure you've created an instance of [`SuperflareSession`](/sessions)
3. Create an instance of `SuperflareAuth` (with a session) and pass it to a place your application code can access it during a request (like a Remix `AppContext`).
4. Add some sort of `/register` and `/login` routes to your application so users can log in.

{% callout title="Batteries-included" %}
If you've created a Superflare app with `npx superflare new`, you should already have these requirements met! Go take a nap or something.
{% /callout %}

## Register and Login pages

Superflare provides basic `/register` and `/login` routes and forms for you to use. You can use these as-is, or you can copy the code and modify it to your liking.

## Protecting routes

You can protect routes by using the `SuperflareAuth` instance you created in your app's entrypoint. For the purpose of this example, we'll pretend you're using Remix, and that you've injected the `SuperflareAuth` instance into the `AppContext` as `auth`:

```ts
// routes/my-secret-route.tsx
export async function loader({ context: { auth } }: LoaderArgs) {
  // If the user is not logged in, redirect them to the login page
  if (!(await auth.check(User))) {
    return redirect("/login");
  }

  const user = await auth.user(User);

  // If the user is logged in, show them the secret page
  return json({ message: `You're logged in, ${user.name}!` });
}
```

## Logging out

To log out, you can use the `SuperflareAuth` instance's `logout()` method:

```ts
// routes/logout.tsx
export async function action({ context: { auth } }: LoaderArgs) {
  auth.logout();

  return redirect("/login");
}
```

## `SuperflareAuth` API

### `check(model: typeof Model): Promise<boolean>`

Checks if the user is logged in. Returns `true` if they are, `false` if they are not.

### `user(model: typeof Model): Promise<Model|null>`

Returns the user model instance for the logged in user. If the user is not logged in, this will return `null`.

### `logout(): void`

Logs the user out.

### `id(): string|null`

Returns the ID of the logged in user. If the user is not logged in, this will return `null`.

### `login(model: typeof Model): void`

Logs the user in. Mostly helpful on login actions, but you could use this for OAuth or third-party login flows.

### `attempt(model: typeof Model, credentials: {email: string, password: string}): Promise<boolean>`

Attempts to log the user in with the given credentials. Returns `true` if the user was logged in, `false` if they were not.
