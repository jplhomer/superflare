/// <reference types="@cloudflare/workers-types" />

declare module "__STATIC_CONTENT_MANIFEST" {
  const value: string;
  export default value;
}

interface Env {
  __STATIC_CONTENT: string;

  DB: D1Database;
  SESSION_SECRET?: string;
}
