---
title: Database Migrations
description: Find out how to use database migrations with Superflare.
---

## Introduction

Migrations are a way to modify your database schema. Migrations are written in TypeScript and are compiled to SQL statements.

## Creating a migration

To create a new migration, run the following command:

```bash
npx superflare generate migration <name>
```

This will create a new migration file in your project's `db/migrations` folder. You should then update the file to return one or more `Schema` instances which represent migrations to your database:

```ts
import { Schema } from "superflare";

export default () => {
  return Schema.create("posts", (table) => {
    table.increments("id");
    table.string("title");
    table.timestamps();
  });
};
```

{% callout title="No rollbacks, plz" %}
You'll notice Superflare doesn't offer an `up` and `down` method like other libraries. This means you should plan on not rolling back migrations. Instead, design your database schema changes to be incremental so that you can roll forward.
{% /callout %}

When you run `npx superflare migrate`, Superflare will compile a TypeScript migration to a SQL migration file which is used by Wrangler to modify your D1 database:

```sql
create table posts (
  id integer primary key,
  title text not null,
  createdAt timestamp not null default current_timestamp
  updatedAt timestamp not null default current_timestamp
);
```

## Running migrations

To run migrations, run the following command:

```bash
npx superflare migrate
```

To automatically create [Models](/models) from your database tables, pass the `--create` or `-c` flag:

```bash
npx superflare migrate --create
```

You can also choose to drop the existing database and create fresh tables by passing the `--fresh` or `-f` flag. This is mostly useful during prototyping and early development phases of a project:

```bash
npx superflare migrate --fresh
```

## Tables

### Creating Tables

Tables are created using the `Schema.create` method:

```ts
import { Schema } from "superflare";

export default () => {
  return Schema.create("posts", (table) => {
    table.increments("id");
    table.string("title");
    table.timestamps();
  });
};
```

### Updating Tables

Tables are updated using the `Schema.update` method:

```ts
import { Schema } from "superflare";

export default () => {
  return Schema.update("posts", (table) => {
    // Add a new text column named "body"
    table.text("body");
  });
};
```

### Renaming Tables

Tables are renamed using the `Schema.rename` method:

```ts
import { Schema } from "superflare";

export default () => {
  return Schema.rename("posts", "articles");
};
```

### Dropping Tables

Tables are dropped using the `Schema.drop` method:

```ts
import { Schema } from "superflare";

export default () => {
  return Schema.drop("posts");
};
```

## Columns

### Creating Columns

When creating or updating a table, columns can be created by calling methods on the `SchemaBuilder` instance passed to the closure in `Schema.create` or `Schema.update`:

```ts
import { Schema } from "superflare";

export default () => {
  return Schema.update("posts", (table) => {
    table.integer("views");
  });
};
```

### Available Column Types

D1, which is based on SQLite, only supports a handful of column types. However, you can still define columns like you're used to defining in other databases, because that is a nice thing that humans like to do.

{% callout title="Column Lengths" %}
Column lengths aren't a thing in SQLite. Pretty wild, right? Just don't worry about defining them and live your life, my friend.
{% /callout %}

#### `blob`

This is a blob of stuff. It's a binary column.

#### `boolean`

This is a boolean column. It can be `true` or `false`. But really, it's just an integer column that resolves to `0` or `1`.

#### `date`

This is a date column. It's a string column that stores dates in the format `YYYY-MM-DD`.

#### `dateTime`

This is a date-time column. It's a string column that stores dates in the format `YYYY-MM-DD HH:MM:SS`.

#### `increments`

This is an auto-incrementing integer column. It's a primary key column that increments by 1 each time a new row is inserted.

#### `float`

This is a floating point number column. It's a number column that can store decimal values.

#### `integer`

This is an integer column. It's a number column that can store whole numbers.

#### `string`

This is a string column. It's literally the same thing as `text`, so you could just use that. Or not. It's up to you.

#### `text`

This is a text column. It's a string column that can store a lot of text.

#### `timestamps`

This is a fun helper! It creates _two_ columns: `createdAt` and `updatedAt`. They're both date-time columns that are automatically set to the current date-time when a new row is inserted or an existing row is updated.

### Renaming Columns

You can rename a column with the `renameColumn` command:

```ts
import { Schema } from "superflare";

export default () => {
  return Schema.update("posts", (table) => {
    table.renameColumn("views", "pageViews");
  });
};
```

### Dropping Columns

You can drop a column with the `dropColumn` command:

```ts
import { Schema } from "superflare";

export default () => {
  return Schema.update("posts", (table) => {
    table.dropColumn("views");
  });
};
```

## Running multiple statements

You can run multiple statements in a single migration by returning an array of `Schema` instances:

```ts
import { Schema } from "superflare";

export default () => {
  return [
    Schema.create("posts", (table) => {
      table.increments("id");
      table.string("title");
      table.timestamps();
    }),
    Schema.create("comments", (table) => {
      table.increments("id");
      table.string("body");
      table.timestamps();
    }),
  ];
};
```
