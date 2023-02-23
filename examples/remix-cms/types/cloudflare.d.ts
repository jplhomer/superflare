/// <reference types="@cloudflare/workers-types" />

interface Env {
  CF_PAGES?: 1;
  DB: D1Database;
  SESSION_SECRET: string;
}
