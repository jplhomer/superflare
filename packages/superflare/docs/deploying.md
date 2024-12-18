---
title: Deploying
description: Deploying Superflare apps to production
---

## Introduction

To deploy your Superflare app to production, you'll need to use `npx wrangler`. Superflare doesn't provide any helpers at this time.

## Checklist

- Make sure you've run D1 migrations against your production database before deploying with `npx wrangler d1 migrations apply <DB_NAME> --remote`.
- Make sure you've set an `APP_KEY` secret with `npx wrangler secret put APP_KEY`.
