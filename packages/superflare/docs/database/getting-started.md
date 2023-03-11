---
title: Getting Started with D1 Models
---

This documentation describes how to use Superflare's [D1 Models](/models).

## Model Attributes

Any properties defined on your model are accessible on the model instance:

```ts
import { Model } from "superflare";

export class Post extends Model {
  get upperTitle() {
    return this.title.toUpperCase();
  }

  toJSON(): PostRow {
    return super.toJSON();
  }
}

export interface Post extends PostRow {}

const post = new Post();

post.title = "Hello World";

console.log(post.title); // "Hello World"
console.log(post.upperTitle); // "HELLO WORLD"
```

### Primary Key

The primary key of a model is always `id`. You can't change it. Because I said so.

### Timestamps

Superflare automatically adds `createdAt` and `updatedAt` timestamps to all models. These are automatically updated by Superflare.

If you want to disable this behavior, you can set `timestamps` to `false` in your model:

```ts
import { Model } from "superflare";

export class Post extends Model {
  static timestamps = false;
}
```

### Serializing Models to JSON

We live in a full-stack framework world, where UI can be written as modular components (like React and Vue) and can be shared and rendered on both the server and the client.

However, we cannot simply send the entire data model over the wire from the server to the client — this would mean huge client bundle sizes and loads of security issues.

Instead, modern frameworks will serialize the output sent (from "loaders" in Remix, or passed as props from server components to client components in Next.js).

Superflare makes it obvious how to serialize your models as JSON by providing the standard `toJSON()` method by on new models.

By default, this method will return all of the model's attributes, in addition to any relations that are loaded on the instance either manually or by using eager-loading.

You can override this method to customize the JSON output:

```ts
import { Model } from "superflare";

export class Post extends Model {
  toJSON(): Pick<PostRow, "title" | "body"> {
    return {
      title: this.title,
      body: this.body,
    };
  }
}
```

Be sure to update the return type of the `toJSON` method to match the return type of your custom implementation. Front-end frameworks will use this type to determine the shape of the serialized data that is consumed in the actual UI layer.

### Hidden Attributes

In some cases, you might want to hide sensitive data from appearing in the serialized versions of your models. For example, you might want to hide a user's `password` from appearing in the serialized version of a `User` model.

While other ORM tools provide a way to define "hidden" attributes at the model level, Superflare assumes that you will update the `toJSON` method to customize the serialized output of your models.

```ts
import { Model } from "superflare";

export class User extends Model {
  toJSON(): Omit<UserRow, "password"> {
    const { password, ...rest } = super.toJSON();
    return rest;
  }
}
```

### Computed fields

In some cases, you might want to add a field to your model that is not stored in the database. For example, you might want to add a `fullName` field to your `User` model that is the combination of the `firstName` and `lastName` fields.

You can do this by defining a getter method on your model:

```ts
import { Model } from "superflare";

export class User extends Model {
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  toJSON(): UserRow & { fullName: string } {
    return {
      ...super.toJSON(),
      fullName: this.fullName,
    };
  }
}
```

### Casting Attributes

Superflare does not provide a mechanism for defining custom attribute cast behavior. By default, it will convert any date fields in the database to JavaScript `Date` objects, and back to their original shape when `toJSON` is called.

If you need to customize the casting behavior for a specific attribute, you can override the `toJSON` method:

```ts
import { Model } from "superflare";

export class User extends Model {
  toJSON(): UserRow {
    const json = super.toJSON();
    json.createdAt = json.createdAt.toISOString();
    return json;
  }
}
```

## Querying Models

### Find

To find a model by its primary key, use the `find` method:

```ts
const post = await Post.find(1);
```

You can also find multiple models by passing an array of primary keys:

```ts
const posts = await Post.find([1, 2, 3]);
```

### Where

To find a model by a specific attribute, use the `where` method:

```ts
const post = await Post.where("title", "Hello World");
```

### Where In

To find a model which matches one of many specific attributes, use the `whereIn` method:

```ts
const post = await Post.whereIn("title", ["Hello World", "Hello Universe"]);
```

### All

To find all models, use the `all` method:

```ts
const posts = await Post.all();
```

### First

To find the first model, use the `first` method:

```ts
const post = await Post.first();
```

## Creating Models

To create a new model, use the `create` method:

```ts
const post = await Post.create({
  title: "Hello World",
  body: "This is my first post!",
});
```

You can also instantiate a new model and then `save` it:

```ts
const post = new Post({
  title: "Hello World",
  body: "This is my first post!",
});

await post.save();
```

## Updating Models

To update a model, use the `save` method:

```ts
const post = await Post.find(1);

post.title = "Hello World";

await post.save();
```

You can also update multiple model attributes by passing an object to the `update` method:

```ts
const post = await Post.find(1);

await post.update({
  title: "Hello World",
  body: "This is my first post!",
});
```

## Deleting Models

To delete a model, use the `delete` method:

```ts
const post = await Post.find(1);

await post.delete();
```
