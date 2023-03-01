# Superflare's Design Principles

I build Superflare to scratch my own itch. I'm traditionally a PHP developer who's been working with Laravel for a long time. However, I've spent much of my time recently in the JavaScript framework space.

For years, we've heard that JavaScript frameworks can be used as a "full-stack" solution. Yet when folks start out with a Remix or Next.js app, they're left with only _some_ of that solution.

What about a database? What about queues? Sessions? Background jobs? Scheduled jobs? Email notifications? File uploads?

So far, the answer to this solution has been: "Use 60 different libraries and services of varying quality and hope they play well together in your framework and hosting runtime."

## Cloudflare as the "Supercloud"

Cloudflare's [self-branded "Supercloud"](https://blog.cloudflare.com/welcome-to-the-supercloud-and-developer-week-2022/) is a great example of the results you can achieve by investing years of development into platform primitives.

They started out as a (free!) CDN with (free!) SSL. That got folks in the door.

Then they introduced Workers. Cool, a way to run JavaScript on the edge for cheap. Still—a far cry from a full-stack solution

Then they introduced KV Storage. Neat, and powerful—but still limited and not even close to a typical relational database solution.

Then came Durable Objects. R2 Storage. Scheduled Workers. Queues. Email. _Getting closer_.

**Finally: D1**.

[D1](https://blog.cloudflare.com/introducing-d1/) is the last missing primitive to take developing applications on Cloudflare to the next level.

Because _so much_ of how we build web applications revolves around the data model of what we're building, it's critical that the database play a central role. We've seen success of Rails and Laravel for decades because of their powerful database abstractions, ActiveRecord and Eloquent.

I'm bullish on Cloudflare's future precisely because they've invested so heavily in these primitives. It may have taken a while to get here, and it may not have seemed like each piece would integrate with the other — but I think we'll see that it all fits together quite nicely.

## Building Superflare

Superflare is built with the following principles in mind:

### Vendor Lock-in

Superflare is built on top of Cloudflare's primitives. This means that you can't use Superflare without using Cloudflare. This can be a _good_ thing.

Other solutions try their hardest to be _vendor agnostic_, both in the way they are designed and in the way they are distributed and deployed.

By leaning into the lock-in, we're suddenly blessed with a much simpler solution for many things:

- Need storage? R2.
- Need database? D1.
- Need queues? Queues.

The list goes on and on. _Constraints are good_.

### D1 and a new ORM

Having a solid data model is the foundation of any application. Superflare is built around D1, and it's the first thing you'll interact with when building an application.

While D1 is still in its early days (a public alpha at the time of writing), other ORMs exist for D1 already. However, none of them has made me feel excited about using D1.

Maybe it's a matter of personal taste, but I really enjoy the ActiveRecord-style interactions with my data models! Getting posts is as simple as `await Post.all()`. No passing a database binding, no passing a JSON object of options, no passing a query builder.

Just `await Post.all()`.

This has its tradeoffs (see below), but I'm happy with it.

### No decorators

Other frameworks have embraced decorators as a way to add functionality to JavaScript classes. It's honestly very smart and probably the _correct_ way to do it in the long run.

However, decorators are still experimental! Plus, they introduce additional syntax that can be confusing to newcomers (and even little ol' me).

Superflare tries to play as "close to the metal" as possible when it comes to JavaScript and TypeScript. That's why database attributes are defined as a TypeScript `Interface` directly in the model file.

Again, there are tradeoffs, but:

No decorators in Superflare.

### Auth at the Center

Superflare is built around the idea that authentication is a core part of any application. It's not an afterthought.

That's why we ship a `User` class and a default `users` table migration with each new Superflare template.

Your app is going to have a `User`. You might as well embrace it.

I think Laravel gets this right. Because Laravel provides an opinionated authentication mechanism, it can provide several affordances to both internal and external applications that an agnostic framework wouldn't be able to.

On the other hand, Rails does not provide an authentication mechanism. You have to go hunting for some third-party gem whenever you want to add authentication to your app (which is usually right away).

## Tradeoffs

Here's why you might not want to use Superflare:

### Vendor lock-in

I think this is pretty obvious.

### New ORM

Hey, Prisma exists and kinda dominates this space. Why would you want to learn a new ORM just to use Superflare?

I don't blame ya. Plus, the fact that Superflare has weird commenty-things and colocates computer-generated code with your user-written models is a bit... weird.

### I'm building this for fun

I'm building this project to have fun and not to be perfect. It's for my personal enjoyment.

You might not want to use it because of this, which is fine. Or do. I don't care. I'm not your dad. (Unless I am, in which case: Hi Kids! Get back to bed!)
