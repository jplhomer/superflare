---
title: Superflare CLI
description: All the bells and whistles in the Superflare CLI
---

## Introduction

The Superflare CLI is a tool for building out your local Superflare app. In most cases, it's a wrapper around the [`wrangler` CLI](https://developers.cloudflare.com/workers/wrangler/), but it also provides some additional functionality.

```bash
$ npx superflare

Commands:
  superflare migrate           🏗️ Migrate your database and update types
  superflare dev [entrypoint]  🏄 Start the development server
  superflare generate          🌇 Scaffold useful things  [aliases: g]
  superflare new [name]        🎸 Create a new Superflare project
  superflare console           🔮 Open an interactive developer console  [aliases: c]
  superflare db                🗄️ Manage your database

Options:
  -v, --version  Show version number  [boolean]
  -h, --help     Show help  [boolean]
```

## `superflare migrate`

The `migrate` command is one of the more useful commands in the Superflare CLI.

By default, it:

1. Compiles your Superflare TS [migrations](/database/migrations) to Wrangler SQL migrations
2. (Optional with `-f`) Drops your local development database
3. Migrates your local database with `npx wrangler d1 migrations apply DB`
4. (Optional with `-s`) [Seeds](/database/seeding) your local database
5. Parses the column types in your local database and syncs them to `superflare.env.d.ts` to be used by your [Models](/models)

It takes the binding name of your D1 database as a positional argument, which is `DB` by default:

```bash
npx superflare migrate DB
```

Superflare’s `migrate` command is intended for use in development, both for managing your local database (e.g. wiping it clean to start fresh, seeding it, running migrations) and for creating the TypeScript types to match your database schema. To run your migrations in production when you are ready to deploy your latest, use wrangler directly:

```bash
npx wrangler d1 migrations apply DB --remote
```

## `superflare dev`

The `dev` command starts a local development server for your Superflare app. It’s a wrapper around two commands: `remix vite:dev` (starts the main Vite dev server) and `wrangler dev -j` (enables working with [Durable Object bindings](https://developers.cloudflare.com/workers/wrangler/api/#supported-bindings)). You can use it directly or put it in your `package.json`’s scripts: `"dev": "superflare dev"`.

## `superflare generate`

Scaffold useful things in your Superflare app:

```bash
$ superflare generate

🌇 Scaffold useful things

Commands:
  superflare g job <name>        Generate a Job
  superflare g migration <name>  Generate a Migration
  superflare g model <name>      Generate a Model
```

### `superflare generate job`

Generates a new [Job](/queues) with the given name.

### `superflare generate migration`

Generates a new [Migration](/database/migrations) with the given name.

### `superflare generate model`

Generates a new [Model](/models) with the given name.

**Optional**: `-m` or `--migration` will generate a migration for the model as well.

## `superflare new`

Allows you to create a new Superflare app.

## `superflare console`

Opens an interactive developer console for your Superflare app. You can access all your [models](/models) and perform queries against your local database.

## `superflare db`

```bash
$ superflare db

🗄️ Manage your database

Commands:
  superflare db seed  🌱  Seed your database with data

```

### `superflare db seed`

Seeds your local database with data from your [seed file](/database/seeding).
