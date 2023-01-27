/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare" />

import "@cloudflare/workers-types";

declare module "@remix-run/server-runtime" {
  export interface AppLoadContext {
    DB: D1Database;
  }
}
