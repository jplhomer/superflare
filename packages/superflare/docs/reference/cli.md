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

## `superflare dev`

The `dev` command starts a local development server for your Superflare app. It's effectively a wrapper around `wrangler dev --local`. It will be more useful in the context of Cloudflare Pages because all bindings are passed via CLI flags, which can be tedious to type out.

```bash
npx superflare dev
```

## `superflare generate`

## `superflare new`

## `superflare console`

## `superflare db`
