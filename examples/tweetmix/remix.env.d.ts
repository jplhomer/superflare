/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare" />

declare module "@remix-run/server-runtime" {
  export interface AppLoadContext {
    DB: D1Database;
  }
}
