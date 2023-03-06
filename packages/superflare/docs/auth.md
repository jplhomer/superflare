---
title: Authentication
---

Superflare comes with a built-in, password-based authentication system powered by the `User` model. New Superflare app templates also include barebones Login and Register forms to get you started quickly.

## Authenticating Users

Superflare exposes the `auth()` helper to authenticate users.

To authenticate a user, use the `auth().attempt(User, credentials)` method:

```ts
import { auth } from "superflare";

if (await auth().attempt(User, { email, password })) {
  console.log("User authenticated!");
  return redirect("/");
}
```
