---
title: "Hashing"
---

## Introduction

Superflare provides a `hash()` helper powered by `bcrypt` to help you hash passwords and other sensitive data.

## Basic Usage

### Hashing passwords

To hash a value like a password, use the `hash().make()` helper:

```ts
import { hash } from "superflare";

const hashed = await hash().make("my-password");
```

### Verifying a password matches a hash

To verify a value, use the `hash().check()` helper:

```ts
import { hash } from "superflare";

const isCorrect = await hash().check("my-password", hashed);
```
