---
title: Model Relationships
---

## Relationships

Superflare allows you to define relationships between your models. You can then use these relationships to query related models or add related models to a model.

### One to One

A one-to-one relationship is a relationship between two models where one model belongs to another model. For example, a `User` model might have a `Profile` model which belongs to the `User` model.

To define a one-to-one relationship, use the `hasOne` method:

```ts
import { Model } from "superflare";
import { Profile } from "./Profile";

export class User extends Model {
  profile!: Profile | Promise<Profile>;
  $profile() {
    return this.hasOne(Profile);
  }
}
```

The first argument to the `hasOne` method is the model class of the related model. The second argument is the name of the foreign key on the related model. If you don't specify a foreign key, Superflare will use the name of the model followed by `Id`.

By default, Superflare does not load related models. You can load the relation on an existing instance by calling `await` on the relation property which matches the name of the relation definition:

```ts
const user = await User.find(1);

await user.profile;

// is the same as:
await user.$profile();
```

Once you have loaded the profile relation once, it will be cached on the `profile` property for future reference.

To define the inverse relationship, use the `belongsTo` method:

```ts
import { Model } from "superflare";

export class Profile extends Model {
  user!: User | Promise<User>;
  $user() {
    return this.belongsTo(User);
  }
}
```

When invoking the `$user()` method or awaiting the `user` property, Superflare will attempt to find a `Profile` model with a `userId` that matches the `id` of the `User` model:

```ts
const profile = await Profile.find(1);

await profile.user;
```

### One to Many

A one-to-many relationship is a relationship between two models where one model has many related models. For example, a `User` model might have many `Post` models.

To define a one-to-many relationship, use the `hasMany` method:

```ts
import { Model } from "superflare";

export class User extends Model {
  posts!: Post[] | Promise<Post[]>;
  $posts() {
    return this.hasMany(Post);
  }
}
```

You can then access the related models by awaiting the relation property:

```ts
const user = await User.find(1);

await user.posts;

for (const post of user.posts) {
  console.log(post.title);
}
```

To define the inverse relationship, use the `belongsTo` method:

```ts
import { Model } from "superflare";

export class Post extends Model {
  user!: User | Promise<User>;
  $user() {
    return this.belongsTo(User);
  }
}
```

When invoking the `$user()` method or awaiting the `user` property, Superflare will attempt to find a `Post` model with a `userId` that matches the `id` of the `User` model:

```ts
const post = await Post.find(1);

await post.user;
```

### Many to Many (soon!)

A many-to-many relationship is a relationship between two models where one model has many related models and the related models have many models. For example, a `Post` model might have many `Tag` models and a `Tag` model might have many `Post` models.

The table structure for a many-to-many relationship is often referred to as a "join table." The join table contains two foreign keys which reference the primary keys of the two models. The join table might look like this:

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE post_tags (
  postId INTEGER NOT NULL,
  tagId INTEGER NOT NULL,
  PRIMARY KEY (postId, tagId),
  FOREIGN KEY (postId) REFERENCES posts (id),
  FOREIGN KEY (tagId) REFERENCES tags (id)
);
```

To define a many-to-many relationship, use the `belongsToMany` method:

```ts
import { Model } from "superflare";

export class Post extends Model {
  tags!: Tag[] | Promise<Tag[]>;
  $tags() {
    return this.belongsToMany(Tag);
  }
}
```

You can then access the related models by awaiting the relation property:

```ts
const post = await Post.find(1);

await post.tags;

for (const tag of post.tags) {
  console.log(tag.name);
}
```

When invoking the `$tags()` method or awaiting the `tags` property, Superflare will check an intermediate table, often referred to as a "join table," for rows which have a `postId` that matches the `id` of the `Post` model. It will return all `Tag` models which have a `id` that matches the `tagId` of the join table rows.

To define the inverse relationship, use the `belongsToMany` method again:

```ts
import { Model } from "superflare";

export class Tag extends Model {
  posts!: Post[] | Promise<Post[]>;
  $posts() {
    return this.belongsToMany(Post);
  }
}
```

## Eager Loading

Superflare allows you to eager load related models. This is useful when you want to load related models without having to make multiple queries, a problem often referred to as "N + 1".

To eager load related models, use the `with` method:

```ts
const users = await User.with("profile").get();
```

You can also eager load multiple relations:

```ts
const users = await User.with("profile", "posts").get();
```

It is particularly important to eager-load related models when passing a model instance to a view.

Most front-end frameworks like Remix and Next.js will call `JSON.stringify` on the model instance, but this will **not** load related models automatically.

If you don't eager load the related models, the related data will not be available in your view:

```tsx
import { User } from "~/models/User";
import { json } from "@remix-run/cloudflare";

export async function loader() {
  // ❌ The profile relation will not be loaded
  const user = await User.find(1);

  // ✅ This will load the profile relation for the view
  const user = await User.with("profile").find(1);

  return json({ user });
}

export default function UserView() {
  const user = useLoaderData().user;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.profile.bio}</p>
    </div>
  );
}
```

## Inserting and Updating Related Models

### The `save` Method

The `save` method is used to add new models to a relationship:

```ts
const user = await User.find(1);
const post = new Post({ title: "Hello World" });

await user.$posts().save(post);
```

You must use the `$` prefixed relationship function definition when saving or creating related models.

### The `create` Method

The `create` method is used to create and add new models to a relationship:

```ts
const user = await User.find(1);

await user.$posts().create({ title: "Hello World" });
```

### Belongs To Relationships

If you'd like to assign a child model to a parent model, you can use the `associate` method:

```ts
const user = await User.find(1);
const profile = new Profile({ bio: "Hello World" });

profile.$user().associate(user);
await profile.save();
```

To remove the association, use the `dissociate` method:

```ts
profile.$user().dissociate();
await profile.save();
```
