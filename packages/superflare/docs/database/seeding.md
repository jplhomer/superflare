---
title: Seeding the Database
description: Learn how to seed your local database with Superflare.
---

## Introduction

When developing an application locally, it's helpful to be able to populate or "seed" you local database with test data to allow you to rapidly iterate on the user interface or other aspects of your application.

Superflare allows you to define a `seed.ts` file in your project's `db` folder which will be used to seed your local database when you run `npx superflare migrate --seed`.

## Creating a seed file

To create a new seed file, just add it to `db/seed.ts`:

```ts
import { seed } from "superflare";

export default seed(async () => {
  await Post.create({
    title: "Hello World",
  });
});
```

You can perform any actions you'd like within the seeder. It's up to you!

## Running the seeder

To run the seeder, run the following command:

```bash
npx superflare migrate --seed
```

It can be useful to run the seeder in conjunction with a fresh database. To do this, pass the `--fresh` or `-f` flag:

```bash
npx superflare migrate --fresh --seed
```

This ensures you don't run into any unique constraints with existing data.
